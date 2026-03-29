const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN }
});

const PORT = process.env.PORT || 3000;

// In-memory game state
let gameState = {
  pin: generatePin(),
  players: [],
  status: 'waiting', // waiting | countdown | reveal
  countdownValue: 10
};

let countdownInterval = null;

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const AVATAR_COLORS = [
  '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
  '#85C1E9', '#82E0AA', '#F1948A', '#F0B27A', '#AED6F1'
];

function assignColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API: Get game info
app.get('/api/game', (req, res) => {
  res.json({
    pin: gameState.pin,
    playerCount: gameState.players.length,
    status: gameState.status
  });
});

// API: Generate QR code
app.get('/api/qrcode', async (req, res) => {
  try {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const url = `${protocol}://${host}/join?pin=${gameState.pin}`;
    const qr = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: '#1a0533', light: '#ffffff' }
    });
    res.json({ qr, url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Socket.IO
io.on('connection', (socket) => {
  // Send current state on connect
  socket.emit('game:state', {
    pin: gameState.pin,
    players: gameState.players,
    status: gameState.status,
    countdownValue: gameState.countdownValue
  });

  // Player joins
  socket.on('player:join', ({ pin, nickname, avatar }) => {
    if (pin !== gameState.pin) {
      socket.emit('join:error', { message: 'Invalid game PIN. Please try again.' });
      return;
    }

    if (gameState.status !== 'waiting') {
      socket.emit('join:error', { message: 'Game has already started!' });
      return;
    }

    const existingPlayer = gameState.players.find(p => p.nickname.toLowerCase() === nickname.toLowerCase());
    if (existingPlayer) {
      socket.emit('join:error', { message: 'Nickname already taken. Choose another!' });
      return;
    }

    if (!nickname || nickname.trim().length < 1 || nickname.trim().length > 20) {
      socket.emit('join:error', { message: 'Nickname must be 1–20 characters.' });
      return;
    }

    const player = {
      id: socket.id,
      nickname: nickname.trim(),
      avatar,
      color: assignColor(gameState.players.length)
    };

    gameState.players.push(player);

    socket.emit('join:success', { player });
    io.emit('players:update', { players: gameState.players });
  });

  // Host starts game
  socket.on('host:start', () => {
    if (gameState.status !== 'waiting') return;
    if (gameState.players.length === 0) {
      socket.emit('host:error', { message: 'No players have joined yet!' });
      return;
    }

    gameState.status = 'countdown';
    gameState.countdownValue = 10;

    io.emit('game:countdown', { value: gameState.countdownValue });

    countdownInterval = setInterval(() => {
      gameState.countdownValue--;
      if (gameState.countdownValue > 0) {
        io.emit('game:countdown', { value: gameState.countdownValue });
      } else {
        clearInterval(countdownInterval);
        countdownInterval = null;
        gameState.status = 'reveal';
        io.emit('game:reveal');
      }
    }, 1000);
  });

  // Host resets game
  socket.on('host:reset', () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    gameState = {
      pin: generatePin(),
      players: [],
      status: 'waiting',
      countdownValue: 10
    };
    io.emit('game:reset', { pin: gameState.pin });
  });

  // Disconnect cleanup
  socket.on('disconnect', () => {
    const idx = gameState.players.findIndex(p => p.id === socket.id);
    if (idx !== -1) {
      gameState.players.splice(idx, 1);
      io.emit('players:update', { players: gameState.players });
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎮 Live Quiz Platform running on http://localhost:${PORT}`);
  console.log(`   Game PIN: ${gameState.pin}`);
});
