import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { ChatMessage, Room } from '../types';
import { MessageSquare, X } from 'lucide-react';

interface ChatBoxProps {
  room: Room;
}

export function ChatBox({ room }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('chatMessage', handleChatMessage);
    return () => {
      socket.off('chatMessage', handleChatMessage);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    socket.emit('sendMessage', { roomId: room.id, text: input.trim() });
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl mb-4 w-72 md:w-80 h-96 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-200 text-sm flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-emerald-400" />
              Match Chat
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center">
                No messages yet. Say hello!
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="font-bold" style={{ color: m.playerColor }}>
                    {m.playerName}:{' '}
                  </span>
                  <span className="text-slate-200 break-words">{m.text}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              maxLength={100}
            />
          </form>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
        
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 border-2 border-slate-950 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}
