// src/controllers/patientReportController.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const { collection } = require('../config/db');
const { validationResult } = require('express-validator');


// ─── Collections ───────────────────────────────────────────
const Patients = () => collection('patients');
const Doctors = () => collection('doctors');
const Users = () => collection('users');
const Appointments = () => collection('appointments');
const PatientReports = () => collection('patients_medical_reports');
const PatientReportHistory = () => collection('patient_report_history');

// ─── Helper: fetch one report's details ─────────────────────
// ─── Helper: fetch one report’s details ─────────────────────
async function getPatientReportDetails(reportId) {
    const report = await PatientReports().findOne({ _id: new ObjectId(reportId) });
    if (!report) return null;

    // load appointment and doctor record
    const [appointment, doctorRec] = await Promise.all([
        Appointments().findOne({ _id: report.appointment_id }),
        Doctors().findOne({ _id: report.doctor_id }),
    ]);

    // pull the patient *directly* from the users collection
    const patient = await Users().findOne({ _id: new ObjectId(report.patient_id) });
    // pull the doctor’s user record for name/specialty
    const doctor = doctorRec?.user_id
        ? await Users().findOne({ _id: doctorRec.user_id })
        : null;

    return { report, appointment, patient, doctor, doctorRec };
}
// ─── 1) List all generated‐PDF history ─────────────────────
exports.getGeneratedPatientReports = async (req, res) => {
    try {
        const history = await PatientReportHistory()
            .find()
            .sort({ generatedAt: -1 })
            .toArray();
        res.json(history);
    } catch (err) {
        console.error('Error fetching patient report history:', err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

// ─── 2) Show JSON details for a single report ──────────────
exports.getPatientReportDetails = async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ error: 'Invalid report ID' });

    try {
        const details = await getPatientReportDetails(id);
        if (!details)
            return res.status(404).json({ error: 'Report not found' });
        res.json(details);
    } catch (err) {
        console.error('Error fetching report details:', err);
        res.status(500).json({ error: 'Failed to fetch details' });
    }
};
// ─── 3) Generate & save single‐report PDF ─────────────────────────────────
exports.generatePatientReportPDF = async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ error: 'Invalid report ID' });

    try {
        const details = await getPatientReportDetails(id);
        if (!details)
            return res.status(404).json({ error: 'Report not found' });

        const { report, appointment, patient, doctor, doctorRec } = details;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // embed logo
        const logoPath = path.join(__dirname, '../assets/dmc.png');
        let logoImg = null;
        if (fs.existsSync(logoPath)) {
            const bytes = fs.readFileSync(logoPath);
            logoImg = await pdfDoc.embedPng(bytes);
        }

        // start drawing
        const page = pdfDoc.addPage([600, 800]);
        let y = 760;
        if (logoImg) {
            page.drawImage(logoImg, { x: 400, y: y - 20, width: 100, height: 40 });
        }

        // header
        page.drawText('DMC HEALTHCARE', { x: 50, y, size: 18, font: bold, color: rgb(0, 0.2, 0.6) });
        y -= 25;
        page.drawText('Patient Medical Report', { x: 50, y, size: 14, font: bold });
        y -= 20;

        // issued timestamp
        page.drawText(`Issued: ${new Date(report.createdAt).toLocaleString()}`, {
            x: 50, y, size: 10, font
        });
        y -= 15;

        // safe doctor info
        const dFirst = doctor?.first_name ?? 'Unknown';
        const dLast = doctor?.last_name ?? '';
        const spec = doctorRec?.specialization ?? 'N/A';
        page.drawText(
            `Doctor: Dr. ${dFirst} ${dLast} (${spec})`,
            { x: 50, y, size: 10, font }
        );
        y -= 15;

        // appointment date/time
        page.drawText(
            `Appointment: ${appointment.date} at ${appointment.time}`,
            { x: 50, y, size: 10, font }
        );
        y -= 20;

        page.drawText('Distinct Medicine Complex | www.dmc.com | info@dmc.com', {
            x: 50, y, size: 10, font
        });
        y -= 30;

        // section helpers
        const divider = label => {
            page.drawText('-'.repeat(80), { x: 50, y, size: 10, font, color: rgb(0.6, 0.6, 0.6) });
            y -= 20;
            page.drawText(label, { x: 50, y, size: 13, font: bold, color: rgb(0.2, 0.2, 0.2) });
            y -= 18;
        };
        const field = (label, val) => {
            page.drawText(label, { x: 50, y, size: 12, font: bold, color: rgb(0.15, 0.3, 0.45) });
            page.drawText(val, { x: 200, y, size: 12, font });
            y -= 18;
        };

        // Patient Info
        divider('Patient Information');
        field('Name:', `${patient?.first_name ?? 'N/A'} ${patient?.last_name ?? ''}`);
        // field('Patient ID:', report.patient_id.toString());
        field('Phone:', patient?.phone_number ?? 'N/A');


        // // Doctor Info
        // divider('Doctor Information');
        // field('Name:', `Dr. ${dFirst} ${dLast}`);
        // field('Specialty:', spec);

        // // Appointment
        // divider('Appointment');
        // field('Date:', appointment.date);
        // field('Time:', appointment.time);
        // field('Type:', appointment.appointment_type);
        // field('Status:', appointment.status);

        // Report Details
        divider('Record Details');
        field('Diagnosis:', report.diagnosis);
        field('Treatment:', report.treatment);
        field('Prescription State:', report.prescription_state);

        // footer
        page.drawText('Thank you for trusting DMC Healthcare.', {
            x: 50, y: 40, size: 10, font
        });
        page.drawText('Contact us at info@dmc.com', {
            x: 50, y: 25, size: 10, font
        });

        // save & archive
        const pdfBytes = await pdfDoc.save();
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
        const filename = `patient_${id}_${Date.now()}.pdf`;
        fs.writeFileSync(path.join(uploadsDir, filename), pdfBytes);
        await PatientReportHistory().insertOne({
            report_id: new ObjectId(id),
            generatedAt: new Date(),
            filename,
            downloadUrl: `/uploads/${filename}`
        });

        // stream back
        res
            .setHeader('Content-Type', 'application/pdf')
            .setHeader('Content-Disposition', `inline; filename=${filename}`)
            .send(pdfBytes);

    } catch (err) {
        console.error('Failed to generate patient report PDF:', err);
        res.status(500).json({ error: 'PDF generation failed' });
    }
};


