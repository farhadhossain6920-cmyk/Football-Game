import express from "express";
import http from "http";
import path from "path";
import { Server, Socket } from "socket.io";
import { createServer as createViteServer } from "vite";
import { Player, Room } from "./src/types";

const PORT = 3000;

const rooms: Record<string, Room> = {};

const PITCH_WIDTH = 800;
const PITCH_HEIGHT = 500;
const BALL_RADIUS = 15;
const CURSOR_RADIUS = 20;
const GOAL_WIDTH = 120;

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomColor() {
  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function resetBall(room: Room) {
  room.ball = {
    x: PITCH_WIDTH / 2,
    y: PITCH_HEIGHT / 2,
    vx: 0,
    vy: 0,
  };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  app.use(express.json());

  // Socket.io logic
  io.on("connection", (socket: Socket) => {
    socket.on("createRoom", ({ name, maxPlayers, matchTime }, callback) => {
      const roomId = generateRoomId();
      rooms[roomId] = {
        id: roomId,
        hostId: socket.id,
        players: {},
        maxPlayers: Math.max(2, Math.min(10, maxPlayers || 4)),
        matchTime: Math.max(30, Math.min(300, matchTime || 60)),
        timeRemaining: Math.max(30, Math.min(300, matchTime || 60)),
        status: "waiting",
        ball: { x: PITCH_WIDTH / 2, y: PITCH_HEIGHT / 2, vx: 0, vy: 0 },
        score: { teamA: 0, teamB: 0 },
        lastTick: Date.now()
      };
      
      const player: Player = {
        id: socket.id,
        name: name || "Player",
        color: getRandomColor(),
        score: 0,
        x: -100,
        y: -100,
      };
      
      rooms[roomId].players[socket.id] = player;
      socket.join(roomId);
      callback({ success: true, roomId, room: rooms[roomId] });
      io.to(roomId).emit("roomUpdated", rooms[roomId]);
    });

    socket.on("joinRoom", ({ roomId, name }, callback) => {
      const room = rooms[roomId];
      if (!room) {
        return callback({ success: false, error: "Room not found" });
      }
      if (room.status !== "waiting") {
        return callback({ success: false, error: "Game already started" });
      }
      if (Object.keys(room.players).length >= room.maxPlayers) {
        return callback({ success: false, error: "Room is full" });
      }

      const player: Player = {
        id: socket.id,
        name: name || "Player",
        color: getRandomColor(),
        score: 0,
        x: -100,
        y: -100,
      };
      
      room.players[socket.id] = player;
      socket.join(roomId);
      callback({ success: true, room });
      io.to(roomId).emit("roomUpdated", room);
    });

    socket.on("startGame", (roomId) => {
      const room = rooms[roomId];
      if (room && room.hostId === socket.id && room.status === "waiting") {
        room.status = "playing";
        resetBall(room);
        room.score = { teamA: 0, teamB: 0 };
        room.timeRemaining = room.matchTime;
        room.lastTick = Date.now();
        io.to(roomId).emit("gameStarted", room);
      }
    });

    socket.on("cursorMove", ({ roomId, x, y }) => {
      const room = rooms[roomId];
      if (room && room.players[socket.id] && room.status === "playing") {
        room.players[socket.id].x = x;
        room.players[socket.id].y = y;
        // Broadcast cursor movement to others (optional, maybe too much bandwidth)
        // We will just sync everything in the tick
      }
    });

    socket.on("sendMessage", ({ roomId, text }) => {
      const room = rooms[roomId];
      if (room && room.players[socket.id]) {
        const player = room.players[socket.id];
        const message = {
          id: Math.random().toString(36).substring(2, 9),
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          text: text.substring(0, 100),
          timestamp: Date.now()
        };
        io.to(roomId).emit("chatMessage", message);
      }
    });

    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (room.players[socket.id]) {
          delete room.players[socket.id];
          if (Object.keys(room.players).length === 0) {
            delete rooms[roomId];
          } else {
            if (room.hostId === socket.id) {
              room.hostId = Object.keys(room.players)[0];
            }
            io.to(roomId).emit("roomUpdated", room);
          }
        }
      }
    });
  });

  // Game Loop
  setInterval(() => {
    const now = Date.now();
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.status !== "playing") continue;

      const dt = (now - room.lastTick) / 1000;
      room.lastTick = now;

      // Update timer
      room.timeRemaining -= dt;
      if (room.timeRemaining <= 0) {
        room.status = "ended";
        room.timeRemaining = 0;
        io.to(roomId).emit("gameEnded", room);
        continue;
      }

      // Physics
      const ball = room.ball;
      
      // Apply friction
      ball.vx *= 0.98;
      ball.vy *= 0.98;

      // Cursor collisions
      for (const playerId in room.players) {
        const p = room.players[playerId];
        if (p.x < 0 || p.y < 0) continue; // Not on pitch

        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < BALL_RADIUS + CURSOR_RADIUS) {
          // Push ball away
          const force = 10;
          const pushX = (dx / dist) * force;
          const pushY = (dy / dist) * force;
          ball.vx += pushX;
          ball.vy += pushY;
        }
      }

      // Update position
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall collisions & Goals
      const goalTop = PITCH_HEIGHT / 2 - GOAL_WIDTH / 2;
      const goalBottom = PITCH_HEIGHT / 2 + GOAL_WIDTH / 2;

      // Left Wall
      if (ball.x - BALL_RADIUS < 0) {
        if (ball.y > goalTop && ball.y < goalBottom) {
          // Goal Team B (Right Team)
          room.score.teamB += 1;
          io.to(roomId).emit("goalScored", { team: "B", room });
          resetBall(room);
        } else {
          ball.x = BALL_RADIUS;
          ball.vx *= -0.8;
        }
      }

      // Right Wall
      if (ball.x + BALL_RADIUS > PITCH_WIDTH) {
        if (ball.y > goalTop && ball.y < goalBottom) {
          // Goal Team A (Left Team)
          room.score.teamA += 1;
          io.to(roomId).emit("goalScored", { team: "A", room });
          resetBall(room);
        } else {
          ball.x = PITCH_WIDTH - BALL_RADIUS;
          ball.vx *= -0.8;
        }
      }

      // Top/Bottom Walls
      if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy *= -0.8;
      }
      if (ball.y + BALL_RADIUS > PITCH_HEIGHT) {
        ball.y = PITCH_HEIGHT - BALL_RADIUS;
        ball.vy *= -0.8;
      }

      // Broadcast state
      io.to(roomId).emit("gameState", {
        ball: room.ball,
        players: room.players,
        timeRemaining: room.timeRemaining,
        score: room.score,
      });
    }
  }, 1000 / 30); // 30 fps

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
