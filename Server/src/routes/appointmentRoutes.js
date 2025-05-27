// server/src/routes/appointmentRoutes.js
const express = require('express');
const { body, query, validationResult, param } = require('express-validator');
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
                            _id: '$doctor._id',          // ← keep this!
                            first_name: '$user.first_name',
                            last_name: '$user.last_name',
                            specialization: '$doctor.specialization',
                            bio: '$doctor.bio'
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

/**
 * GET /api/appointments/doctor
 * → list all TODAY’s appointments for the logged-in doctor
 */
router.get(
    "/appointments/doctor",
    guard,
    async (req, res) => {
        try {
            // 1) Find the doctor doc whose user_id is our logged-in user
            const userId = new ObjectId(req.userId);
            const doctor = await doctorsCol().findOne({ user_id: userId });
            if (!doctor) {
                return res.status(404).json({ message: "Doctor profile not found" });
            }

            // 2) Only today's date
            const today = new Date().toISOString().slice(0, 10);

            // 3) Pull all appointments for that doctor._id
            const appts = await appointmentsCol()
                .aggregate([
                    { $match: { doctor_id: doctor._id, date: today } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "patient_id",
                            foreignField: "_id",
                            as: "patient"
                        }
                    },
                    { $unwind: "$patient" },
                    {
                        $project: {
                            _id: 1,
                            date: 1,
                            time: 1,
                            status: 1,
                            appointment_type: 1,
                            patient_name: { $concat: ["$patient.first_name", " ", "$patient.last_name"] },
                            patient_avatar: "$patient.profile_image"  // whatever field you store it in
                        }
                    }
                ])
                .toArray();

            res.json(appts);
        } catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ message: "Could not load doctor appointments", error: err.message });
        }
    }
);

router.delete(
    '/appointments/:id',
    guard,
    async (req, res) => {
        const { id } = req.params;
        if (!ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid appointment ID' });

        try {
            const result = await appointmentsCol().updateOne(
                { _id: new ObjectId(id), patient_id: new ObjectId(req.userId) },
                { $set: { status: 'Canceled' } }
            );
            if (!result.matchedCount)
                return res.status(404).json({ message: 'Appointment not found' });
            return res.json({ message: 'Appointment canceled' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Cancel failed', error: err.message });
        }
    }
);


/**
 * PUT /api/appointments/:id
 * body: { date, time }
 * –> reschedule: update the date/time (and keep status “Scheduled”)
 */
router.put(
    '/appointments/:id',
    guard,
    body('date').isISO8601(),
    body('time').matches(/^\d{2}:\d{2}$/),
    async (req, res) => {
        const { id } = req.params;
        if (!ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid appointment ID' });

        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        const { date, time } = req.body;
        if (time < '08:00' || time > '11:30')
            return res.status(400).json({ message: 'Outside working hours' });

        try {
            // make sure slot isn't already booked by someone else
            const appt = await appointmentsCol().findOne({ _id: new ObjectId(id) });
            if (!appt) return res.status(404).json({ message: 'Appointment not found' });

            const clash = await appointmentsCol().findOne({
                doctor_id: appt.doctor_id,
                date,
                time,
                _id: { $ne: appt._id }
            });
            if (clash) return res.status(409).json({ message: 'Slot already taken' });

            const result = await appointmentsCol().updateOne(
                { _id: appt._id, patient_id: new ObjectId(req.userId) },
                { $set: { date, time } }
            );
            return res.json({ message: 'Appointment rescheduled' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Reschedule failed', error: err.message });
        }
    }
);

/**
 * PATCH /api/appointments/:id/status
 * body: { status: 'Completed' | 'Canceled' }
 * Only the doctor who owns the appointment may change its status.
 */
router.patch(
    '/appointments/:id/status',
    guard,
    param('id').isMongoId(),
    body('status').isIn(['Completed', 'Canceled']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        const apptId = new ObjectId(req.params.id);
        const userId = new ObjectId(req.userId);

        try {
            // find the doctor's own record
            const doctor = await doctorsCol().findOne({ user_id: userId });
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor profile not found' });
            }

            // now update only if appointment.doctor_id === doctor._id
            const result = await appointmentsCol().updateOne(
                { _id: apptId, doctor_id: doctor._id },
                { $set: { status: req.body.status } }
            );
            if (result.matchedCount === 0) {
                return res
                    .status(404)
                    .json({ message: 'Appointment not found or not yours' });
            }

            res.json({ message: 'Status updated' });
        } catch (err) {
            console.error('❌ Error in PATCH /appointments/:id/status', err);
            res.status(500).json({ message: 'Update failed', error: err.message });
        }
    }
);



// GET /api/appointments/calendar?year=YYYY&month=MM
router.get(
    '/appointments/calendar',
    guard,
    query('year').isInt({ min: 2000, max: 3000 }),
    query('month').isInt({ min: 1, max: 12 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

        try {
            const userId = new ObjectId(req.userId);
            const doctor = await doctorsCol().findOne({ user_id: userId });
            if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

            const year = Number(req.query.year);
            const month = String(req.query.month).padStart(2, '0');
            const start = `${year}-${month}-01`;
            const lastDay = new Date(year, Number(month), 0).getDate();
            const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

            const appts = await appointmentsCol()
                .find({
                    doctor_id: doctor._id,
                    date: { $gte: start, $lte: end }
                })
                .sort({ date: 1, time: 1 })
                .toArray();

            res.json(appts);
        } catch (err) {
            console.error('calendar error', err);
            res.status(500).json({ message: 'Could not load calendar appointments', error: err.message });
        }
    }
);
module.exports = router;
