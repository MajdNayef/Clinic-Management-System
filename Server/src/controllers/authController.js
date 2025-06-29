const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
// const { collection } = require('../config/db');
const { getClient, collection } = require('../config/db');
const { ObjectId } = require('mongodb');

const users = () => collection('users');
const patients = () => collection('patients');
const doctors = () => collection('doctors');

// Add the hashPassword function
exports.hashPassword = async (password) => {
    const salt = 12; // Adjust salt value as needed
    return await bcrypt.hash(password, salt);
};

// POST /api/auth/register  (full-profile version)
exports.register = async (req, res) => {
    console.log("🔥 client =", getClient()); // ✅ actually call the function

    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const {
        first_name,
        last_name,
        phone_number,
        address,
        email,
        password,
        role = 'Patient',                 // ← default
        notifications_enabled = false,
    } = req.body;

    /* 1. duplicate-email guard */
    if (await users().findOne({ email }))
        return res.status(409).json({ message: 'Email already in use' });

    /* 2. hash pw */
    const hash = await bcrypt.hash(password, 12);

    /* 3. start transaction */
    const session = getClient().startSession();
    try {
        const insertedUser = await users().insertOne({
            first_name,
            last_name,
            phone_number,
            address,
            email,
            password: hash,
            role,
            notifications_enabled,
            createdAt: new Date(),
        });

        const insertedId = insertedUser.insertedId;

        if (role === 'Patient') {
            await patients().insertOne({
                user_id: insertedId,
                medical_history_id: null,
            });
        } else if (role === 'Doctor') {
            await doctors().insertOne({
                user_id: insertedId,
                specialization: '',
                years_of_experience: 0,
                bio: '',
                available_days: [],
                available_start_time: null,
                available_end_time: null,
            });
        }

        const token = jwt.sign(
            { sub: insertedId, email, role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES || '24h' }
        );

        res.status(201).json({
            token,
            user: { _id: insertedId, first_name, last_name, email, role },
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed' });
    } finally {
        await session.endSession();
    }
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