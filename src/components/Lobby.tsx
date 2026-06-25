import React, { useState } from 'react';
import { Plus, LogIn } from 'lucide-react';

interface LobbyProps {
  onCreate: (name: string, matchTime: number, maxPlayers: number) => void;
  onJoin: (name: string, roomId: string) => void;
}

export function Lobby({ onCreate, onJoin }: LobbyProps) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [matchTime, setMatchTime] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return setError('Please enter your name');
    onCreate(name, matchTime, maxPlayers);
  };

  const handleJoin = () => {
    if (!name.trim()) return setError('Please enter your name');
    if (!roomId.trim()) return setError('Please enter a room ID');
    onJoin(name, roomId.toUpperCase());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        <h1 className="text-4xl font-black text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
          CURSOR SOCCER
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Player Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="Enter your name..."
              maxLength={15}
            />
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-300">
              <Plus className="w-5 h-5 mr-2" />
              Create Room
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Match Time (s)</label>
                <input
                  type="number"
                  value={matchTime}
                  onChange={(e) => setMatchTime(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                  min={30}
                  max={300}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Players</label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                  min={2}
                  max={10}
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Create New Game
            </button>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-300">
              <LogIn className="w-5 h-5 mr-2" />
              Join Room
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none uppercase font-mono"
                placeholder="ROOM ID"
                maxLength={6}
              />
              <button
                onClick={handleJoin}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
