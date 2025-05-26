// server/src/server.js (or index.js/app.js)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// 1) CORS & body‐parser
app.use(
    cors({ origin: 'http://localhost:3000', credentials: true })
);
app.use(express.json());      // <–– before your routes!

// 2) Logger
app.use(morgan('dev'));

// 3) Auth first, so guard() can decode your JWT
app.use('/api/auth', authRoutes);

// 4) Then the appointment routes
app.use('/api', appointmentRoutes);

app.get('/health', (_, res) => res.json({ status: 'OK' }));

module.exports = app;
