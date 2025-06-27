const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers, updateUserById, deleteUserById, getDoctorById, updateDoctorById } = require('../controllers/adminController');

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserById);
router.delete('/users/:id', deleteUserById);
router.get('/doctor/:userId', getDoctorById);
router.put('/doctor/:userId', updateDoctorById); // Ensure this is correctly defined as a PUT route

module.exports = router;
