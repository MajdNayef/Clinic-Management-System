// server/src/index.js (or app.js)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// 1) CORS first (so preflight works everywhere)
app.use(
    cors({
        origin: 'http://localhost:3000',
        credentials: true
    })
);

// 2) Body‐parser & logging
app.use(express.json());       // ← must come *before* appointmentRoutes
app.use(morgan('dev'));

// 3) Your routes
app.use('/api/auth', authRoutes);
app.use('/api', appointmentRoutes);

// 4) Health check
app.get('/health', (_, res) => res.json({ status: 'OK' }));

module.exports = app;
