// server/src/server.js (or index.js/app.js)
const path = require('path');
require('dotenv').config({
    // adjust this path if your .env lives elsewhere
    path: path.join(__dirname, 'config/.env')
});

// Log out the key env-vars so you can verify they’re what you expect:
console.log('>> GOOGLE_APPLICATION_CREDENTIALS =', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('>> GOOGLE_CLOUD_PROJECT         =', process.env.GOOGLE_CLOUD_PROJECT);

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const dialogflowRoute = require('./routes/dialogflow');


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

// mount at /api/dialogflow
app.use('/api/dialogflow', dialogflowRoute);
// after mounting all routes:
app.use((err, req, res, next) => {
    console.error('💥 Uncaught server error:', err);
    res.status(500).json({ error: err.message });
});


app.get('/health', (_, res) => res.json({ status: 'OK' }));

module.exports = app;
