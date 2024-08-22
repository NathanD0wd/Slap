// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Serve static files from the 'public' folder

let players = []; // Array to track players

// Handle a connection from a client
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    if (players.length < 2) {
        let playerNumber = 1;
        if (players.length == 1 && players[0].number == 1) {
            playerNumber = 2;
        }
        players.push({ id: socket.id, number: playerNumber });

        socket.emit('playerAssigned', playerNumber);
        console.log(`Assigned Player ${playerNumber} to socket ${socket.id}`);
    } else {
        socket.emit('roomFull');
        console.log('Room is full');
    }

    // Listen for events from this client (e.g., when a player plays a card)
    socket.on('playCard', (card) => {
        io.emit('cardPlayed', card); // Broadcast the card to all clients
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);

        // Remove the player from the players array
        players = players.filter(player => player.id !== socket.id);
        
        console.log(`Removed Player with socket ID ${socket.id}. Remaining players:`, players);
    });
});

server.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
});
