// server/src/routes/appointmentRoutes.js
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const { collection } = require('../config/db');
const guard = require('../middlewares/auth');

const router = express.Router();

const doctorsCol = () => collection('doctors');
const appointmentsCol = () => collection('appointments');

/**
 * GET /api/doctors
 * → returns [{ _id, specialization, bio, first_name, last_name }]
 */



router.get('/doctors', async (req, res) => {
    try {
        const docs = await collection('doctors')
            .aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',    // doctor.user_id → users._id
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: {
                        path: '$user',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $project: {
                        _id: 1,
                        specialization: 1,
                        bio: 1,               // optional
                        first_name: '$user.first_name',
                        last_name: '$user.last_name'
                    }
                }
            ])
            .toArray();

        console.log('🩺 Doctors:', docs);
        res.json(docs);
    } catch (err) {
        console.error('❌ Error fetching doctors:', err);
        res.status(500).json({
            message: 'Could not load doctors',
            error: err.message
        });
    }
});


/**
 * GET /api/appointments/available?doctor_id=&date=YYYY-MM-DD
 */
router.get(
    '/appointments/available',
    query('doctor_id').isMongoId(),
    query('date').isISO8601(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });

        const { doctor_id, date } = req.query;
        const docId = new ObjectId(doctor_id);

        // build all 30-min slots 08:00–12:00
        const allSlots = [];
        for (let h = 8; h < 12; h++) {
            allSlots.push(`${String(h).padStart(2, '0')}:00`);
            allSlots.push(`${String(h).padStart(2, '0')}:30`);
        }

        // find booked times for that doctor & date
        const booked = await appointmentsCol().distinct('time', {
            doctor_id: docId,
            date
        });

        // return free slots
        return res.json(allSlots.filter(t => !booked.includes(t)));
    }
);


/**
 * POST /api/appointments
 * body: { doctor_id, date, time, type }
 * protected by `guard` which sets req.userId = the logged-in user's _id string
 */
router.post(
    '/appointments',
    guard,
    body('doctor_id').isMongoId(),
    body('date').isISO8601(),
    body('time').matches(/^\d{2}:\d{2}$/),
    body('type').isIn(['In-Person', 'Virtual']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        try {
            const docId = new ObjectId(req.body.doctor_id);
            const patientId = new ObjectId(req.userId);
            const { date, time, type } = req.body;

            if (time < '08:00' || time > '11:30')
                return res.status(400).json({ message: 'Outside working hours' });

            const clash = await appointmentsCol().findOne({ doctor_id: docId, date, time });
            if (clash) return res.status(409).json({ message: 'Slot already booked' });

            const { insertedId } = await appointmentsCol().insertOne({
                doctor_id: docId,
                patient_id: patientId,
                status: 'Scheduled',
                date,
                time,
                appointment_type: type,
                createdAt: new Date()
            });

            return res.status(201).json({ _id: insertedId });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Booking failed', error: err.message });
        }
    }
);

// GET /api/appointments         ← list all appointments for the logged-in patient
router.get(
    '/appointments',
    guard,                     // must be authenticated
    async (req, res) => {
        try {
            const patientId = new ObjectId(req.userId);

            // grab patient’s appointments, join in doctor → user to get name
            const appts = await appointmentsCol().aggregate([
                { $match: { patient_id: patientId } },
                {
                    $lookup: {
                        from: 'doctors',
                        localField: 'doctor_id',
                        foreignField: '_id',
                        as: 'doctor'
                    }
                },
                { $unwind: '$doctor' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'doctor.user_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 1,
                        date: 1,
                        time: 1,
                        status: 1,
                        appointment_type: 1,
                        doctor: {
                            first_name: '$user.first_name',
                            last_name: '$user.last_name',
                            specialization: '$doctor.specialization',  // ← add this
                            bio: '$doctor.bio'              // ← and this
                        }
                    }
                }
            ]).toArray();

            res.json(appts);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Could not load appointments', error: err.message });
        }
    }
);


module.exports = router;
