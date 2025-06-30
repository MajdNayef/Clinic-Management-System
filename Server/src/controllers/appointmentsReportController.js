const { ObjectId } = require('mongodb');
const { collection } = require('../config/db');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const Appointments = () => collection('appointments');
const Users = () => collection('users');
const Doctors = () => collection('doctors');
const ChatSessions = () => collection('chat_sessions');
const ChatMessages = () => collection('chat_messages');
const Feedbacks = () => collection('feedbacks');
const AppointmentReports = () => collection('appointment_reports');

// Helper to fetch detailed appointment info
async function getAppointmentDetails(appointmentId) {
    const appointment = await Appointments().findOne({ _id: new ObjectId(appointmentId) });
    if (!appointment) return null;

    const doctor = await Doctors().findOne({ _id: appointment.doctor_id });
    const doctorUser = doctor ? await Users().findOne({ _id: doctor.user_id }) : null;
    const patient = await Users().findOne({ _id: appointment.patient_id });

    const chatSession = await ChatSessions().findOne({ appointmentId: appointment._id });
    const chatMessages = chatSession
        ? await ChatMessages().find({ chat_id: chatSession._id }).sort({ timestamp: 1 }).toArray()
        : [];

    const feedback = await Feedbacks().findOne({ appointment_id: new ObjectId(appointment._id) });

    return { appointment, doctor: doctorUser, patient, chatMessages, feedback };
}

