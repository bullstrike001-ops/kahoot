const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.send('Kahoot Server');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('startGame', () => {
        console.log('Game starting...');
        setTimeout(() => {
            io.emit('gameStarted');
            console.log('Game started!');
        }, 10000); // 10 second delay
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});