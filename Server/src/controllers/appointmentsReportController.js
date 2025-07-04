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
const AppointmentStats = () => collection("appointment_statistics_reports");
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

exports.getDoctorPerformanceSummary = async (req, res) => {
    try {
        const summary = await Doctors().aggregate([
            /* 1️⃣ join user profile so we have the name */
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },

            /* 2️⃣ pull in all appointments for this doctor */
            {
                $lookup: {
                    from: "appointments",
                    localField: "_id",
                    foreignField: "doctor_id",
                    as: "appointments"
                }
            },

            /* 3️⃣ pull in feedbacks by doctor_id (optional) */
            {
                $lookup: {
                    from: "feedbacks",
                    localField: "_id",
                    foreignField: "doctor_id",
                    as: "feedbacks"
                }
            },

            /* 4️⃣ compute counts directly in $addFields */
            {
                $addFields: {
                    totalAppointments: { $size: "$appointments" },
                    virtualCount: {
                        $size: {
                            $filter: {
                                input: "$appointments",
                                as: "a",
                                cond: { $eq: ["$$a.appointment_type", "Virtual"] }
                            }
                        }
                    },
                    physicalCount: {
                        $size: {
                            $filter: {
                                input: "$appointments",
                                as: "a",
                                cond: { $eq: ["$$a.appointment_type", "In-Person"] }
                            }
                        }
                    },
                    averageRating: {
                        $cond: [
                            { $gt: [{ $size: "$feedbacks" }, 0] },
                            { $avg: "$feedbacks.rating" },
                            0
                        ]
                    }
                }
            },

            /* 5️⃣ final projection so the shape matches your table */
            {
                $project: {
                    _id: 0,
                    doctorId: "$_id",
                    name: {
                        $concat: ["$user.first_name", " ", "$user.last_name"]
                    },
                    specialization: 1,
                    totalAppointments: 1,
                    virtualCount: 1,
                    physicalCount: 1,
                    averageRating: { $round: ["$averageRating", 1] }
                }
            }
        ]).toArray();

        res.status(200).json(summary);
    } catch (error) {
        console.error("Doctor Performance Summary Error:", error);
        res.status(500).json({ error: "Failed to get doctor performance summary." });
    }
};



