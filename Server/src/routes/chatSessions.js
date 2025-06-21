// server/src/routes/chatSessions.js

const express = require('express');
const { ObjectId } = require('mongodb');
const { collection } = require('../config/db');

const router = express.Router();
const Sessions = () => collection('chat_sessions');
const Appointments = () => collection('appointments');

router.post('/', async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    // 1) Validate
    if (!appointmentId || !ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ error: 'Must provide a valid appointmentId' });
    }
    const apptOid = new ObjectId(appointmentId);

    // 2) Load appointment
    const appt = await Appointments().findOne({ _id: apptOid });
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // 3) Pull doctor/patient IDs (flat or snake_case)
    const rawDocId = appt.doctorId || appt.doctor_id;
    const rawPatId = appt.patientId || appt.patient_id;
    if (!rawDocId || !rawPatId) {
      return res.status(400).json({
        error: 'Appointment is missing doctorId or patientId'
      });
    }

    // 4) Convert to ObjectId
    const doctorOid = typeof rawDocId === 'string' ? new ObjectId(rawDocId) : rawDocId;
    const patientOid = typeof rawPatId === 'string' ? new ObjectId(rawPatId) : rawPatId;

    // 5) Find or create *one* session per appointment
    let session = await Sessions().findOne({ appointmentId: apptOid });

    if (!session) {
      const now = new Date();
      const { insertedId } = await Sessions().insertOne({
        appointmentId: apptOid,       // <–– link back to your appointment
        doctorId: doctorOid,
        patientId: patientOid,
        createdAt: now,
        lastMessageAt: now,
        isActive: true
      });
      session = { _id: insertedId };
    }

    // 6) Return the sessionId
    res.json({ sessionId: session._id.toHexString() });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
