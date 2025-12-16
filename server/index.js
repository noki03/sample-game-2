// server/index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // <--- Use 5173 for Vite!
        methods: ["GET", "POST"]
    }
});

// --- Server Game State (minimal tracking) ---
const connectedPlayers = {};
let gameTick = 0; // The shared tick count
const COMMAND_BUFFER = []; // Stores commands for the current tick

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Add the new player to our tracking object
    connectedPlayers[socket.id] = { id: socket.id, name: `Player ${Object.keys(connectedPlayers).length + 1}` };

    // 1. Listen for player commands from the client
    socket.on('player_command', (command) => {
        // Add metadata to the command (who sent it, what tick it was received)
        const validatedCommand = { ...command, playerId: socket.id, receivedTick: gameTick };
        COMMAND_BUFFER.push(validatedCommand);
        console.log(`Command received: ${command.type}`);
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete connectedPlayers[socket.id];
    });
});


// --- The Synchronization Loop ---
const TICK_RATE_MS = 100; // 10 ticks per second

setInterval(() => {
    // 2. Broadcast the tick and the commands collected since the last tick
    if (Object.keys(connectedPlayers).length > 0) {
        gameTick++;

        io.emit('tick_commands', {
            tick: gameTick,
            commands: COMMAND_BUFFER
        });

        // 3. Clear the buffer for the next tick
        COMMAND_BUFFER.length = 0;
    }
}, TICK_RATE_MS);


// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});