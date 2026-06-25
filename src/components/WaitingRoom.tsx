import React from 'react';
import { Room } from '../types';
import { socket } from '../socket';
import { Play, Copy, Check, Users } from 'lucide-react';

interface WaitingRoomProps {
  room: Room;
}

export function WaitingRoom({ room }: WaitingRoomProps) {
  const [copied, setCopied] = React.useState(false);
  
  const isHost = room.hostId === socket.id;
  const players = Object.values(room.players);

  const handleCopy = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    socket.emit('startGame', room.id);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-2xl bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Waiting Room</h1>
            <div className="flex items-center space-x-3">
              <span className="text-slate-400">Room Code:</span>
              <button 
                onClick={handleCopy}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-700 px-3 py-1.5 rounded-md font-mono text-xl text-emerald-400 border border-slate-600 transition"
              >
                <span>{room.id}</span>
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-slate-400 text-sm">Match Time</div>
            <div className="text-2xl font-mono">{room.matchTime}s</div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center border-b border-slate-800 pb-2">
            <Users className="w-5 h-5 mr-2" />
            Players ({players.length}/{room.maxPlayers})
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {players.map(p => (
              <div key={p.id} className="flex items-center space-x-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="font-medium truncate">{p.name}</span>
                {p.id === room.hostId && (
                  <span className="ml-auto text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">
                    Host
                  </span>
                )}
              </div>
            ))}
            {Array.from({ length: room.maxPlayers - players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-slate-500 border-dashed">
                <div className="w-4 h-4 rounded-full bg-slate-700" />
                <span className="italic">Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={players.length < 1}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition text-lg"
          >
            <Play className="w-6 h-6" />
            <span>Start Match</span>
          </button>
        ) : (
          <div className="text-center p-4 text-slate-400 bg-slate-900 rounded-lg border border-slate-700">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
