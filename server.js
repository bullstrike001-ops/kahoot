const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const MAX_USERS = 40;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'kahoot-admin-2026';

// Track connected players (socket ids)
const connectedUsers = new Set();

app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });

app.get('/', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('joinGame', (nickname) => {
    if (connectedUsers.size >= MAX_USERS) {
      socket.emit('roomFull');
      return;
    }

    // Validate and sanitize nickname server-side
    const sanitized = String(nickname || '').replace(/[<>"'&]/g, '').trim().slice(0, 20);
    if (!sanitized) return;

    connectedUsers.add(socket.id);
    socket.data.nickname = sanitized;
    console.log(`Player joined: ${socket.data.nickname} (${socket.id})`);

    // Notify all clients of updated user count
    io.emit('userCountUpdate', connectedUsers.size);
  });

  socket.on('startGame', (secret) => {
    if (secret !== ADMIN_SECRET) {
      console.warn(`Unauthorized startGame attempt from ${socket.id}`);
      return;
    }
    console.log('Game started by admin');
    io.emit('gameStarted');
  });

  socket.on('disconnect', () => {
    const wasPlayer = connectedUsers.has(socket.id);
    connectedUsers.delete(socket.id);
    console.log(`Disconnected: ${socket.id}`);

    if (wasPlayer) {
      io.emit('userCountUpdate', connectedUsers.size);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
});
