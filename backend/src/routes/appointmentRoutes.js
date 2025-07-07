// server/src/routes/appointmentRoutes.js
const express = require('express');
const { body, query, validationResult, param } = require('express-validator');
const { ObjectId } = require('mongodb');
const { collection } = require('../config/db');
const guard = require('../middlewares/auth');
const { sendNotificationToUser } = require('../controllers/notificationController');
const { generatePatientMedicalReportPDF } = require('../controllers/patientReportController');
const router = express.Router();
const doctorsCol = () => collection('doctors');
const appointmentsCol = () => collection('appointments');

/**
 * GET /api/doctors
 * → returns [{ _id, specialization, bio, first_name, last_name }]
 */
router.get('/doctors', async (req, res) => {
    try {
        const docs = await doctorsCol()
            .aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 1,
                        specialization: 1,
                        bio: 1,
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
/* ── GET /api/appointments/available?doctor_id=&date=YYYY-MM-DD ───── */
router.get(
    "/appointments/available",
    query("doctor_id").isMongoId(),
    query("date").isISO8601(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { doctor_id, date } = req.query;
        const docId = new ObjectId(doctor_id);

        const allSlots = [];
        for (let h = 8; h < 12; h++) {
            allSlots.push(`${String(h).padStart(2, "0")}:00`);
            allSlots.push(`${String(h).padStart(2, "0")}:30`);
        }

        try {
            const booked = await appointmentsCol().distinct("time", {
                doctor_id: docId,
                date,
            });
            res.json(allSlots.filter((t) => !booked.includes(t)));
        } catch (err) {
            console.error("Error fetching available appointments:", err);
            res.status(500).json({
                message: "Failed to fetch available appointments",
                error: err.message,
            });
        }
    }
);

/**
 * POST /api/appointments
 * body: { doctor_id, date, time, type }
 * protected by `guard`
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

            // 1) Insert the appointment
            const apptDoc = {
                doctor_id: docId,
                patient_id: patientId,
                status: 'Scheduled',
                date,
                time,
                appointment_type: type,
                createdAt: new Date()
            };
            const { insertedId } = await appointmentsCol().insertOne(apptDoc);
            const appointment = { ...apptDoc, _id: insertedId };

            // 2) Notify (email + dashboard)
            const dateStr = new Date(date).toLocaleDateString();
            const content = `Your appointment is scheduled on ${dateStr} at ${time}.`;
            const notification = await sendNotificationToUser(req.userId, content);

            // 3) Return both
            return res.status(201).json({ appointment, notification });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Booking failed', error: err.message });
        }
    }
);



/**
 * GET /api/appointments
 * → list all appointments for the logged-in patient
 */
router.get(
    '/appointments',
    guard,
    async (req, res) => {
        try {
            const patientId = new ObjectId(req.userId);
            const appts = await appointmentsCol()
                .aggregate([
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
                            patient_id: 1,
                            doctor: {
                                _id: '$doctor._id',
                                first_name: '$user.first_name',
                                last_name: '$user.last_name',
                                specialization: '$doctor.specialization',
                                bio: '$doctor.bio'
                            }
                        }
                    }
                ])
                .toArray();

            res.json(appts);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Could not load appointments', error: err.message });
        }
    }
);


/* ── GET /api/appointments/doctor  (today / past / exact date) ────── */
router.get("/appointments/doctor", guard, async (req, res) => {
    try {
        const userId = new ObjectId(req.userId);
        const doctor = await doctorsCol().findOne({ user_id: userId });
        if (!doctor)
            return res.status(404).json({ message: "Doctor profile not found" });

        const { utcToZonedTime, format } = require('date-fns-tz');
        const CLINIC_TZ = process.env.CLINIC_TZ || 'Asia/Riyadh';

        const today = format(
            utcToZonedTime(new Date(), CLINIC_TZ), // convert UTC → clinic zone
            'yyyy-MM-dd',                          // keep YYYY-MM-DD string format
            { timeZone: CLINIC_TZ }
        ); const isPast = req.query.past === "true";
        const specificDate = req.query.date;
        console.log('[doctor route] userId', userId);
        console.log('[doctor route] doctor id ', doctor);
        console.log('[doctor route] today', today, 'specificDate', specificDate, 'isPast', isPast);


        const matchCondition = {
            doctor_id: doctor._id,
            ...(specificDate
                ? { date: specificDate }
                : isPast
                    ? { date: { $lt: today } }
                    : { date: today }),
        };

        const appts = await appointmentsCol()
            .aggregate([
                { $match: matchCondition },
                {
                    $lookup: {
                        from: "users",
                        localField: "patient_id",
                        foreignField: "_id",
                        as: "patient",
                    },
                },
                { $unwind: "$patient" },
                {
                    $project: {
                        _id: 1,
                        date: 1,
                        time: 1,
                        status: 1,
                        appointment_type: 1,
                        doctor_id: 1,
                        patient_id: 1,
                        patient_name: {
                            $concat: ["$patient.first_name", " ", "$patient.last_name"],
                        },
                        patient_avatar: "$patient.profile_image",
                        medical_report_url: "$patient.medical_report_url",
                    },
                },
            ])
            .sort({ date: -1, time: -1 })
            .toArray();

        res.json(appts);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to load doctor appointments",
            error: err.message,
        });
    }
});

