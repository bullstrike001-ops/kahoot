const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MAX_PLAYERS = 40;
let players = [];
let adminSocket = null;

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('adminConnect', () => {
    adminSocket = socket;
    socket.emit('playerCount', players.length);
  });

  socket.on('joinGame', (nickname) => {
    if (players.length >= MAX_PLAYERS) {
      socket.emit('gameFull');
      return;
    }
    players.push({ id: socket.id, nickname });
    socket.emit('joined', nickname);
    if (adminSocket) {
      adminSocket.emit('playerCount', players.length);
    }
  });

  socket.on('startGame', () => {
    io.emit('gameStarted');
  });

  socket.on('disconnect', () => {
    if (socket.id === adminSocket?.id) {
      adminSocket = null;
    } else {
      players = players.filter((p) => p.id !== socket.id);
      if (adminSocket) {
        adminSocket.emit('playerCount', players.length);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin.html`);
  console.log(`Players: http://localhost:${PORT}`);
});
