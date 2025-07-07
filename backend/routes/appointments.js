const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment'); // Adjust path as needed

// Update appointment status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['Completed', 'Canceled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Find and update the appointment
        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
