module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    // Example: Listen for a chat message event
    socket.on('chat message', (msg) => {
      console.log('Message: ' + msg);

      // Broadcast the message to all connected clients
      io.emit('chat message', msg);
    });

    // Add more event listeners as needed
  });
};
