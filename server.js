const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// In-memory game state
let gameState = {
  pin: generatePin(),
  players: [],
  phase: 'lobby',
  countdownValue: 10,
  countdownInterval: null,
};

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function resetGame() {
  if (gameState.countdownInterval) {
    clearInterval(gameState.countdownInterval);
  }
  gameState = {
    pin: generatePin(),
    players: [],
    phase: 'lobby',
    countdownValue: 10,
    countdownInterval: null,
  };
}

const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
  '#00D2D3', '#FF9F43', '#EE5A24', '#0ABDE3',
];

function assignColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes for HTML pages (ADD THESE LINES)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/join', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'join.html'));
});

app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

// QR Code endpoint
app.get('/qrcode', async (req, res) => {
  try {
    const pin = gameState.pin;
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}/join?pin=${pin}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#1a0533', light: '#ffffff' },
    });
    res.json({ dataUrl, url });
  } catch (err) {
    console.error('QR code error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Game state endpoint
app.get('/state', (req, res) => {
  res.json({
    pin: gameState.pin,
    players: gameState.players,
    phase: gameState.phase,
    countdownValue: gameState.countdownValue,
    playerCount: gameState.players.length,
  });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.emit('state-update', {
    pin: gameState.pin,
    players: gameState.players,
    phase: gameState.phase,
    countdownValue: gameState.countdownValue,
  });

  socket.on('player-join', ({ nickname, avatar, pin }) => {
    if (pin !== gameState.pin) {
      socket.emit('join-error', { message: 'Invalid PIN. Please check and try again.' });
      return;
    }
    if (gameState.phase !== 'lobby') {
      socket.emit('join-error', { message: 'Game has already started.' });
      return;
    }
    const trimmed = nickname ? nickname.trim() : '';
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
      socket.emit('join-error', { message: 'Nickname must be 2–20 characters.' });
      return;
    }
    if (gameState.players.find((p) => p.nickname.toLowerCase() === trimmed.toLowerCase())) {
      socket.emit('join-error', { message: 'That nickname is already taken!' });
      return;
    }

    const player = {
      id: socket.id,
      nickname: trimmed,
      avatar: avatar || '🎮',
      color: assignColor(gameState.players.length),
      joinedAt: Date.now(),
    };

    gameState.players.push(player);
    socket.join('game');

    console.log(`[join] ${trimmed} joined (total: ${gameState.players.length})`);

    socket.emit('join-success', { player });

    io.emit('players-update', {
      players: gameState.players,
      playerCount: gameState.players.length,
    });
  });

  socket.on('host-start', () => {
    if (gameState.phase !== 'lobby') return;
    if (gameState.players.length === 0) {
      socket.emit('host-error', { message: 'No players have joined yet!' });
      return;
    }

    gameState.phase = 'countdown';
    gameState.countdownValue = 10;

    console.log('[game] countdown started');

    io.emit('phase-change', { phase: 'countdown', countdownValue: 10 });

    gameState.countdownInterval = setInterval(() => {
      gameState.countdownValue -= 1;

      if (gameState.countdownValue <= 0) {
        clearInterval(gameState.countdownInterval);
        gameState.countdownInterval = null;
        gameState.phase = 'reveal';
        io.emit('phase-change', { phase: 'reveal', countdownValue: 0 });
        console.log('[game] reveal triggered');
      } else {
        io.emit('countdown-tick', { value: gameState.countdownValue });
      }
    }, 1000);
  });

  socket.on('host-reset', () => {
    console.log('[game] reset');
    resetGame();
    io.emit('game-reset', {
      pin: gameState.pin,
      players: [],
      phase: 'lobby',
    });
  });

  socket.on('disconnect', () => {
    const index = gameState.players.findIndex((p) => p.id === socket.id);
    if (index !== -1) {
      const player = gameState.players[index];
      gameState.players.splice(index, 1);
      console.log(`[leave] ${player.nickname} disconnected`);
      io.emit('players-update', {
        players: gameState.players,
        playerCount: gameState.players.length,
      });
    }
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Live Quiz Platform running on port ${PORT}`);
  console.log(`   Game PIN: ${gameState.pin}`);
  console.log(`   Main screen: http://localhost:${PORT}`);
  console.log(`   Join: http://localhost:${PORT}/join`);
  console.log(`   Host: http://localhost:${PORT}/host`);
});