/**
 * DELETE /api/appointments/:id
 * → cancel an appointment
 */
router.delete(
    '/appointments/:id',
    guard,
    async (req, res) => {
        const { id } = req.params;
        if (!ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid appointment ID' });

        try {
            // 1) fetch for email + DB content
            const appt = await appointmentsCol().findOne({
                _id: new ObjectId(id),
                patient_id: new ObjectId(req.userId)
            });
            if (!appt) return res.status(404).json({ message: 'Appointment not found' });

            // 2) update status
            await appointmentsCol().updateOne(
                { _id: appt._id },
                { $set: { status: 'Canceled' } }
            );

            // 3) notify
            const content = `Your appointment on ${appt.date} at ${appt.time} was canceled.`;
            await sendNotificationToUser(req.userId, content);

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
 * → reschedule an appointment
 *//* ── PUT /api/appointments/:id  (patient **or doctor** reschedule) ── */
router.put(
    "/appointments/:id",
    guard,
    body("date").isISO8601(),
    body("time").matches(/^\d{2}:\d{2}$/),
    async (req, res) => {
        const { id } = req.params;
        if (!ObjectId.isValid(id))
            return res.status(400).json({ message: "Invalid appointment ID" });

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

        const { date, time } = req.body;
        if (time < "08:00" || time > "11:30")
            return res.status(400).json({ message: "Outside working hours" });

        try {
            const appt = await appointmentsCol().findOne({
                _id: new ObjectId(id),
            });
            if (!appt)
                return res.status(404).json({ message: "Appointment not found" });

            /* authorise: patient **or** doctor owner */
            const userIdObj = new ObjectId(req.userId);
            const doctor = await doctorsCol().findOne({ user_id: userIdObj });
            const isPatient = appt.patient_id.equals(userIdObj);
            const isDoctor = doctor && appt.doctor_id.equals(doctor._id);
            if (!isPatient && !isDoctor)
                return res.status(403).json({ message: "Not allowed" });

            /* clash? */
            const clash = await appointmentsCol().findOne({
                doctor_id: appt.doctor_id,
                date,
                time,
                _id: { $ne: appt._id },
            });
            if (clash) return res.status(409).json({ message: "Slot already taken" });

            /* perform update */
            await appointmentsCol().updateOne(
                { _id: appt._id },
                { $set: { date, time, status: "Scheduled" } }
            );

            /* notify patient */
            const content = `Your appointment has been rescheduled to ${date} at ${time}.`;
            await sendNotificationToUser(appt.patient_id.toString(), content);

            res.json({ message: "Appointment rescheduled" });
        } catch (err) {
            console.error(err);
            res
                .status(500)
                .json({ message: "Reschedule failed", error: err.message });
        }
    }
);
/**
 * PATCH /api/appointments/:id/status
 * body: { status: 'Completed' | 'Canceled' }
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
            const doctor = await doctorsCol().findOne({ user_id: userId });
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor profile not found' });
            }

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

/**
 * GET /api/appointments/calendar?year=YYYY&month=MM
 */
router.get(
    '/appointments/calendar',
    guard,
    query('year').isInt({ min: 2000, max: 3000 }),
    query('month').isInt({ min: 1, max: 12 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        try {
            const userId = new ObjectId(req.userId);
            const doctor = await doctorsCol().findOne({ user_id: userId });
            if (!doctor)
                return res.status(404).json({ message: 'Doctor profile not found' });

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
            res
                .status(500)
                .json({ message: 'Could not load calendar appointments', error: err.message });
        }
    }
);
const feedbacksCol = () => collection("feedbacks");

/**
 * POST /api/appointments/:id/feedback
 * body: { rating, note }
 * Auto-attaches doctor_id from the appointment
 */
router.post(
    "/appointments/:id/feedback",
    guard,
    body("rating").isInt({ min: 1, max: 5 }),
    body("note").isString().trim().notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        const appointmentId = new ObjectId(req.params.id);
        const patientId = new ObjectId(req.userId);

        try {
            // 1. Get the appointment to fetch doctor_id
            const appointment = await appointmentsCol().findOne({
                _id: appointmentId,
                patient_id: patientId
            });

            if (!appointment)
                return res.status(404).json({ message: "Appointment not found or not yours" });

            // 2. Insert feedback with doctor_id from appointment
            const feedbackDoc = {
                appointment_id: appointmentId,
                patient_id: patientId,
                doctor_id: appointment.doctor_id, // ✅ pulled automatically
                rating: req.body.rating,
                note: req.body.note,
                createdAt: new Date()
            };

            await feedbacksCol().insertOne(feedbackDoc);

            res.status(201).json({ message: "Feedback submitted" });
        } catch (err) {
            console.error("❌ Feedback submission error:", err);
            res.status(500).json({ message: "Failed to submit feedback", error: err.message });
        }
    }
);

module.exports = router;
