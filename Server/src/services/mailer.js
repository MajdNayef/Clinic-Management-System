// src/services/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Validate SMTP configuration
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP configuration is incomplete. Please check your environment variables.');
    throw new Error('SMTP configuration is incomplete');
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, // SMTP username
        pass: process.env.SMTP_PASS, // SMTP password
    },
});

module.exports = transporter;
