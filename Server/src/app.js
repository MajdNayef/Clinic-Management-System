// server/src/app.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

require('dotenv').config({
    path: path.join(__dirname, 'config/.env')
});

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const dialogflowRoute = require('./routes/dialogFlow');
const notificationsRoutes = require('./routes/notificationsRoutes');
const chatSessionsRoute = require('./routes/chatSessions');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// — Body parsing & CORS —
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// — Static uploads folder —
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// — Logging HTTP requests —
app.use(morgan('dev'));

// — Mount your REST routers —
// Be sure each of these route-files does: 
//   const express = require('express');
//   const router  = express.Router();


app.use('/api/auth', authRoutes);
app.use('/api', appointmentRoutes);
app.use('/api/appointments', feedbackRoutes);
app.use('/api/dialogflow', dialogflowRoute);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat-sessions', chatSessionsRoute);
app.use('/api/admin', adminRoutes);

// — Health check endpoint —
app.get('/health', (_req, res) => res.json({ status: 'OK' }));

// — Global error handler —
app.use((err, _req, res, _next) => {
    console.error('💥 Uncaught server error:', err);
    res.status(500).json({ error: err.message });
});

module.exports = app;
