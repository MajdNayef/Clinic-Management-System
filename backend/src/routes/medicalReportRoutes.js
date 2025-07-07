// src/routes/medicalReportRoutes.js
const express = require('express');
const { body, param } = require('express-validator');
const guard = require('../middlewares/auth');
const ctrl = require('../controllers/patientReportController');
const router = express.Router();

// 1️⃣ List generated‐PDF history
router.get('/reports/patient/history', ctrl.getGeneratedPatientReports);

// 2️⃣ JSON details for one report
router.get(
    '/reports/patient/details/:id',
    param('id').isMongoId(),
    ctrl.getPatientReportDetails
);

// 3️⃣ Single‐report PDF
router.get(
    '/reports/patient/:id/pdf',
    param('id').isMongoId(),
    ctrl.generatePatientReportPDF
);

router.get(
    '/reports/patient/:patientId',
    param('patientId').isMongoId(),
    ctrl.getAllReportsForPatient
);

// 4️⃣ Combined‐reports PDF
router.get(
    '/reports/patient/:patientId/all/pdf',
    param('patientId').isMongoId(),
    ctrl.generateAllPatientReportsPDF
);

// 5️⃣ Create new report record
router.post(
    '/reports/patient',
    guard,
    [
        body('diagnosis').trim().notEmpty(),
        body('treatment').trim().notEmpty(),
        body('prescription_state').optional().isIn(['Pending', 'Issued', 'Dispensed']),
        body('patient_id').isMongoId(),
        body('doctor_id').isMongoId(),
        body('appointment_id').isMongoId(),
    ],
    ctrl.createPatientMedicalReport
);

module.exports = router;
