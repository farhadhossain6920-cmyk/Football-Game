import React from 'react';
import { Room, Player } from '../types';
import { Play, Copy, Check, Users, Shield } from 'lucide-react';

interface WaitingRoomProps {
  room: Room;
  me: Player;
  onStart: () => void;
  onJoinTeam: (team: 'A' | 'B' | 'none') => void;
}

export function WaitingRoom({ room, me, onStart, onJoinTeam }: WaitingRoomProps) {
  const [copied, setCopied] = React.useState(false);
  
  const isHost = room.hostId === me.id;
  const players = Object.values(room.players);

  const teamA = players.filter(p => p.team === 'A');
  const teamB = players.filter(p => p.team === 'B');
  const unassigned = players.filter(p => p.team === 'none');

  const handleCopy = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPlayer = (p: Player) => (
    <div key={p.id} className="flex items-center space-x-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
      <span className="font-medium truncate">{p.name}</span>
      {p.id === room.hostId && (
        <span className="ml-auto text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full flex-shrink-0">
          Host
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-4xl bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Team A */}
          <div className="bg-slate-900 rounded-lg p-4 border border-cyan-900/50">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-cyan-400 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Team A
              </h2>
              <span className="text-slate-500 text-sm">{teamA.length}</span>
            </div>
            <div className="space-y-3 mb-4">
              {teamA.map(renderPlayer)}
              {teamA.length === 0 && <div className="text-slate-500 italic text-sm text-center py-2">Empty</div>}
            </div>
            {me.team !== 'A' && (
              <button 
                onClick={() => onJoinTeam('A')}
                className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 rounded border border-cyan-800 transition text-sm font-bold"
              >
                Join Team A
              </button>
            )}
          </div>

          {/* Unassigned */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-300 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Unassigned
              </h2>
              <span className="text-slate-500 text-sm">{unassigned.length}</span>
            </div>
            <div className="space-y-3 mb-4">
              {unassigned.map(renderPlayer)}
              {unassigned.length === 0 && <div className="text-slate-500 italic text-sm text-center py-2">Empty</div>}
            </div>
             {me.team !== 'none' && (
              <button 
                onClick={() => onJoinTeam('none')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-700 transition text-sm font-bold"
              >
                Leave Team
              </button>
            )}
          </div>

          {/* Team B */}
          <div className="bg-slate-900 rounded-lg p-4 border border-red-900/50">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-red-400 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Team B
              </h2>
              <span className="text-slate-500 text-sm">{teamB.length}</span>
            </div>
            <div className="space-y-3 mb-4">
              {teamB.map(renderPlayer)}
              {teamB.length === 0 && <div className="text-slate-500 italic text-sm text-center py-2">Empty</div>}
            </div>
             {me.team !== 'B' && (
              <button 
                onClick={() => onJoinTeam('B')}
                className="w-full py-2 bg-red-950 hover:bg-red-900 text-red-400 rounded border border-red-800 transition text-sm font-bold"
              >
                Join Team B
              </button>
            )}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onStart}
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
