// server/src/routes/chatSessions.js

const express = require('express');
const { ObjectId } = require('mongodb');
const { collection } = require('../config/db');

const router = express.Router();
const Sessions = () => collection('chat_sessions');
const Appointments = () => collection('appointments');
const Users = () => collection('users'); // Add users collection
const Doctors = () => collection('doctors'); // Add users collection

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

    const apptTime = appt.time; // Correctly retrieve appointment time
    const apptDate = appt.date; // Correctly retrieve appointment date

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
    console.log('doctorOid', doctorOid, 'patientOid', patientOid);

    // Fetch doctor document to retrieve user_id
    const doctorDoc = await Doctors().findOne({ _id: doctorOid });
    if (!doctorDoc || !doctorDoc.user_id) {
      return res.status(404).json({ error: 'Doctor not found or missing user_id' });
    }
    const doctorUserId = doctorDoc.user_id; // Extract user_id from doctor document

    // Fetch avatars from users collection using user_id
    const doctor = await Users().findOne({ _id: new ObjectId(doctorUserId) }); // Query Users collection with user_id
    const patient = await Users().findOne({ _id: patientOid });

    const doctorAvatar = doctor?.profile_image || null; // Fetch doctor avatar
    const patientAvatar = patient?.profile_image || null; // Fetch patient avatar

    // 5) Find or create *one* session per appointment
    let session = await Sessions().findOne({ appointmentId: apptOid });

    if (!session) {
      const now = new Date();
      const { insertedId } = await Sessions().insertOne({
        appointmentId: apptOid,       // <–– link back to your appointment
        doctorId: doctorOid,
        patientId: patientOid,
        doctorAvatar,                // Include doctor avatar
        patientAvatar,               // Include patient avatar
        appointmentTime: apptTime,   // Include appointment time
        appointmentDate: apptDate,   // Include appointment date
        createdAt: now,
        lastMessageAt: now,
        isActive: true
      });
      session = { _id: insertedId };
    }

    // 6) Return the sessionId and avatars
    res.json({
      sessionId: session._id.toHexString(),
      doctorAvatar,
      patientAvatar,
      appointmentTime: apptTime,   // Include appointment time
      appointmentDate: apptDate  // Include appointment date
    });
    console.log('Session created or found:', session._id.toHexString(), {
      doctorAvatar,
      patientAvatar,
      appointmentTime: apptTime,
      appointmentDate: apptDate
    });
    console.log('patient avatar', patientAvatar, 'doctor avatar', doctorAvatar);

  } catch (err) {
    next(err);
  }
});

module.exports = router;
