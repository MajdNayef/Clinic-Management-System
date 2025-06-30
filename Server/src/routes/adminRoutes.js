const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { validationResult } = require('express-validator');
const Reportscontroller = require('../controllers/appointmentsReportController');


router.get('/dashboard', AdminController.getDashboardStats);
router.get('/users', AdminController.getAllUsers);
router.put('/users/:id', AdminController.updateUserById);
router.delete('/users/:id', AdminController.deleteUserById);
router.get('/doctors', AdminController.getAllDoctors);
router.get('/doctor/:userId', AdminController.getDoctorById);
router.put('/doctor/:userId', AdminController.updateDoctorById); // Ensure this is correctly defined as a PUT route

router.get('/appointments/', AdminController.getAllAppointments);
router.put('/appointments/:id', AdminController.updateAppointmentStatus);
router.delete('/appointments/:id', AdminController.deleteAppointment);
router.put('/working-hours', AdminController.updateWorkingHours);
router.put('/working-hours/bulk', AdminController.updateBulkWorkingHours);

router.get('/working-hours', AdminController.getWorkingHours);
router.post('/clinic-capacities', AdminController.setClinicCapacity);
router.get('/clinic-capacities', AdminController.getClinicCapacities);
router.put('/clinic-capacities/global', AdminController.updateGlobalClinicCapacity);
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

router.get('/patients/on-site', AdminController.getOnSitePatients);
router.get('/appointments/calendar', AdminController.getCalendarAppointments);


// Appointments Report Routes 




router.get('/reports/appointments/details/:id', Reportscontroller.getAppointmentDetails); // optional
router.post('/reports/appointments/generate/:id', Reportscontroller.generateAppointmentPDF);
router.get('/reports/appointments/history', Reportscontroller.getGeneratedAppointmentReports);
router.post('/appointments/generate/:id', Reportscontroller.generateAppointmentPDF);

router.get("/reports/doctors/summary", Reportscontroller.getDoctorPerformanceSummary);
router.post("/reports/doctors/generate/:doctorId", Reportscontroller.generateDoctorPerformancePDF);


module.exports = router;
