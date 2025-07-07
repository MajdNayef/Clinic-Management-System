// server/src/server.js
require('dotenv').config();  // loads PORT, etc.

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');                 // your Express app
const { connect } = require('./config/db');          // your MongoDB connect()
const socketHandler = require('./services/socketHandler');

(async () => {
    // 1) Connect to MongoDB
    await connect();

    // 2) Create an HTTP server that uses your Express app
    const server = http.createServer(app);

    // 3) Attach Socket.IO to the same server
    const io = new Server(server, {
        cors: { origin: 'http://localhost:3000', credentials: true }
    });

    // 4) Wire up your socket handlers (joinRoom, chatMessage, etc.)
    socketHandler(io);

    // 5) Start listening on the port
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🚀 Server listening on port ${PORT}`);
    });
})();
