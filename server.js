const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
app.use(express.static(path.join(__dirname, 'packages/web/public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'packages/web/index.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'packages/web/index.html'));
});
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('startGame', () => {
        console.log('Game starting...');
        setTimeout(() => {
            io.emit('gameStarted');
            console.log('Game started after 10 seconds!');
        }, 10000);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});