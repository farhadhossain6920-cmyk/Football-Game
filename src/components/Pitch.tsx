import React, { useEffect, useRef, useState } from 'react';
import { Room, Player, ChatMessage } from '../types';
import confetti from 'canvas-confetti';
import { ChatBox } from './ChatBox';

interface PitchProps {
  room: Room;
  me: Player;
  onCursorMove: (x: number, y: number) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  goalEvent: string | null;
}

const PITCH_WIDTH = 800;
const PITCH_HEIGHT = 500;
const BALL_RADIUS = 15;
const CURSOR_RADIUS = 20;
const GOAL_WIDTH = 120;

export function Pitch({ room, me, onCursorMove, chatMessages, onSendMessage, goalEvent }: PitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (goalEvent) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: goalEvent === 'A' ? ['#22d3ee', '#ffffff'] : ['#f87171', '#ffffff'],
        zIndex: 100
      });
    }
  }, [goalEvent]);

  // Handle local mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    onCursorMove(x, y);
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
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
      Object.values(room.players).forEach(p => {
        if (p.x < 0 || p.y < 0) return; // ignore if off-pitch
        
        ctx.save();
        ctx.translate(p.x, p.y);

        // Draw selection ring for "me"
        if (p.id === me.id) {
          ctx.beginPath();
          ctx.arc(0, 0, CURSOR_RADIUS + 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)'; // amber-400
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Drop shadow
        ctx.beginPath();
        ctx.arc(2, 4, CURSOR_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        // Determine player color based on team if assigned, otherwise their random color
        let playerColor = p.color;
        if (p.team === 'A') playerColor = '#06b6d4'; // cyan-500
        if (p.team === 'B') playerColor = '#ef4444'; // red-500

        const skin = p.skin || 'classic';

        if (skin === 'robot') {
          // Draw robot shoulders (square-ish)
          ctx.beginPath();
          ctx.rect(-CURSOR_RADIUS, -CURSOR_RADIUS, CURSOR_RADIUS*2, CURSOR_RADIUS*2);
          const jerseyGradient = ctx.createLinearGradient(-CURSOR_RADIUS, -CURSOR_RADIUS, CURSOR_RADIUS, CURSOR_RADIUS);
          jerseyGradient.addColorStop(0, '#94a3b8');
          jerseyGradient.addColorStop(0.5, playerColor);
          jerseyGradient.addColorStop(1, '#475569');
          ctx.fillStyle = jerseyGradient;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#334155';
          ctx.stroke();

          // Robot head
          ctx.beginPath();
          ctx.rect(-CURSOR_RADIUS*0.5, -CURSOR_RADIUS*0.5, CURSOR_RADIUS, CURSOR_RADIUS);
          ctx.fillStyle = '#cbd5e1';
          ctx.fill();
          ctx.stroke();
          // Eye (visor)
          ctx.beginPath();
          ctx.rect(-CURSOR_RADIUS*0.3, -CURSOR_RADIUS*0.1, CURSOR_RADIUS*0.6, CURSOR_RADIUS*0.2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        } else if (skin === 'ninja') {
          // Ninja shoulders
          ctx.beginPath();
          ctx.arc(0, 0, CURSOR_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = playerColor;
          ctx.stroke();

          // Head with headband
          ctx.beginPath();
          ctx.arc(0, 0, CURSOR_RADIUS * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#fde68a';
          ctx.fill();
          ctx.stroke();
          
          // Headband
          ctx.beginPath();
          ctx.rect(-CURSOR_RADIUS*0.45, -CURSOR_RADIUS*0.15, CURSOR_RADIUS*0.9, CURSOR_RADIUS*0.3);
          ctx.fillStyle = playerColor;
          ctx.fill();
          // Eye slit
          ctx.beginPath();
          ctx.rect(-CURSOR_RADIUS*0.2, -CURSOR_RADIUS*0.05, CURSOR_RADIUS*0.4, CURSOR_RADIUS*0.1);
          ctx.fillStyle = '#1e293b';
          ctx.fill();
        } else if (skin === 'cat') {
          // Cat shoulders
          ctx.beginPath();
          ctx.arc(0, 0, CURSOR_RADIUS, 0, Math.PI * 2);
          const jerseyGradient = ctx.createRadialGradient(0, -CURSOR_RADIUS*0.3, 0, 0, 0, CURSOR_RADIUS);
          jerseyGradient.addColorStop(0, 'rgba(255,255,255,0.4)');
          jerseyGradient.addColorStop(0.3, playerColor);
          jerseyGradient.addColorStop(1, 'rgba(0,0,0,0.5)');
          ctx.fillStyle = jerseyGradient;
          ctx.fill();
          ctx.stroke();

          // Cat ears
          ctx.beginPath();
          ctx.moveTo(-CURSOR_RADIUS*0.3, -CURSOR_RADIUS*0.3);
          ctx.lineTo(-CURSOR_RADIUS*0.6, -CURSOR_RADIUS*0.8);
          ctx.lineTo(0, -CURSOR_RADIUS*0.4);
          ctx.moveTo(CURSOR_RADIUS*0.3, -CURSOR_RADIUS*0.3);
          ctx.lineTo(CURSOR_RADIUS*0.6, -CURSOR_RADIUS*0.8);
          ctx.lineTo(0, -CURSOR_RADIUS*0.4);
          ctx.fillStyle = playerColor;
          ctx.fill();
          ctx.stroke();

          // Head
          ctx.beginPath();
          ctx.arc(0, 0, CURSOR_RADIUS * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#fde68a';
          ctx.fill();
          ctx.stroke();
          // Whiskers
          ctx.beginPath();
          ctx.moveTo(-CURSOR_RADIUS*0.2, 0); ctx.lineTo(-CURSOR_RADIUS*0.6, -CURSOR_RADIUS*0.1);
          ctx.moveTo(-CURSOR_RADIUS*0.2, CURSOR_RADIUS*0.1); ctx.lineTo(-CURSOR_RADIUS*0.6, CURSOR_RADIUS*0.2);
          ctx.moveTo(CURSOR_RADIUS*0.2, 0); ctx.lineTo(CURSOR_RADIUS*0.6, -CURSOR_RADIUS*0.1);
          ctx.moveTo(CURSOR_RADIUS*0.2, CURSOR_RADIUS*0.1); ctx.lineTo(CURSOR_RADIUS*0.6, CURSOR_RADIUS*0.2);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Classic Shoulders
          ctx.beginPath();
          ctx.arc(0, 0, CURSOR_RADIUS, 0, Math.PI * 2);
          const jerseyGradient = ctx.createRadialGradient(0, -CURSOR_RADIUS*0.3, 0, 0, 0, CURSOR_RADIUS);
          jerseyGradient.addColorStop(0, 'rgba(255,255,255,0.4)');
          jerseyGradient.addColorStop(0.3, playerColor);
          jerseyGradient.addColorStop(1, 'rgba(0,0,0,0.5)');
          ctx.fillStyle = jerseyGradient;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.stroke();

          // Classic Head
          ctx.beginPath();
          ctx.arc(0, 0, CURSOR_RADIUS * 0.45, 0, Math.PI * 2);
          const headGradient = ctx.createRadialGradient(0, -2, 0, 0, 0, CURSOR_RADIUS * 0.45);
          headGradient.addColorStop(0, '#fde68a');
          headGradient.addColorStop(1, '#d97706');
          ctx.fillStyle = headGradient;
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.stroke();
        }

        // Player Name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(p.name.substring(0, 10), 0, -CURSOR_RADIUS - 8);

        ctx.restore();
      });

      // Draw ball
      const ball = room.ball;
      ctx.save();
      ctx.translate(ball.x, ball.y);
      
      // Calculate rotation based on position
      const rotation = (ball.x + ball.y) * 0.05;
      ctx.rotate(rotation);

      // White base
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      // Center black pentagon
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const px = Math.cos(angle) * BALL_RADIUS * 0.35;
        const py = Math.sin(angle) * BALL_RADIUS * 0.35;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Lines and outer shapes
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        
        // Lines from corners of pentagon
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * BALL_RADIUS * 0.35, Math.sin(angle) * BALL_RADIUS * 0.35);
        ctx.lineTo(Math.cos(angle) * BALL_RADIUS * 0.7, Math.sin(angle) * BALL_RADIUS * 0.7);
        ctx.stroke();

        // Outer dark shapes at the edge
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * BALL_RADIUS, Math.sin(angle) * BALL_RADIUS, BALL_RADIUS * 0.3, angle + Math.PI - 0.5, angle + Math.PI + 0.5);
        ctx.lineTo(Math.cos(angle) * BALL_RADIUS * 0.7, Math.sin(angle) * BALL_RADIUS * 0.7);
        ctx.fill();
      }

      // Add a subtle shadow/highlight for 3D effect
      const gradient = ctx.createRadialGradient(-BALL_RADIUS*0.3, -BALL_RADIUS*0.3, BALL_RADIUS*0.1, 0, 0, BALL_RADIUS);
      gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.restore();

      // Time remaining on canvas
      const timeMins = Math.floor(room.timeRemaining / 60);
      const timeSecs = Math.floor(room.timeRemaining % 60).toString().padStart(2, '0');
      
      ctx.save();
      ctx.fillStyle = room.timeRemaining <= 10 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.2)';
      ctx.font = 'bold 80px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${timeMins}:${timeSecs}`, PITCH_WIDTH / 2, 20);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [room]); // Re-render when room updates

  const teamAPlayers = Object.values(room.players).filter(p => p.team === 'A');
  const teamBPlayers = Object.values(room.players).filter(p => p.team === 'B');

  const teamAName = teamAPlayers.length === 1 ? teamAPlayers[0].name.toUpperCase() : "TEAM A";
  const teamBName = teamBPlayers.length === 1 ? teamBPlayers[0].name.toUpperCase() : "TEAM B";

  const mins = Math.floor(room.timeRemaining / 60);
  const secs = Math.floor(room.timeRemaining % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4">
      {/* Scoreboard */}
      <div className="w-full max-w-4xl grid grid-cols-3 items-center mb-6 px-2 md:px-6">
        {/* Team A */}
        <div className="flex flex-col md:flex-row items-center md:justify-start gap-2 md:gap-6">
          <div className="text-xl md:text-3xl font-black text-cyan-400 truncate max-w-[150px] md:max-w-[200px]" title={teamAName}>{teamAName}</div>
          <div className="text-3xl md:text-5xl font-mono bg-slate-900 px-4 py-1 md:px-6 md:py-2 rounded-lg border border-slate-800 text-white">
            {room.score.teamA}
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-slate-400 text-[10px] md:text-sm mb-1 uppercase tracking-widest text-center">Time Remaining</div>
          <div className={`text-2xl md:text-4xl font-mono ${room.timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
            {mins}:{secs}
          </div>
        </div>

        {/* Team B */}
        <div className="flex flex-col md:flex-row-reverse items-center md:justify-start gap-2 md:gap-6">
          <div className="text-xl md:text-3xl font-black text-red-400 truncate max-w-[150px] md:max-w-[200px]" title={teamBName}>{teamBName}</div>
          <div className="text-3xl md:text-5xl font-mono bg-slate-900 px-4 py-1 md:px-6 md:py-2 rounded-lg border border-slate-800 text-white">
            {room.score.teamB}
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

        {/* Player Stats Overlay */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 pointer-events-none bg-slate-900/60 backdrop-blur-sm rounded p-2 md:p-3 border border-slate-700/50 shadow-lg w-32 md:w-56 z-10 hidden sm:block">
          <h3 className="text-[10px] md:text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Player Stats</h3>
          <div className="space-y-1.5 md:space-y-2">
            {Object.values(room.players)
              .sort((a, b) => ((b.goals || 0) * 10 + (b.touches || 0)) - ((a.goals || 0) * 10 + (a.touches || 0)))
              .map(p => (
              <div key={p.id} className="flex items-center justify-between text-[10px] md:text-xs">
                <div className="flex items-center space-x-1.5 md:space-x-2 truncate flex-1 pr-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.team === 'A' ? '#06b6d4' : p.team === 'B' ? '#ef4444' : p.color }} />
                  <span className="text-slate-200 truncate font-medium">{p.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400 flex-shrink-0">
                  <span title="Goals" className="flex items-center"><span className="text-emerald-500 mr-0.5 text-[10px] md:text-xs">⚽</span>{p.goals || 0}</span>
                  <span title="Touches" className="flex items-center"><span className="text-amber-500 mr-0.5 text-[10px] md:text-xs">👟</span>{p.touches || 0}</span>
                </div>
              </div>
            ))}
          </div>
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
                <div className="text-cyan-400 font-bold mb-2 truncate max-w-[150px] mx-auto">{teamAName}</div>
                <div className="text-6xl font-mono text-white">{room.score.teamA}</div>
              </div>
              <div className="text-slate-500 text-3xl font-light">-</div>
              <div className="text-center">
                <div className="text-red-400 font-bold mb-2 truncate max-w-[150px] mx-auto">{teamBName}</div>
                <div className="text-6xl font-mono text-white">{room.score.teamB}</div>
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

      <ChatBox messages={chatMessages} onSendMessage={onSendMessage} />
    </div>
  );
}
