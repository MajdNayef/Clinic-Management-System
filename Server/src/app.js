// server/src/server.js (or index.js/app.js)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');         
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();
app.use(express.json());



// 1) CORS & body‐parser
app.use(
    cors({ origin: 'http://localhost:3000', credentials: true })
);

// AFTER — allow up to 10 MB bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(
    '/uploads',
    express.static(path.join(__dirname, '..', 'uploads'))
);


// 2) Logger
app.use(morgan('dev'));

// 3) Auth first, so guard() can decode your JWT
app.use('/api/auth', authRoutes);

// 4) Then the appointment routes
app.use('/api', appointmentRoutes);


app.get('/health', (_, res) => res.json({ status: 'OK' }));

module.exports = app;
