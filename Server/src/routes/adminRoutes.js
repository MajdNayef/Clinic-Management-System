const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { validationResult } = require('express-validator');


router.get('/dashboard', AdminController.getDashboardStats);
router.get('/users', AdminController.getAllUsers);
router.put('/users/:id', AdminController.updateUserById);
router.delete('/users/:id', AdminController.deleteUserById);
router.get('/doctor/:userId', AdminController.getDoctorById);
router.put('/doctor/:userId', AdminController.updateDoctorById); // Ensure this is correctly defined as a PUT route

router.get('/appointments/', AdminController.getAllAppointments);
router.put('/appointments/:id', AdminController.updateAppointmentStatus);
router.delete('/appointments/:id', AdminController.deleteAppointment);

router.post(
    '/appointments',
    [
        body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
        body('patient_id').notEmpty().withMessage('Patient ID is required'),
        body('date').isISO8601().withMessage('Valid date is required'),
        body('time').notEmpty().withMessage('Time is required'),
        body('type').isIn(['In-Person', 'Virtual']).withMessage('Invalid type')
    ],
    AdminController.createAppointment
);


module.exports = router;
