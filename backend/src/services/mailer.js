// src/services/mailer.js
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

// 1) Validate SMTP configuration
if (!process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
) {
    console.error('❌ SMTP configuration is incomplete.');
    throw new Error('SMTP configuration is incomplete');
}

// 2) Create the transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// 3) Dynamically load & attach the Handlebars plugin
(async () => {
    try {
        // import returns an ESM namespace; the default export is our plugin factory
        const hbsPlugin = (await import('nodemailer-express-handlebars')).default;

        transporter.use('compile', hbsPlugin({
            viewEngine: {
                extname: '.hbs',
                layoutsDir: path.join(__dirname, '../templates/layouts'),
                defaultLayout: 'main',        // ← use main.hbs layout
            },
            viewPath: path.join(__dirname, '../templates'),
            extName: '.hbs',
        }));

    } catch (err) {
        console.error('Failed to load nodemailer-express-handlebars:', err);
    }
})();

module.exports = transporter;
