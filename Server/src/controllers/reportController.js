// // File: server/controllers/reportController.js (partial for Appointment Reports)

// const { ObjectId } = require("mongodb");
// const { collection } = require("../config/db");
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");

// const appointments = () => collection("appointments");
// const users = () => collection("users");
// const doctors = () => collection("doctors");
// const feedbacks = () => collection("feedbacks");
// const sessions = () => collection("chat_sessions");
// const messages = () => collection("chat_messages");
// const reportLogs = () => collection("appointment_reports");

// exports.generateAppointmentReport = async (req, res) => {
//     const { appointmentId } = req.params;
//     if (!ObjectId.isValid(appointmentId)) {
//         return res.status(400).json({ error: "Invalid appointmentId" });
//     }

//     const apptOid = new ObjectId(appointmentId);

//     try {
//         const appointment = await appointments().findOne({ _id: apptOid });
//         if (!appointment) return res.status(404).json({ error: "Appointment not found" });

//         const doctor = await doctors().findOne({ _id: appointment.doctor_id });
//         const doctorUser = await users().findOne({ _id: doctor.user_id });
//         const patient = await users().findOne({ _id: appointment.patient_id });

//         const feedback = await feedbacks().findOne({ appointment_id: apptOid });
//         const session = await sessions().findOne({ appointmentId: apptOid });
//         const chatHistory = session
//             ? await messages()
//                 .find({ chat_id: session._id })
//                 .sort({ timestamp: 1 })
//                 .toArray()
//             : [];

//         // Generate PDF
//         const doc = new PDFDocument();
//         const fileName = `appointment_report_${appointmentId}_${Date.now()}.pdf`;
//         const filePath = path.join(__dirname, `../pdfs/${fileName}`);
//         doc.pipe(fs.createWriteStream(filePath));

//         doc.fontSize(20).text("Appointment Report", { align: "center" });
//         doc.moveDown();

//         doc.fontSize(14).text(`Appointment ID: ${appointmentId}`);
//         doc.text(`Date: ${appointment.date}`);
//         doc.text(`Time: ${appointment.time}`);
//         doc.text(`Type: ${appointment.appointment_type}`);
//         doc.text(`Status: ${appointment.status}`);

//         doc.moveDown().text(`Doctor: ${doctorUser.first_name} ${doctorUser.last_name}`);
//         doc.text(`Patient: ${patient.first_name} ${patient.last_name}`);

//         if (feedback) {
//             doc.moveDown().text("Feedback:", { underline: true });
//             doc.text(`Rating: ${feedback.rating}`);
//             doc.text(`Note: ${feedback.note}`);
//         }

//         if (chatHistory.length > 0) {
//             doc.moveDown().text("Chat History:", { underline: true });
//             chatHistory.forEach(msg => {
//                 doc.text(`${msg.sender}: ${msg.content} (${new Date(msg.timestamp).toLocaleString()})`);
//             });
//         }

//         doc.end();

//         // Save metadata to DB
//         await reportLogs().insertOne({
//             appointment_id: apptOid,
//             doctor_id: appointment.doctor_id,
//             patient_id: appointment.patient_id,
//             path: `/pdfs/${fileName}`,
//             createdAt: new Date(),
//         });

//         res.json({ message: "Report generated", filePath: `/pdfs/${fileName}` });
//     } catch (err) {
//         console.error("Failed to generate report:", err);
//         res.status(500).json({ error: "Server error" });
//     }
// };


