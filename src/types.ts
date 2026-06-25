export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  text: string;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  skin: string;
  score: number;
  touches: number;
  goals: number;
  x: number;
  y: number;
  team: 'A' | 'B' | 'none';
  role?: 'player' | 'gk';
}

export interface Room {
  id: string;
  hostId: string;
  players: Record<string, Player>;
  maxPlayers: number;
  matchTime: number; // in seconds
  timeRemaining: number;
  status: "waiting" | "playing" | "ended";
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    lastTouchedId?: string;
    lastTouchTime?: number;
  };
  score: {
    teamA: number;
    teamB: number;
  };
  hasGoalkeepers?: boolean;
  lastTick: number;
}
