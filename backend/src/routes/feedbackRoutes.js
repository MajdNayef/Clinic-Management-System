// src/routes/feedbackRoutes.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const { collection } = require('../config/db');
const guard = require('../middlewares/auth');

const router = express.Router();
const feedbackCol = () => collection('feedbacks');  // match your collection name


/**
 * POST /api/appointments/:appointment_id/feedback
 */
router.post(
    '/:appointment_id/feedback',
    guard,
    param('appointment_id').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('note').isString().notEmpty(),
    async (req, res) => {
        const errs = validationResult(req);
        if (!errs.isEmpty()) {
            return res.status(422).json({ errors: errs.array() });
        }

        const { appointment_id } = req.params;
        const { rating, note } = req.body;

        try {
            const fb = {
                appointment_id: new ObjectId(appointment_id),
                patient_id: new ObjectId(req.userId),
                rating,
                note,
                createdAt: new Date(),
            };
            const { insertedId } = await feedbackCol().insertOne(fb);
            return res.status(201).json({ _id: insertedId });
        } catch (err) {
            console.error(err);
            return res
                .status(500)
                .json({ message: 'Feedback submission failed', error: err.message });
        }
    }
);

// (Optionally, GET feedback by appointment)
router.get(
    '/:appointment_id/feedback',
    guard,
    param('appointment_id').isMongoId(),
    async (req, res) => {
        try {
            const fb = await feedbackCol().findOne({
                appointment_id: new ObjectId(req.params.appointment_id)
            });
            if (!fb) return res.status(404).json({ message: 'Feedback not found' });
            res.json(fb);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Could not retrieve feedback', error: err.message });
        }
    }
);

module.exports = router;
