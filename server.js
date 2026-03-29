const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Rate limit page routes (100 requests per 15 minutes per IP)
const pageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Game PIN — randomly generated at server start
const GAME_PIN = String(Math.floor(100000 + Math.random() * 900000));

// In-memory state
let gameState = 'lobby'; // lobby | countdown | reveal
let players = [];
let countdownTimer = null;
let countdownValue = 10;

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', pageLimiter, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/join', pageLimiter, (req, res) => res.sendFile(path.join(__dirname, 'public', 'join.html')));
app.get('/host', pageLimiter, (req, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));

io.on('connection', (socket) => {
  // Send current state to new connection
  socket.emit('init', {
    pin: GAME_PIN,
    state: gameState,
    players: players,
    countdown: countdownValue,
  });

  // Player joining
  socket.on('join-game', ({ pin, nickname, avatar }) => {
    if (pin !== GAME_PIN) {
      socket.emit('join-error', { message: 'Invalid PIN. Please try again.' });
      return;
    }
    if (gameState !== 'lobby') {
      socket.emit('join-error', { message: 'Game has already started.' });
      return;
    }

    const player = { id: socket.id, nickname, avatar };
    players.push(player);

    socket.emit('join-success', { nickname, avatar });

    // Broadcast updated player list to everyone
    io.emit('player-list', { players });
  });

  // Host starts the game
  socket.on('start-game', () => {
    if (gameState !== 'lobby') return;

    gameState = 'countdown';
    countdownValue = 10;

    // Broadcast phase change to ALL clients (host, display, players)
    io.emit('phase-change', { state: 'countdown', countdown: countdownValue });

    // Run countdown on server, broadcast each tick
    countdownTimer = setInterval(() => {
      countdownValue--;
      if (countdownValue > 0) {
        io.emit('countdown-tick', { countdown: countdownValue });
      } else {
        clearInterval(countdownTimer);
        countdownTimer = null;
        gameState = 'reveal';
        io.emit('phase-change', { state: 'reveal' });
      }
    }, 1000);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const idx = players.findIndex((p) => p.id === socket.id);
    if (idx !== -1) {
      players.splice(idx, 1);
      io.emit('player-list', { players });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
