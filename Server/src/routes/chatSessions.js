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

    // — 1) Validate appointmentId —
    if (!appointmentId || !ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ error: 'Must provide a valid appointmentId' });
    }
    const apptOid = new ObjectId(appointmentId);

    // — 2) Look up the appointment —
    const appt = await Appointments().findOne({ _id: apptOid });
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // — 3) Extract doctorId & patientId (flat or nested) —
    const rawDocId = appt.doctorId || appt.doctor_id || appt.doctor?.['_id'];
    const rawPatId = appt.patientId || appt.patient_id || appt.patient?.['_id'];

    if (!rawDocId || !rawPatId) {
      return res.status(400).json({
        error: 'Appointment is missing doctorId or patientId'
      });
    }

    // — 4) Coerce into ObjectId instances —
    const doctorOid = typeof rawDocId === 'string' ? new ObjectId(rawDocId) : rawDocId;
    const patientOid = typeof rawPatId === 'string' ? new ObjectId(rawPatId) : rawPatId;

    // — 5) Find existing session by appointmentId —
    let session = await Sessions().findOne({ appointmentId: apptOid });

    // — 6) Or create a new one —
    if (!session) {
      const now = new Date();
      const { insertedId } = await Sessions().insertOne({
        appointmentId: apptOid,
        doctorId: doctorOid,
        patientId: patientOid,
        createdAt: now,
        lastMessageAt: now,
        isActive: true
      });
      session = { _id: insertedId };
    }

    // — 7) Return the sessionId as a simple hex string —
    res.json({ sessionId: session._id.toHexString() });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
