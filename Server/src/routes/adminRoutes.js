const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

router.get('/dashboard', AdminController.getDashboardStats);
router.get('/users', AdminController.getAllUsers);
router.put('/users/:id', AdminController.updateUserById);
router.delete('/users/:id', AdminController.deleteUserById);
router.get('/doctor/:userId', AdminController.getDoctorById);
router.put('/doctor/:userId', AdminController.updateDoctorById); // Ensure this is correctly defined as a PUT route

router.get('/appointments/', AdminController.getAllAppointments);
router.put('/appointments/:id', AdminController.updateAppointmentStatus);
router.delete('/appointments/:id', AdminController.deleteAppointment);

module.exports = router;
