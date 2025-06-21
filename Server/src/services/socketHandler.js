// server/src/services/socketHandler.js

const { collection } = require('../config/db');
const { ObjectId } = require('mongodb');

const ChatMessages = () => collection('chat_messages');
const ChatSessions = () => collection('chat_sessions');

module.exports = io => {
  io.on('connection', socket => {
    console.log('🔌 New socket connected:', socket.id);

    // 1) join room & normalize history
    socket.on('joinRoom', async room => {
      console.log('➡️ joinRoom:', room);
      socket.join(room);

      // load raw Mongo docs
      const raw = await ChatMessages()
        .find({ chat_id: new ObjectId(room) })
        .sort({ timestamp: 1 })
        .toArray();

      // map into { from, text, timestamp }
      const history = raw.map(doc => ({
        from: doc.sender.toString(),  // if you stored ObjectId, .toString()
        text: doc.content,            // rename content→text
        timestamp: doc.timestamp
      }));

      console.log(`📜 sending history: ${history.length} messages`);
      socket.emit('history', history);
    });

    // 2) receive, save, broadcast
    socket.on('chatMessage', async ({ room, from, text }) => {
      console.log('✉️ chatMessage payload:', { room, from, text });
      const timestamp = new Date();

      // a) persist (keep 'content' in the DB if you like)
      await ChatMessages().insertOne({
        chat_id: new ObjectId(room),
        sender: from,
        content: text,
        timestamp
      });

      // b) bump lastMessageAt
      await ChatSessions().updateOne(
        { _id: new ObjectId(room) },
        { $set: { lastMessageAt: timestamp } }
      );

      // c) broadcast the exact same shape you feed history with
      io.to(room).emit('chatMessage', { from, text, timestamp });
      console.log('📣 broadcasted chatMessage to room', room);
    });
  });
};