// Generate PDF report per doctor
exports.generateDoctorPerformancePDF = async (req, res) => {
    const { doctorId } = req.params;

    try {
        const doctor = await Doctors().findOne({ _id: new ObjectId(doctorId) });
        if (!doctor) return res.status(404).json({ error: "Doctor not found" });

        const user = doctor.user_id ? await Users().findOne({ _id: doctor.user_id }) : null;
        const appointments = await Appointments().find({ doctor_id: new ObjectId(doctorId) }).toArray();

        // Fetch feedbacks based on appointment_id for all appointments related to the doctor
        const feedbacks = await Feedbacks().find({
            appointment_id: { $in: appointments.map(a => a._id) }
        }).toArray();

        const averageRating =
            feedbacks.length > 0
                ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
                : "N/A";

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        let y = 760;

        const logoPath = path.join(__dirname, '../assets/dmc.png');
        const logoImageBytes = fs.readFileSync(logoPath);
        const pngImage = await pdfDoc.embedPng(logoImageBytes);
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
            page.drawText("Doctor Performance Report", {
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

        // === Doctor Information Section ===
        drawSectionDivider("Doctor Information");
        drawLabelValue("Name:", user ? `${user.first_name} ${user.last_name}` : "Unknown");
        drawLabelValue("Specialization:", doctor.specialization || "N/A");
        drawLabelValue("Bio:", doctor.bio || "N/A");
        drawLabelValue("Available Days:", doctor.available_days?.join(", ") || "N/A");
        drawLabelValue("Available Start Time:", doctor.available_start_time || "N/A");
        drawLabelValue("Available End Time:", doctor.available_end_time || "N/A");

        // === Appointment Summary Section ===
        drawSectionDivider("Appointment Summary");
        drawLabelValue("Total Appointments:", appointments.length.toString());
        drawLabelValue("Virtual Appointments:", appointments.filter(a => a.appointment_type === "Virtual").length.toString());
        drawLabelValue("Physical Appointments:", appointments.filter(a => a.appointment_type === "In-Person").length.toString());

        // === Feedback Summary Section ===
        drawSectionDivider("Feedback Summary");
        drawLabelValue("Average Rating:", averageRating);
        feedbacks.slice(0, 5).forEach((fb, i) => {
            drawLabelValue(`Feedback ${i + 1}:`, fb.note || "No comment");
        });

        // === Footer Section ===
        drawFooter();

        const pdfBytes = await pdfDoc.save();

        const filename = `doctor_${doctorId}_${Date.now()}.pdf`;
        const downloadUrl = `/uploads/${filename}`;
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        const savePath = path.join(uploadsDir, filename);
        fs.writeFileSync(savePath, pdfBytes);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${filename}`);
        res.send(pdfBytes);
    } catch (error) {
        console.error("PDF generation failed:", error);
        res.status(500).json({ error: "Failed to generate doctor performance report." });
    }
};



/* appointments staticts section */

/**
 * POST /api/admin/reports/appointments/statistics/range
 * Body: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
 */
exports.generateStatsForRange = async (req, res) => {
    const { start, end } = req.body;

    // basic validation
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(start) || !isoRegex.test(end) || start > end)
        return res
            .status(400)
            .json({ message: "start and end must be YYYY-MM-DD and start ≤ end" });

    try {
        /* ------------------------------------------------------------
           Aggregate counts from appointments within the requested span
           - your 'date' field is stored as ISO string "YYYY-MM-DD"
           - string range comparison works because the format is lexicographic
           ------------------------------------------------------------ */
        const [{ total = 0, f2f = 0, virtual = 0 } = {}] =
            await Appointments().aggregate([
                {
                    $match: {
                        date: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        f2f: { $sum: { $cond: [{ $eq: ["$appointment_type", "In-Person"] }, 1, 0] } },
                        virtual: { $sum: { $cond: [{ $eq: ["$appointment_type", "Virtual"] }, 1, 0] } }
                    }
                }
            ]).toArray();

        /* ------------------------------------------------------------
           Prepare the stats doc
           ------------------------------------------------------------ */
        const statsDoc = {
            report_date_range: `${start}_to_${end}`,
            range_start: start,
            range_end: end,
            total_appointments: total,
            f2f_appointments: f2f,
            virtual_appointments: virtual,
            created_at: new Date()
        };

        /* ------------------------------------------------------------
           Upsert so there is only ONE document per exact date range
           (range key keeps things unique; adjust if you prefer ObjectId every time)
           ------------------------------------------------------------ */
        const { value: saved } = await AppointmentStats().findOneAndUpdate(
            { report_date_range: statsDoc.report_date_range },
            { $set: statsDoc },
            { upsert: true, returnDocument: "after" }
        );

        res.json(saved);   // return the stored/updated document
    } catch (err) {
        console.error("Date-range stats generation error:", err);
        res.status(500).json({ message: "Failed to generate statistics." });
    }
};


// controllers/AppointmentReportController.js


/** Utility: turn YYYY-MM -> first/last ISO dates */
function monthBounds(yyyyMm) {
    const [yr, mo] = yyyyMm.split("-").map(Number);                // e.g. 2025-05
    const start = new Date(Date.UTC(yr, mo - 1, 1));               // 1st 00:00Z
    const end = new Date(Date.UTC(yr, mo, 0, 23, 59, 59, 999));  // last 23:59Z
    return { start, end };
}

/* ============================================================
   POST /api/admin/reports/appointments/statistics
   Body: { month: "YYYY-MM" }   –-generate or refresh that month’s stats
   ============================================================ */
exports.createAppointmentStatistics = async (req, res) => {
    const { month } = req.body;
    if (!month || !/^\d{4}-\d{2}$/.test(month))
        return res.status(400).json({ message: "month must be YYYY-MM" });

    try {
        const { start, end } = monthBounds(month);

        // Aggregate counts for the month
        const [{ total = 0, f2f = 0, virtual = 0 } = {}] =
            await Appointments().aggregate([
                { $match: { date: { $gte: start.toISOString().slice(0, 10), $lte: end.toISOString().slice(0, 10) } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        f2f: { $sum: { $cond: [{ $eq: ["$appointment_type", "In-Person"] }, 1, 0] } },
                        virtual: { $sum: { $cond: [{ $eq: ["$appointment_type", "Virtual"] }, 1, 0] } }
                    }
                }
            ]).toArray();

        // Upsert into statistics collection
        const statsDoc = {
            report_date_range: month,
            total_appointments: total,
            f2f_appointments: f2f,
            virtual_appointments: virtual,
            created_at: new Date()
        };

        const { value: saved } = await AppointmentStats().findOneAndUpdate(
            { report_date_range: month },
            { $set: statsDoc },
            { upsert: true, returnDocument: "after" }
        );

        res.json(saved);          // return the stored document (incl. _id)
    } catch (err) {
        console.error("Stats generation error:", err);
        res.status(500).json({ message: "Failed to generate statistics." });
    }
};/**
* GET /api/admin/reports/appointments/statistics?start=YYYY-MM&end=YYYY-MM
* Returns one stats doc per month in the inclusive range.  Any month that
* isn’t present in appointment_statistics_reports is calculated directly
* from appointments, saved, and then included in the response.
*/
exports.getAppointmentStatistics = async (req, res) => {
    const { start, end } = req.query;
    const yyyyMm = /^\d{4}-\d{2}$/;

    if (!start || !end || !yyyyMm.test(start) || !yyyyMm.test(end) || start > end) {
        return res
            .status(400)
            .json({ message: "query params start and end (YYYY-MM) are required, and start ≤ end." });
    }

    try {
        /* -------------------------------------------
           1️⃣  Pull whatever is already stored
           ------------------------------------------- */
        const existing = await AppointmentStats()
            .find({ report_date_range: { $gte: start, $lte: end } })
            .toArray();

        // quick lookup set: { "2025-05": true, "2025-06": true, … }
        const have = new Set(existing.map((s) => s.report_date_range));

        /* -------------------------------------------
           2️⃣  Aggregate missing months directly from
               appointments (date stored as "YYYY-MM-DD")
           ------------------------------------------- */
        const missingAgg = await Appointments()
            .aggregate([
                // project year-month
                {
                    $project: {
                        ym: { $substr: ["$date", 0, 7] },          // "2025-06"
                        appointment_type: 1
                    }
                },
                // only months in requested window AND not yet in stats
                {
                    $match: {
                        ym: { $gte: start, $lte: end, $nin: Array.from(have) }
                    }
                },
                // group per-month
                {
                    $group: {
                        _id: "$ym",
                        total: { $sum: 1 },
                        f2f: { $sum: { $cond: [{ $eq: ["$appointment_type", "In-Person"] }, 1, 0] } },
                        virtual: { $sum: { $cond: [{ $eq: ["$appointment_type", "Virtual"] }, 1, 0] } }
                    }
                }
            ])
            .toArray();

        /* -------------------------------------------
           3️⃣  Upsert each newly-calculated month
           ------------------------------------------- */
        if (missingAgg.length) {
            const bulk = missingAgg.map((m) => ({
                updateOne: {
                    filter: { report_date_range: m._id },
                    update: {
                        $set: {
                            report_date_range: m._id,
                            total_appointments: m.total,
                            f2f_appointments: m.f2f,
                            virtual_appointments: m.virtual,
                            created_at: new Date()
                        }
                    },
                    upsert: true
                }
            }));
            await AppointmentStats().bulkWrite(bulk);
        }

        /* -------------------------------------------
           4️⃣  Return the **complete** set for the range
           ------------------------------------------- */
        const stats = await AppointmentStats()
            .find({ report_date_range: { $gte: start, $lte: end } })
            .sort({ report_date_range: 1 })
            .toArray();

        res.json(stats);
    } catch (err) {
        console.error("Appointment statistics fetch error:", err);
        res.status(500).json({ message: "Failed to load appointment statistics." });
    }
};

exports.generateAppointmentStatisticsPDF = async (req, res) => {
    const { id } = req.params;

    // Accept either an ObjectId *or* the custom range key (e.g. 2025-05-01_to_2025-07-04)
    let stat;
    if (ObjectId.isValid(id)) {
        stat = await AppointmentStats().findOne({ _id: new ObjectId(id) });
    } else {
        stat = await AppointmentStats().findOne({ report_date_range: id });
    }

    if (!stat) return res.status(404).json({ message: "Statistics report not found." });

    try {
        /* ---------- PDF BUILD ---------- */
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        let y = 760;

        // ── Logo ────────────────────────────────────────────────────────────────
        const logoBytes = fs.readFileSync(path.join(__dirname, "../assets/dmc.png"));
        const logoImg = await pdfDoc.embedPng(logoBytes);
        page.drawImage(logoImg, { x: 400, y: y - 20, width: 100, height: 40 });

        // ── Helpers ────────────────────────────────────────────────────────────
        const hdr = (txt, size, dy, c = rgb(0, 0, 0)) => {
            page.drawText(txt, { x: 50, y, size, font: size > 12 ? boldFont : font, color: c }); y -= dy;
        };
        const divider = (label) => {
            y -= 15;
            hdr("————————————————————————————————————————————————————————————————————————————————————", 10, 5, rgb(0.6, 0.6, 0.6));
            hdr(label, 13, 20, rgb(0.15, 0.15, 0.15));
        };
        const field = (label, value, spacing = 18) => {
            page.drawText(label, { x: 50, y, size: 12, font: boldFont, color: rgb(0.15, 0.3, 0.45) });
            page.drawText(String(value), { x: 200, y, size: 12, font });
            y -= spacing;
        };

        // ── Header ─────────────────────────────────────────────────────────────
        hdr("DMC HEALTHCARE", 18, 25, rgb(0, 0.2, 0.6));
        hdr("Appointment Statistics Report", 14, 20);
        hdr(`Date of Issue: ${new Date().toLocaleString()}`, 10, 15, rgb(0.3, 0.3, 0.3));
        hdr("Distinct Medicine Complex | www.dmc.com | info@dmc.com", 10, 30, rgb(0.3, 0.3, 0.3));

        // ── Statistics Summary ────────────────────────────────────────────────
        divider("Statistics Summary");

        const rangeLabel =
            stat.range_start && stat.range_end
                ? `${stat.range_start}  →  ${stat.range_end}`
                : stat.report_date_range;

        field("Date Range:", rangeLabel);
        field("Total Appointments:", stat.total_appointments);
        field("Physical:", stat.f2f_appointments);
        field("Virtual:", stat.virtual_appointments);
        field("Record Created:", new Date(stat.created_at).toLocaleDateString());

        // ── Footer ─────────────────────────────────────────────────────────────
        page.drawText("Thank you for choosing DMC Healthcare.",
            { x: 50, y: 30, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
        page.drawText("For inquiries, contact us at info@dmc.com.",
            { x: 50, y: 15, size: 10, font, color: rgb(0.3, 0.3, 0.3) });

        /* ---------- Save & stream ---------- */
        const pdfBytes = await pdfDoc.save();
        const filename = `appointment_stats_${stat.report_date_range}_${Date.now()}.pdf`;
        const uploads = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploads)) fs.mkdirSync(uploads);

        fs.writeFileSync(path.join(uploads, filename), pdfBytes); // optional archive
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=${filename}`);
        res.send(pdfBytes);
    } catch (err) {
        console.error("Statistics PDF generation error:", err);
        res.status(500).json({ message: "Failed to generate statistics report." });
    }
};
