/**
 * TypeFlow Pro — Multiplayer Module
 * Handles: Socket.IO connection, public arena matchmaking,
 * private room create/join, race countdown, progress sync, results broadcast.
 */

const Multiplayer = (() => {
    let socket = null;
    let myId = null;
    let currentRoom = null;
    let isConnected = false;

    // Callbacks set by app.js
    const handlers = {
        onGameStart: null,     // (words, duration) => void
        onProgress: null,      // (players) => void
        onGameEnd: null,       // (results) => void
        onCountdown: null,     // (num) => void  (3, 2, 1, 'GO')
        onRoomCreated: null,   // (code) => void
        onPlayerJoined: null,  // (players) => void
        onError: null,         // (msg) => void
        onConnectStatus: null, // (ok, msg) => void
    };

    function setHandlers(h) {
        Object.assign(handlers, h);
    }

    function connect() {
        if (socket && socket.connected) return true;
        try {
            socket = io({ transports: ['websocket', 'polling'], timeout: 5000 });
            bindEvents();
            return true;
        } catch(e) {
            console.warn('Socket unavailable:', e);
            if (handlers.onConnectStatus) handlers.onConnectStatus(false, 'Server not reachable.');
            return false;
        }
    }

    function bindEvents() {
        socket.on('connect', () => {
            myId = socket.id;
            isConnected = true;
            if (handlers.onConnectStatus) handlers.onConnectStatus(true, '✓ Connected to server!');
        });

        socket.on('connect_error', () => {
            isConnected = false;
            if (handlers.onConnectStatus) handlers.onConnectStatus(false, '⚠ Multiplayer unavailable. Play Solo instead.');
        });

        socket.on('disconnect', () => {
            isConnected = false;
            currentRoom = null;
            if (handlers.onConnectStatus) handlers.onConnectStatus(false, '⚠ Disconnected from arena.');
        });

        socket.on('roomCreated', ({ code }) => {
            currentRoom = code;
            if (handlers.onRoomCreated) handlers.onRoomCreated(code);
        });

        socket.on('playerJoined', ({ players }) => {
            if (handlers.onPlayerJoined) handlers.onPlayerJoined(players);
        });

        socket.on('countdown', ({ num }) => {
            if (handlers.onCountdown) handlers.onCountdown(num);
        });

        socket.on('gameStart', ({ words, duration }) => {
            if (handlers.onGameStart) handlers.onGameStart(words, duration);
        });

        socket.on('updateProgress', (players) => {
            if (handlers.onProgress) handlers.onProgress(players);
        });

        socket.on('gameEnd', (results) => {
            if (handlers.onGameEnd) handlers.onGameEnd(results);
        });

        socket.on('arenaError', ({ msg }) => {
            if (handlers.onError) handlers.onError(msg);
        });
    }

    function joinPublicArena(name) {
        if (!socket || !socket.connected) return false;
        socket.emit('joinArena', { name, mode: 'public' });
        return true;
    }

    function createPrivateRoom(name) {
        if (!socket || !socket.connected) return false;
        socket.emit('createRoom', { name });
        return true;
    }

    function joinPrivateRoom(name, code) {
        if (!socket || !socket.connected) return false;
        socket.emit('joinRoom', { name, code: code.toUpperCase() });
        return true;
    }

    function sendProgress(progress, wpm) {
        if (!socket || !socket.connected) return;
        socket.emit('progress', { progress, wpm });
    }

    function disconnect() {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        isConnected = false;
        myId = null;
        currentRoom = null;
    }

    function getMyId() { return myId; }
    function isReallyConnected() { return isConnected && socket && socket.connected; }

    return {
        connect,
        setHandlers,
        joinPublicArena,
        createPrivateRoom,
        joinPrivateRoom,
        sendProgress,
        disconnect,
        getMyId,
        isReallyConnected,
    };
})();
