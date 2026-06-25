import React, { useEffect, useRef, useState } from 'react';
import { Room } from '../types';
import { socket } from '../socket';
import confetti from 'canvas-confetti';
import { ChatBox } from './ChatBox';

interface PitchProps {
  room: Room;
}

const PITCH_WIDTH = 800;
const PITCH_HEIGHT = 500;
const BALL_RADIUS = 15;
const CURSOR_RADIUS = 20;
const GOAL_WIDTH = 120;

export function Pitch({ room }: PitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(room);
  
  const [score, setScore] = useState(room.score);
  const [timeRemaining, setTimeRemaining] = useState(room.timeRemaining);
  const [goalEvent, setGoalEvent] = useState<string | null>(null);

  useEffect(() => {
    stateRef.current = room;
    setScore(room.score);
    setTimeRemaining(room.timeRemaining);
  }, [room]);

  useEffect(() => {
    const handleGameState = (state: any) => {
      stateRef.current.ball = state.ball;
      stateRef.current.players = state.players;
      setScore(state.score);
      setTimeRemaining(state.timeRemaining);
    };

    const handleGoal = ({ team }: { team: string }) => {
      setGoalEvent(team);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: team === 'A' ? ['#22d3ee', '#ffffff'] : ['#f87171', '#ffffff'],
        zIndex: 100
      });
      setTimeout(() => setGoalEvent(null), 2000);
    };

    socket.on('gameState', handleGameState);
    socket.on('goalScored', handleGoal);

    return () => {
      socket.off('gameState', handleGameState);
      socket.off('goalScored', handleGoal);
    };
  }, []);

  // Handle local mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    socket.emit('cursorMove', { roomId: room.id, x, y });
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const state = stateRef.current;
      
      // Clear pitch
      ctx.fillStyle = '#166534'; // emerald-800
      ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

      // Draw pitch lines
      ctx.strokeStyle = '#4ade80'; // emerald-400
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Center line
      ctx.moveTo(PITCH_WIDTH / 2, 0);
      ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT);
      ctx.stroke();

      // Center circle
      ctx.beginPath();
      ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 70, 0, Math.PI * 2);
      ctx.stroke();
      
      // Goals
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      const goalTop = PITCH_HEIGHT / 2 - GOAL_WIDTH / 2;
      // Left Goal
      ctx.fillRect(0, goalTop, 40, GOAL_WIDTH);
      ctx.strokeRect(0, goalTop, 40, GOAL_WIDTH);
      // Right Goal
      ctx.fillRect(PITCH_WIDTH - 40, goalTop, 40, GOAL_WIDTH);
      ctx.strokeRect(PITCH_WIDTH - 40, goalTop, 40, GOAL_WIDTH);

      // Draw players
      Object.values(state.players).forEach(p => {
        if (p.x < 0 || p.y < 0) return; // ignore if off-pitch
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, CURSOR_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x, p.y - CURSOR_RADIUS - 5);
        ctx.restore();
      });

      // Draw ball
      const ball = state.ball;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000';
      ctx.stroke();
      // Ball pattern (simple pentagon-ish lines)
      ctx.beginPath();
      ctx.moveTo(ball.x - 5, ball.y - 5);
      ctx.lineTo(ball.x + 5, ball.y + 5);
      ctx.moveTo(ball.x + 5, ball.y - 5);
      ctx.lineTo(ball.x - 5, ball.y + 5);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [room.id]);

  const mins = Math.floor(timeRemaining / 60);
  const secs = Math.floor(timeRemaining % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4">
      {/* Scoreboard */}
      <div className="w-full max-w-4xl grid grid-cols-3 items-center mb-6 px-2 md:px-6">
        {/* Team A */}
        <div className="flex flex-col md:flex-row items-center md:justify-start gap-2 md:gap-6">
          <div className="text-xl md:text-3xl font-black text-cyan-400">TEAM A</div>
          <div className="text-3xl md:text-5xl font-mono bg-slate-900 px-4 py-1 md:px-6 md:py-2 rounded-lg border border-slate-800 text-white">
            {score.teamA}
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-slate-400 text-[10px] md:text-sm mb-1 uppercase tracking-widest text-center">Time Remaining</div>
          <div className={`text-2xl md:text-4xl font-mono ${timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
            {mins}:{secs}
          </div>
        </div>

        {/* Team B */}
        <div className="flex flex-col md:flex-row-reverse items-center md:justify-start gap-2 md:gap-6">
          <div className="text-xl md:text-3xl font-black text-red-400">TEAM B</div>
          <div className="text-3xl md:text-5xl font-mono bg-slate-900 px-4 py-1 md:px-6 md:py-2 rounded-lg border border-slate-800 text-white">
            {score.teamB}
          </div>
        </div>
      </div>

      {/* Pitch Area */}
      <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-emerald-900/20 border-4 border-slate-800 cursor-crosshair w-full max-w-4xl">
        <canvas
          ref={canvasRef}
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT}
          onMouseMove={handleMouseMove}
          className="bg-emerald-800 touch-none block w-full h-auto"
          style={{ aspectRatio: `${PITCH_WIDTH}/${PITCH_HEIGHT}` }}
        />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <span className="text-3xl md:text-6xl font-black text-white mix-blend-overlay uppercase tracking-widest text-center px-4">
            CURSOR SOCCER
          </span>
        </div>

        {/* Goal Overlay */}
        {goalEvent && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-in fade-in zoom-in duration-300">
            <div className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] italic tracking-tighter">
              GOAL!
            </div>
          </div>
        )}
      </div>

      {/* Game Over Screen */}
      {room.status === 'ended' && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10 backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 text-center shadow-2xl">
            <h2 className="text-4xl font-black text-white mb-6">MATCH ENDED</h2>
            <div className="flex justify-center items-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-cyan-400 font-bold mb-2">Team A</div>
                <div className="text-6xl font-mono text-white">{score.teamA}</div>
              </div>
              <div className="text-slate-500 text-3xl font-light">-</div>
              <div className="text-center">
                <div className="text-red-400 font-bold mb-2">Team B</div>
                <div className="text-6xl font-mono text-white">{score.teamB}</div>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      <ChatBox room={room} />
    </div>
  );
}
