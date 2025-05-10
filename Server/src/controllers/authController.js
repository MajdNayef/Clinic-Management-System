const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { collection } = require('../config/db');
const { ObjectId } = require('mongodb');

const users = () => collection('users');

// POST /api/auth/register  (full-profile version)
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const {
        first_name,
        last_name,
        phone_number,
        address,
        email,
        password,
        notifications_enabled = false,
    } = req.body;

    // duplicate e-mail check
    if (await users().findOne({ email }))
        return res.status(409).json({ message: 'Email already in use' });

    const hash = await bcrypt.hash(password, 12);
    const { insertedId } = await users().insertOne({
        first_name,
        last_name,
        phone_number,
        address,
        email,
        password: hash,
        role: 'Patient',              // default role for sign-up
        notifications_enabled,
        createdAt: new Date(),
    });

    const token = jwt.sign({ sub: insertedId, email, role: 'Patient' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '24h' });

    res.status(201).json({
        token,
        user: {
            _id: insertedId,
            first_name,
            last_name,
            email,
            role: 'Patient',
        },
    });
};


// ... keep your existing register code above ...

// POST /api/auth/login
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { email, password } = req.body;

    const user = await users().findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
        { sub: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '24h' }
    );

    res.json({ token });
};

// keep (or add) the profile route if you use it elsewhere
exports.me = async (req, res) => {
    const user = await users().findOne(
        { _id: new ObjectId(req.userId) },     // convert!
        { projection: { password: 0 } }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
};