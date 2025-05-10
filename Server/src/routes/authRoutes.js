const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const guard = require('../middlewares/auth');

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
module.exports = router;