exports.getGeneratedAppointmentReports = async (req, res) => {
    try {
        const history = await AppointmentReports().find().sort({ generatedAt: -1 }).toArray();
        res.json(history);
    } catch (err) {
        console.error('Error loading report history:', err);
        res.status(500).json({ message: 'Failed to load reports' });
    }
};
// GET /api/admin/reports/appointments/details/:id
exports.getAppointmentDetails = async (req, res) => {
    const appointmentId = req.params.id;

    if (!ObjectId.isValid(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    try {
        const details = await getAppointmentDetails(appointmentId);
        if (!details) return res.status(404).json({ message: 'Appointment not found' });
        res.json(details);
    } catch (err) {
        console.error('Error fetching appointment details:', err);
        res.status(500).json({ message: 'Failed to fetch appointment details' });
    }
};




exports.generateAppointmentPDF = async (req, res) => {
    const appointmentId = req.params.id;
    try {
        const details = await getAppointmentDetails(appointmentId);
        if (!details) return res.status(404).json({ message: 'Appointment not found' });

        const { appointment, doctor, patient, feedback, chatMessages } = details;

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        let y = 760;
        // ✅ Load and embed logo image
        const logoPath = path.join(__dirname, '../assets/dmc.png');
        const logoImageBytes = fs.readFileSync(logoPath);
        const pngImage = await pdfDoc.embedPng(logoImageBytes); // use embedJpg() if JPG
        page.drawImage(pngImage, {
            x: 400,
            y: y - 20,
            width: 100,
            height: 40
        });
        const drawHeader = () => {

            page.drawText("DMC HEALTHCARE", {
                x: 50,
                y,
                size: 18,
                font: boldFont,
                color: rgb(0, 0.2, 0.6)
            });
            y -= 25;
            page.drawText("Appointment Consultation Report", {
                x: 50,
                y,
                size: 14,
                font: boldFont,
                color: rgb(0, 0, 0)
            });
            y -= 20;
            page.drawText(`Date of Issue: ${new Date().toLocaleString()}`, {
                x: 50,
                y,
                size: 10,
                font,
                color: rgb(0.3, 0.3, 0.3)
            });
            y -= 15;
            page.drawText("Distinct Medicine Complex | www.dmc.com | info@dmc.com", {
                x: 50,
                y,
                size: 10,
                font,
                color: rgb(0.3, 0.3, 0.3)
            });
            y -= 30;
        };

        const drawFooter = () => {
            page.drawText("Thank you for choosing DMC Healthcare.", {
                x: 50,
                y: 30,
                size: 10,
                font,
                color: rgb(0.3, 0.3, 0.3)
            });
            page.drawText("For inquiries, contact us at info@dmc.com.", {
                x: 50,
                y: 15,
                size: 10,
                font,
                color: rgb(0.3, 0.3, 0.3)
            });
        };

        const drawSectionDivider = (label) => {
            y -= 15;
            page.drawText('---------------------------------------------------------------------------------------------------------------------------------', {
                x: 50,
                y,
                size: 10,
                font,
                color: rgb(0.6, 0.6, 0.6)
            });
            y -= 20;
            page.drawText(label, {
                x: 50,
                y,
                size: 13,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2)
            });
            y -= 15;
        };

        const drawLabelValue = (label, value = '', size = 12, spacing = 18) => {
            page.drawText(`${label}`, {
                x: 50,
                y,
                size,
                font: boldFont,
                color: rgb(0.15, 0.3, 0.45)
            });
            page.drawText(`${value}`, {
                x: 200,
                y,
                size,
                font,
                color: rgb(0, 0, 0)
            });
            y -= spacing;
        };

        // === Header Section ===
        drawHeader();

        // === Appointment Details Section ===
        drawSectionDivider("Appointment Details");
        drawLabelValue("Appointment ID:", appointment._id.toString());
        drawLabelValue("Type:", appointment.appointment_type);
        drawLabelValue("Date:", appointment.date);
        drawLabelValue("Time:", appointment.time);
        drawLabelValue("Status:", appointment.status);

        // === Doctor Information Section ===
        drawSectionDivider("Doctor Information");
        drawLabelValue("Name:", `Dr. ${doctor?.first_name || ''} ${doctor?.last_name || ''}`);
        drawLabelValue("Specialization:", doctor.doctorData?.specialization || 'N/A');
        drawLabelValue("Email:", doctor?.email || 'N/A');
        drawLabelValue("Phone:", doctor?.phone_number || 'N/A');

        // === Patient Information Section ===
        drawSectionDivider("Patient Information");
        drawLabelValue("Name:", `${patient?.first_name || ''} ${patient?.last_name || ''}`);
        drawLabelValue("Email:", patient?.email || 'N/A');
        drawLabelValue("Phone:", patient?.phone_number || 'N/A');

        // === Feedback Section ===
        drawSectionDivider("Feedback Summary");
        drawLabelValue("Rating:", feedback?.rating?.toString() || 'N/A');
        drawLabelValue("Note:", feedback?.note || 'No note provided');

        // === Chat Transcript Section (if applicable) ===
        if (appointment.appointment_type?.toLowerCase() === 'virtual' && chatMessages.length > 0) {
            drawSectionDivider("Chat Transcript (Top 10)");
            for (const msg of chatMessages.slice(0, 10)) {
                const sender = msg.sender?.toString() === doctor?._id?.toString() ? 'Doctor' : 'Patient';
                const line = `${sender}: ${msg.content}`;
                page.drawText(line, {
                    x: 60,
                    y,
                    size: 10,
                    font,
                    color: rgb(0, 0, 0)
                });
                y -= 15;
                if (y < 50) break;
            }
        }

        // === Footer Section ===
        drawFooter();

        const pdfBytes = await pdfDoc.save();

        const filename = `appointment_${appointmentId}_${Date.now()}.pdf`;
        const downloadUrl = `/uploads/${filename}`;
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        const savePath = path.join(uploadsDir, filename);
        fs.writeFileSync(savePath, pdfBytes);

        await AppointmentReports().insertOne({
            appointment_id: new ObjectId(appointmentId),
            generatedAt: new Date(),
            filename,
            downloadUrl
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${filename}`);
        res.send(pdfBytes);
    } catch (err) {
        console.error('PDF generation failed:', err);
        res.status(500).json({ message: 'Failed to generate report', error: err.message });
    }
};