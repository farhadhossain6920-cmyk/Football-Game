import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import { Room } from './types';
import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { Pitch } from './components/Pitch';

export default function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      setRoom(null);
    };

    const onRoomUpdated = (updatedRoom: Room) => {
      setRoom(updatedRoom);
    };

    const onGameStarted = (updatedRoom: Room) => {
      setRoom(updatedRoom);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('roomUpdated', onRoomUpdated);
    socket.on('gameStarted', onGameStarted);
    // Note: gameState is handled entirely within Pitch component
    socket.on('gameEnded', onRoomUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('roomUpdated', onRoomUpdated);
      socket.off('gameStarted', onGameStarted);
      socket.off('gameEnded', onRoomUpdated);
      socket.disconnect();
    };
  }, []);

  if (!connected) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        Connecting to Server...
      </div>
    );
  }

  if (!room) {
    return <Lobby onJoin={setRoom} />;
  }

  if (room.status === 'waiting') {
    return <WaitingRoom room={room} />;
  }

  return <Pitch room={room} />;
}
