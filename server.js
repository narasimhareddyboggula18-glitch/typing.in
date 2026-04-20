const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, '')));

// --- Server-side state ---
let waitingPublicPlayers = []; // {id, name, socket}
let activeArenas = {}; 
// activeArenas[roomId] = { mode, state: 'waiting'|'countdown'|'playing', players: {id: {name, progress, wpm}}, words: [], timerId: null, duration: 30 }

const WORD_POOL = [
    "number", "system", "program", "people", "through", "between", 
    "general", "develop", "without", "because", "different", "always",
    "something", "important", "water", "world", "under", "great",
    "sentence", "another", "however", "fact", "long", "first"
];

function generateWords(count) {
    let out = [];
    for(let i=0; i<count; i++) out.push(WORD_POOL[Math.floor(Math.random()*WORD_POOL.length)]);
    return out;
}

function generateRoomCode() {
    let code = '';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for(let i=0; i<6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}

function emitPlayerList(roomId) {
    const arena = activeArenas[roomId];
    if(!arena) return;
    const players = Object.values(arena.players).map(p => ({id: p.id, name: p.name}));
    io.to(roomId).emit('playerJoined', { players });
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join Public Matchmaking
    socket.on('joinArena', (data) => {
        const player = { id: socket.id, name: data.name || 'Anonymous', socket };
        waitingPublicPlayers.push(player);
        checkPublicMatchmaking();
    });

    // Create Private Room
    socket.on('createRoom', (data) => {
        const code = generateRoomCode();
        const roomId = 'room_' + code;
        
        activeArenas[roomId] = {
            mode: 'private',
            state: 'waiting',
            players: {
                [socket.id]: { id: socket.id, name: data.name || 'Host', progress: 0, wpm: 0, _socket: socket }
            },
            duration: 30
        };
        
        socket.join(roomId);
        socket.emit('roomCreated', { code });
        emitPlayerList(roomId);
    });

    // Join Private Room
    socket.on('joinRoom', (data) => {
        const code = data.code.toUpperCase();
        const roomId = 'room_' + code;
        const arena = activeArenas[roomId];
        
        if (!arena) {
            socket.emit('arenaError', { msg: 'Room not found or expired.' });
            return;
        }
        if (arena.state !== 'waiting') {
            socket.emit('arenaError', { msg: 'Race already in progress in this room.' });
            return;
        }
        if (Object.keys(arena.players).length >= 8) {
            socket.emit('arenaError', { msg: 'Room is full (max 8).' });
            return;
        }

        arena.players[socket.id] = { id: socket.id, name: data.name || 'Player', progress: 0, wpm: 0, _socket: socket };
        socket.join(roomId);
        emitPlayerList(roomId);

        // Auto-start private if 2 or more players ? For now let's auto start when 2 join to make it easy,
        // or start after 5 seconds of 2nd player joining.
        if (Object.keys(arena.players).length >= 2 && !arena.startTimer) {
            arena.startTimer = setTimeout(() => {
                startRaceCountdown(roomId);
            }, 3000); // start 3s after 2nd person joins
        }
    });

    socket.on('progress', (data) => {
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        const roomId = rooms[0];
        if (roomId && activeArenas[roomId]) {
            const arena = activeArenas[roomId];
            if (arena.players[socket.id]) {
                arena.players[socket.id].progress = data.progress;
                arena.players[socket.id].wpm = data.wpm;
                
                const stats = Object.values(arena.players).map(p => ({
                    id: p.id, name: p.name, progress: p.progress, wpm: p.wpm
                }));
                io.to(roomId).emit('updateProgress', stats);
            }
        }
    });

    socket.on('disconnect', () => {
        waitingPublicPlayers = waitingPublicPlayers.filter(p => p.id !== socket.id);
        
        for (const roomId in activeArenas) {
            const arena = activeArenas[roomId];
            if (arena.players[socket.id]) {
                delete arena.players[socket.id];
                if (arena.state === 'waiting') {
                    emitPlayerList(roomId);
                }
                
                // If room empty, clean up
                if (Object.keys(arena.players).length === 0) {
                    if(arena.timerId) clearTimeout(arena.timerId);
                    if(arena.startTimer) clearTimeout(arena.startTimer);
                    delete activeArenas[roomId];
                }
            }
        }
    });
});

// --- Public Matchmaking ---
let pmTimer = null;
function checkPublicMatchmaking() {
    if (waitingPublicPlayers.length >= 2) {
        let players = waitingPublicPlayers.splice(0, Math.min(8, waitingPublicPlayers.length));
        setupPublicArena(players);
        if(pmTimer) { clearTimeout(pmTimer); pmTimer = null; }
    } else if (waitingPublicPlayers.length === 1 && !pmTimer) {
        // Wait 4 seconds for opponent, then just start a solo-public track
        pmTimer = setTimeout(() => {
            if (waitingPublicPlayers.length > 0) {
                let players = waitingPublicPlayers.splice(0, waitingPublicPlayers.length);
                setupPublicArena(players);
            }
            pmTimer = null;
        }, 4000);
    }
}

function setupPublicArena(players) {
    const roomId = 'pub_' + crypto.randomBytes(4).toString('hex');
    const arena = {
        mode: 'public',
        state: 'waiting',
        players: {},
        duration: 30
    };

    players.forEach(p => {
        p.socket.join(roomId);
        arena.players[p.id] = { id: p.id, name: p.name, progress: 0, wpm: 0, _socket: p.socket };
    });

    activeArenas[roomId] = arena;
    emitPlayerList(roomId);

    // Small delay before starting public countdown
    setTimeout(() => {
        startRaceCountdown(roomId);
    }, 1500);
}

// --- Common Race Logic ---
function startRaceCountdown(roomId) {
    const arena = activeArenas[roomId];
    if(!arena) return;
    
    arena.state = 'countdown';
    let count = 3;
    
    const countInt = setInterval(() => {
        if(count > 0) {
            io.to(roomId).emit('countdown', { num: count });
            count--;
        } else {
            clearInterval(countInt);
            io.to(roomId).emit('countdown', { num: 'GO' });
            
            // start match
            arena.state = 'playing';
            arena.words = generateWords(60);
            
            io.to(roomId).emit('gameStart', { words: arena.words, duration: arena.duration });
            
            // End timer
            arena.timerId = setTimeout(() => {
                const results = Object.values(arena.players).map(p => ({id: p.id, name: p.name, wpm: p.wpm, progress: p.progress}));
                io.to(roomId).emit('gameEnd', results);
                delete activeArenas[roomId]; // cleanup
            }, arena.duration * 1000 + 1000);
        }
    }, 1000);
}


const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log(`TypeFlow Pro server running at http://localhost:${PORT}`);
    });
}
module.exports = app;
