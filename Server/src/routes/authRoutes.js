// File: Server/src/routes/authRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/authController');
const guard = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/avatars/' });
const { collection } = require('../config/db');
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const transporter = require('../services/mailer');
const { hashPassword } = require('../controllers/authController'); // Update this line
const router = express.Router();

// reusable validators
const email = body('email').isEmail().withMessage('Invalid email');
const password = body('password').isLength({ min: 6 });
const confirmPass = body('confirm_password')
    .custom((v, { req }) => v === req.body.password)
    .withMessage('Passwords do not match');

// ───────── ROUTES ─────────
router.post(
    '/register',
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('phone_number').notEmpty(),
    body('address').notEmpty(),
    email,
    password,
    confirmPass,
    ctrl.register
);

router.post('/login', email, password, ctrl.login);
router.get('/me', guard, ctrl.me);

// in authRoutes.js
router.post(
    '/me/avatar',
    guard,
    upload.single('avatar'),
    async (req, res) => {
        const url = `/uploads/avatars/${req.file.filename}`;
        await collection('users').updateOne(
            { _id: new ObjectId(req.userId) },
            { $set: { profile_image: url } }
        );
        res.json({ url });
    }
);

/**
 * PUT /api/auth/me
 * Update the logged-in user’s profile
 */
router.put(
    '/me',
    guard,
    body('first_name').optional().isString().notEmpty(),
    body('last_name').optional().isString().notEmpty(),
    body('email').optional().isEmail(),
    body('phone_number').optional().isString(),
    body('address').optional().isString(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        try {
            const updates = {};
            ['first_name', 'last_name', 'email', 'phone_number', 'address', 'profile_image']
                .forEach(f => {
                    if (req.body[f] != null) updates[f] = req.body[f];
                });

            await collection('users').updateOne(
                { _id: new ObjectId(req.userId) },
                { $set: updates }
            );

            const user = await collection('users').findOne(
                { _id: new ObjectId(req.userId) },
                { projection: { password: 0 } }
            );
            res.json(user);
        } catch (err) {
            console.error('❌ Error in PUT /api/auth/me:', err);
            res.status(500).json({
                message: 'Could not update profile',
                error: err.message
            });
        }
    }
);

router.post('/forgot-password', email, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const { email } = req.body;
    try {
        const user = await collection('users').findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const token = jwt.sign(
            { sub: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Ensure CLIENT_URL is used correctly
        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
        await transporter.sendMail({
            from: `"MedConnect" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
        });

        res.json({ message: 'Password reset link sent' });
    } catch (err) {
        console.error('Error in /forgot-password:', err);

        if (err.code === 'ESOCKET') {
            res.status(500).json({
                message: 'Failed to connect to the SMTP server. Please check your email configuration.',
                error: err.message
            });
        } else {
            res.status(500).json({
                message: 'Failed to send reset link',
                error: err.message
            });
        }
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.sub;

        const user = await collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const hash = await hashPassword(password); // Use the imported hashPassword function

        await collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { password: hash } }
        );

        res.json({ message: 'Password reset successfully.' });
    } catch (err) {
        console.error('Error in /reset-password:', err);
        res.status(500).json({ message: 'Failed to reset password.', error: err.message });
    }
});

module.exports = router;

