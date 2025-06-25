
// File: Server/src/routes/authRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/authController');
const guard = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/avatars/' });
const { collection } = require('../config/db');
const { ObjectId } = require('mongodb');

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

module.exports = router;

