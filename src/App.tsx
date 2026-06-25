import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabase';
import { Room, Player, ChatMessage } from './types';
import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { Pitch } from './components/Pitch';
import { RealtimeChannel } from '@supabase/supabase-js';

const PITCH_WIDTH = 800;
const PITCH_HEIGHT = 500;
const BALL_RADIUS = 15;
const CURSOR_RADIUS = 20;
const GOAL_WIDTH = 120;

export default function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [me, setMe] = useState<Player | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [goalEvent, setGoalEvent] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    if (!room || !me || room.hostId !== me.id || room.status !== 'playing' || !channel) return;

    let lastTick = Date.now();
    const interval = setInterval(() => {
      const currentRoom = roomRef.current;
      if (!currentRoom || currentRoom.status !== 'playing') return;

      const now = Date.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;

      const updatedRoom = { ...currentRoom };
      
      updatedRoom.timeRemaining -= dt;
      if (updatedRoom.timeRemaining <= 0) {
        updatedRoom.status = "ended";
        updatedRoom.timeRemaining = 0;
        setRoom(updatedRoom);
        channel.send({ type: 'broadcast', event: 'gameState', payload: updatedRoom });
        return;
      }

      const ball = { ...updatedRoom.ball };
      ball.vx *= 0.98;
      ball.vy *= 0.98;

      for (const playerId in updatedRoom.players) {
        const p = updatedRoom.players[playerId];
        if (p.x < 0 || p.y < 0) continue;

        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < BALL_RADIUS + CURSOR_RADIUS) {
          const force = 10;
          ball.vx += (dx / dist) * force;
          ball.vy += (dy / dist) * force;
        }
      }

      ball.x += ball.vx;
      ball.y += ball.vy;

      const goalTop = PITCH_HEIGHT / 2 - GOAL_WIDTH / 2;
      const goalBottom = PITCH_HEIGHT / 2 + GOAL_WIDTH / 2;
      let goalScored: 'A' | 'B' | null = null;

      if (ball.x - BALL_RADIUS < 0) {
        if (ball.y > goalTop && ball.y < goalBottom) {
          updatedRoom.score.teamB += 1;
          goalScored = 'B';
        } else {
          ball.x = BALL_RADIUS;
          ball.vx *= -0.8;
        }
      }

      if (ball.x + BALL_RADIUS > PITCH_WIDTH) {
        if (ball.y > goalTop && ball.y < goalBottom) {
          updatedRoom.score.teamA += 1;
          goalScored = 'A';
        } else {
          ball.x = PITCH_WIDTH - BALL_RADIUS;
          ball.vx *= -0.8;
        }
      }

      if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy *= -0.8;
      }
      if (ball.y + BALL_RADIUS > PITCH_HEIGHT) {
        ball.y = PITCH_HEIGHT - BALL_RADIUS;
        ball.vy *= -0.8;
      }

      if (goalScored) {
        ball.x = PITCH_WIDTH / 2;
        ball.y = PITCH_HEIGHT / 2;
        ball.vx = 0;
        ball.vy = 0;
        channel.send({ type: 'broadcast', event: 'goalScored', payload: { team: goalScored } });
        setGoalEvent(goalScored);
        setTimeout(() => setGoalEvent(null), 2000);
      }

      updatedRoom.ball = ball;
      setRoom(updatedRoom);
      channel.send({ type: 'broadcast', event: 'gameState', payload: updatedRoom });

    }, 1000 / 30);

    return () => clearInterval(interval);
  }, [room?.status, me?.id, channel]);

  const handleCreateRoom = (name: string, matchTime: number, maxPlayers: number) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("placeholder")) {
      alert("Please configure Supabase environment variables (.env) first!");
      return;
    }

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const myId = crypto.randomUUID();
    const newMe: Player = { id: myId, name, color: getRandomColor(), score: 0, x: -100, y: -100 };
    setMe(newMe);

    const newRoom: Room = {
      id: roomId,
      hostId: myId,
      players: { [myId]: newMe },
      maxPlayers,
      matchTime,
      timeRemaining: matchTime,
      status: 'waiting',
      ball: { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2, vx: 0, vy: 0 },
      score: { teamA: 0, teamB: 0 },
      lastTick: Date.now()
    };
    
    setRoom(newRoom);
    joinChannel(roomId, newRoom, newMe, true);
  };

  const handleJoinRoom = (name: string, roomId: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("placeholder")) {
      alert("Please configure Supabase environment variables (.env) first!");
      return;
    }
    const myId = crypto.randomUUID();
    const newMe: Player = { id: myId, name, color: getRandomColor(), score: 0, x: -100, y: -100 };
    setMe(newMe);
    joinChannel(roomId, null, newMe, false);
  };

  const joinChannel = (roomId: string, initialRoom: Room | null, myPlayer: Player, isHost: boolean) => {
    const newChannel = supabase.channel(`room-${roomId}`);
    setChannel(newChannel);

    newChannel
      .on('broadcast', { event: 'gameState' }, ({ payload }) => {
        if (!isHost || (roomRef.current && roomRef.current.hostId !== myPlayer.id)) {
          setRoom(payload);
        }
      })
      .on('broadcast', { event: 'playerJoined' }, ({ payload }) => {
        if (roomRef.current && roomRef.current.hostId === myPlayer.id) {
          const r = { ...roomRef.current };
          r.players[payload.id] = payload;
          setRoom(r);
          newChannel.send({ type: 'broadcast', event: 'gameState', payload: r });
        }
      })
      .on('broadcast', { event: 'cursorMove' }, ({ payload }) => {
        if (roomRef.current && roomRef.current.hostId === myPlayer.id) {
          const r = { ...roomRef.current };
          if (r.players[payload.id]) {
            r.players[payload.id].x = payload.x;
            r.players[payload.id].y = payload.y;
            setRoom(r);
          }
        }
      })
      .on('broadcast', { event: 'chatMessage' }, ({ payload }) => {
        setChatMessages(prev => [...prev, payload]);
      })
      .on('broadcast', { event: 'goalScored' }, ({ payload }) => {
        setGoalEvent(payload.team);
        setTimeout(() => setGoalEvent(null), 2000);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!isHost) {
            newChannel.send({ type: 'broadcast', event: 'playerJoined', payload: myPlayer });
          }
        }
      });
  };

  const startGame = () => {
    if (room && room.hostId === me?.id) {
      const updated = { ...room, status: 'playing' as const, timeRemaining: room.matchTime, ball: { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2, vx: 0, vy: 0 }, score: { teamA: 0, teamB: 0 } };
      setRoom(updated);
      channel?.send({ type: 'broadcast', event: 'gameState', payload: updated });
    }
  };

  const sendCursorMove = (x: number, y: number) => {
    if (room?.hostId === me?.id) {
      const r = { ...room };
      if (r.players[me.id]) {
        r.players[me.id].x = x;
        r.players[me.id].y = y;
        setRoom(r);
      }
    } else {
      channel?.send({ type: 'broadcast', event: 'cursorMove', payload: { id: me?.id, x, y } });
    }
  };

  const sendChatMessage = (text: string) => {
    if (!me) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      playerId: me.id,
      playerName: me.name,
      playerColor: me.color,
      text,
      timestamp: Date.now()
    };
    channel?.send({ type: 'broadcast', event: 'chatMessage', payload: msg });
    setChatMessages(prev => [...prev, msg]);
  };

  if (!room) {
    return <Lobby onCreate={handleCreateRoom} onJoin={handleJoinRoom} />;
  }

  if (room.status === 'waiting') {
    return <WaitingRoom room={room} me={me!} onStart={startGame} />;
  }

  return (
    <Pitch 
      room={room} 
      me={me!} 
      onCursorMove={sendCursorMove} 
      chatMessages={chatMessages} 
      onSendMessage={sendChatMessage}
      goalEvent={goalEvent}
    />
  );
}

function getRandomColor() {
  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  return colors[Math.floor(Math.random() * colors.length)];
}