// ─── 4) Generate & save ALL‐reports PDF ─────────────────────────────────
exports.generateAllPatientReportsPDF = async (req, res) => {
    const { patientId } = req.params;
    if (!ObjectId.isValid(patientId))
        return res.status(400).json({ error: 'Invalid patientId' });

    try {
        // 1) fetch the patient from users (not from patients collection)
        const patient = await Users().findOne({ _id: new ObjectId(patientId) });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // 2) load all raw report docs for that patient
        const rawReports = await PatientReports()
            .find({ patient_id: new ObjectId(patientId) })
            .sort({ createdAt: -1 })
            .toArray();

        if (rawReports.length === 0)
            return res.status(404).json({ error: 'No reports to combine' });

        // 3) enrich each with appointment & doctor/user details
        let detailsList = await Promise.all(
            rawReports.map(r => getPatientReportDetails(r._id.toString()))
        );

        // filter out any report where we couldn’t load the appointment
        detailsList = detailsList.filter(det => {
            if (!det) {
                console.warn('Could not load details for one report');
                return false;
            }
            if (!det.appointment) {
                console.warn(`Missing appointment for report ${det.report._id}`);
                return false;
            }
            return true;
        });

        if (detailsList.length === 0) {
            return res.status(404).json({ error: 'No valid reports to combine' });
        }


        // 4) start a new PDF
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // 5) embed logo once
        const logoPath = path.join(__dirname, '../assets/dmc.png');
        let logoImg = null;
        if (fs.existsSync(logoPath)) {
            const bytes = fs.readFileSync(logoPath);
            logoImg = await pdfDoc.embedPng(bytes);
        }

        // 6) helpers for pages
        const newPage = () => {
            const page = pdfDoc.addPage([600, 800]);
            return { page, yRef: { current: 760 } };
        };
        const divider = (page, y, label) => {
            page.drawText('-'.repeat(80), { x: 50, y, size: 10, font, color: rgb(0.6, 0.6, 0.6) });
            y -= 20;
            page.drawText(label, { x: 50, y, size: 13, font: bold, color: rgb(0.2, 0.2, 0.2) });
            return y - 18;
        };
        const field = (page, y, label, val) => {
            page.drawText(label, { x: 50, y, size: 12, font: bold, color: rgb(0.15, 0.3, 0.45) });
            page.drawText(val, { x: 200, y, size: 12, font });
            return y - 18;
        };

        // 7) build one page per report
        for (const det of detailsList) {
            const { report, appointment, patient, doctor, doctorRec } = det;
            const { page, yRef } = newPage();
            let y = yRef.current;

            // — embed logo —
            if (logoImg) {
                page.drawImage(logoImg, { x: 400, y: y - 20, width: 100, height: 40 });
            }

            // — HEADER —
            page.drawText('DMC HEALTHCARE', { x: 50, y, size: 18, font: bold, color: rgb(0, 0.2, 0.6) });
            y -= 25;
            page.drawText('Patient Medical Report', { x: 50, y, size: 14, font: bold });
            y -= 20;

            // issued timestamp
            page.drawText(
                `Issued: ${new Date(report.createdAt).toLocaleString()}`,
                { x: 50, y, size: 10, font }
            );
            y -= 15;

            // safe doctor info
            const dFirst = doctor?.first_name ?? 'Unknown';
            const dLast = doctor?.last_name ?? '';
            const spec = doctorRec?.specialization ?? 'N/A';
            page.drawText(
                `Doctor: Dr. ${dFirst} ${dLast} (${spec})`,
                { x: 50, y, size: 10, font }
            );
            y -= 15;

            // appointment date/time
            page.drawText(
                `Appointment: ${appointment.date} at ${appointment.time}`,
                { x: 50, y, size: 10, font }
            );
            y -= 20;

            // DMC contact line
            page.drawText(
                'Distinct Medicine Complex | www.dmc.com | info@dmc.com',
                { x: 50, y, size: 10, font }
            );
            y -= 30;

            // — now your section helpers (divider / field) —
            y = divider(page, y, 'Patient Information');
            y = field(page, y, 'Name:', `${patient.first_name} ${patient.last_name}`);
            y = field(page, y, 'Phone:', patient.phone_number || 'N/A');
            // y = field(page, y, 'Address:', patient.address || 'N/A');

            // y = divider(page, y, 'Doctor Information');
            // y = field(page, y, 'Name:', `Dr. ${dFirst} ${dLast}`);
            // y = field(page, y, 'Specialty:', spec);

            // y = divider(page, y, 'Appointment');
            // y = field(page, y, 'Date:', appointment.date);
            // y = field(page, y, 'Time:', appointment.time);
            // y = field(page, y, 'Type:', appointment.appointment_type);
            // y = field(page, y, 'Status:', appointment.status);

            y = divider(page, y, 'Record Details');
            y = field(page, y, 'Diagnosis:', report.diagnosis);
            y = field(page, y, 'Treatment:', report.treatment);
            y = field(page, y, 'Prescription State:', report.prescription_state);

            // footer marker
            page.drawText('— end —', { x: 50, y: 30, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
        }

        // 8) save & archive
        const pdfBytes = await pdfDoc.save();
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
        const filename = `patient_${patientId}_all_${Date.now()}.pdf`;
        fs.writeFileSync(path.join(uploadsDir, filename), pdfBytes);

        await PatientReportHistory().insertOne({
            patient_id: new ObjectId(patientId),
            generatedAt: new Date(),
            filename,
            downloadUrl: `/uploads/${filename}`
        });

        // 9) stream back
        res
            .setHeader('Content-Type', 'application/pdf')
            .setHeader('Content-Disposition', `inline; filename=${filename}`)
            .send(pdfBytes);

    } catch (err) {
        console.error('Failed to generate combined PDF:', err);
        res.status(500).json({ error: 'Combined PDF failed' });
    }
};





// ─── 5) Create new report record (unchanged) ─────────────
exports.createPatientMedicalReport = async (req, res) => {
    // 1) validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    // 2) pull out user‐table IDs
    const {
        diagnosis,
        treatment,
        prescription_state = 'Pending',
        patient_id: patientUserId,
        doctor_id: doctorUserId,
        appointment_id
    } = req.body;

    try {
        // 3) lookup the Patients document by its user_id
        const patientDoc = await Users().findOne({
            _id: new ObjectId(patientUserId)
        });
        if (!patientDoc) {
            return res.status(400).json({ error: 'Patient record not found' });
        }

        // 4) lookup the Doctors document by its user_id
        const doctorDoc = await Doctors().findOne({
            _id: new ObjectId(doctorUserId)
        });
        if (!doctorDoc) {
            return res.status(400).json({ error: 'Doctor record not found' });
        }


        // 5) ensure the appointment actually belongs to that doctor & patient
        const appt = await Appointments().findOne({
            _id: new ObjectId(appointment_id),
            doctor_id: doctorDoc._id,
            patient_id: patientDoc._id
        });
        if (!appt) {
            return res
                .status(400)
                .json({ error: 'Appointment does not match given patient & doctor' });
        }

        // 6) build your report document using the *collection* IDs
        const reportDoc = {
            diagnosis,
            treatment,
            prescription_state,
            patient_id: patientDoc._id,
            doctor_id: doctorDoc._id,
            appointment_id: new ObjectId(appointment_id),
            createdAt: new Date(),
        };

        // 7) insert & return
        const { insertedId } = await PatientReports().insertOne(reportDoc);
        res.status(201).json({ _id: insertedId, ...reportDoc });
    } catch (err) {
        console.error('Could not create report:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// ─── List JSON all past reports for a patient ───────────────
exports.getAllReportsForPatient = async (req, res) => {
    const { patientId } = req.params;
    if (!ObjectId.isValid(patientId))
        return res.status(400).json({ error: 'Invalid patientId' });

    try {
        const reports = await PatientReports()
            .find({ patient_id: new ObjectId(patientId) })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(reports);
    } catch (err) {
        console.error('Error fetching patient reports:', err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

// ─── Pharmacist: List all medical reports for dashboard ─────────────
exports.getAllReportsForPharmacist = async (req, res) => {
    try {
        // Join with users to get patient name
        const reports = await PatientReports().aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "patient_id",
                    foreignField: "_id",
                    as: "patientInfo"
                }
            },
            { $unwind: "$patientInfo" },
            {
                $project: {
                    _id: 1,
                    diagnosis: 1,
                    treatment: 1,
                    prescription_state: 1,
                    createdAt: 1,
                    patient_name: { $concat: ["$patientInfo.first_name", " ", "$patientInfo.last_name"] }
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();
        res.json(reports);
    } catch (err) {
        console.error("Error fetching reports for pharmacist:", err);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
};
