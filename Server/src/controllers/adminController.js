const { collection } = require('../config/db');
const { ObjectId } = require('mongodb');
const users = () => collection('users');
const appointments = () => collection('appointments');
const doctors = () => collection('doctors'); // Add missing definition
const patients = () => collection('patients'); // Add missing definition
const { validationResult } = require('express-validator');
const { sendNotificationToUser } = require('./notificationController');



exports.getAllUsers = async (req, res) => {
    try {
        const allUsers = await users()
            .find({}, {
                projection: {
                    password: 0 // exclude password only
                }
            })
            .toArray();
        res.json(allUsers);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};


exports.updateUserById = async (req, res) => {
    try {
        const userId = new ObjectId(req.params.id);
        const updates = { ...req.body };
        delete updates._id; // Remove `_id` to prevent immutable field error

        // Detect role change
        const oldUser = await users().findOne({ _id: userId });
        let roleChanged = false;

        if (!oldUser.role) {
            // Add role if not found in the database
            await users().updateOne({ _id: userId }, { $set: { role: updates.role } });
            roleChanged = true;
        } else {
            roleChanged = oldUser.role !== updates.role;
        }

        // Update user info
        await users().updateOne({ _id: userId }, { $set: updates });

        // Handle doctor-specific updates if the role is "Doctor"
        if (updates.role === "Doctor") {
            const doctorUpdates = req.body.doctorData || {};
            delete doctorUpdates._id; // Remove `_id` to prevent immutable field error

            if (doctorUpdates.available_days && Array.isArray(doctorUpdates.available_days)) {
                doctorUpdates.available_days = doctorUpdates.available_days.map(d => d.trim());
            }

            await doctors().updateOne(
                { user_id: userId }, // Ensure the query matches the correct document
                { $set: doctorUpdates },
                { upsert: true }
            );
        }

        const updated = await users().findOne({ _id: userId }, { projection: { password: 0 } });
        res.json(updated);
    } catch (err) {
        console.error("Update user failed:", err);
        res.status(500).json({ message: "User update failed" });
    }
};


exports.getDashboardStats = async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split("T")[0];

        const [totalUsers, doctors, patients, admins, pharmacists, allAppointments] = await Promise.all([
            users().countDocuments(),
            users().countDocuments({ role: "Doctor" }),
            users().countDocuments({ role: "Patient" }),
            users().countDocuments({ role: "Admin" }),
            users().countDocuments({ role: "Pharmacist" }),
            appointments().find({ date: todayStr }).toArray(),
        ]);

        const virtualAppointments = allAppointments.filter(a => a.appointment_type === "Virtual").length;
        const physicalAppointments = allAppointments.filter(a => a.appointment_type === "Physical").length;

        res.json({
            totalUsers,
            doctors,
            patients,
            admins,
            pharmacists,
            totalAppointments: allAppointments.length,
            virtualAppointments,
            physicalAppointments
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ message: "Failed to load dashboard stats" });
    }

};


exports.deleteUserById = async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        await users().deleteOne({ _id: id });
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
};


exports.getDoctorById = async (req, res) => {
    try {
        const userId = new ObjectId(req.params.userId); // Correct parameter name
        const doctor = await doctors().findOne({ user_id: userId }); // Query by user_id
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json(doctor);
    } catch (err) {
        console.error('GET doctor failed:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


// UPDATE doctor fields
exports.updateDoctorById = async (req, res) => {
    try {
        const userId = new ObjectId(req.params.userId);
        const updates = { ...req.body };

        delete updates._id;
        updates.user_id = userId; // Force ObjectId consistently

        if (updates.available_days && Array.isArray(updates.available_days)) {
            updates.available_days = updates.available_days.map(d => d.trim());
        }

        const result = await doctors().updateOne(
            { user_id: userId },
            { $set: updates },
            { upsert: true }
        );

        if (result.modifiedCount === 0 && !result.upsertedCount) {
            return res.status(400).json({ message: "Nothing was updated" });
        }

        const updated = await doctors().findOne({ user_id: userId });
        res.json(updated);
    } catch (err) {
        console.error("UPDATE doctor failed:", err);
        res.status(500).json({ message: "Server error" });
    }
};




// GET all appointments
exports.getAllAppointments = async (req, res) => {
    try {
        let { dateFilter } = req.query;
        let matchStage = {};

        if (dateFilter) {
            const today = new Date();
            let targetDate;

            if (dateFilter === "today") {
                targetDate = today.toISOString().split("T")[0];
            } else if (dateFilter === "tomorrow") {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                targetDate = tomorrow.toISOString().split("T")[0];
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
                // If format is YYYY-MM-DD
                targetDate = dateFilter;
            }

            if (targetDate) {
                matchStage.date = targetDate;
            }
        }

        const all = await appointments().aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctor_id",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "doctor.user_id",
                    foreignField: "_id",
                    as: "doctor_user"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "patient_id",
                    foreignField: "_id",
                    as: "patient"
                }
            },
            {
                $addFields: {
                    doctor: { $arrayElemAt: ["$doctor_user", 0] },
                    patient: { $arrayElemAt: ["$patient", 0] }
                }
            },
            {
                $project: {
                    date: 1,
                    time: 1,
                    status: 1,
                    appointment_type: 1,
                    createdAt: 1,
                    doctor: { _id: 1, first_name: 1, last_name: 1 },
                    patient: { _id: 1, first_name: 1, last_name: 1 }
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        res.json(all);
    } catch (err) {
        console.error("Error fetching appointments:", err);
        res.status(500).json({ message: "Failed to fetch appointments" });
    }
};


// PUT update appointment status
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const { status } = req.body;
        if (!["Scheduled", "Completed", "Cancelled"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        await appointments().updateOne({ _id: id }, { $set: { status } });
        res.json({ message: "Appointment status updated" });
    } catch (err) {
        console.error("Error updating appointment:", err);
        res.status(500).json({ message: "Update failed" });
    }
};

// DELETE appointment
exports.deleteAppointment = async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        await appointments().deleteOne({ _id: id });
        res.json({ message: "Appointment deleted" });
    } catch (err) {
        console.error("Error deleting appointment:", err);
        res.status(500).json({ message: "Delete failed" });
    }
};


// POST create appointment
exports.createAppointment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { doctor_id, patient_id, date, time, type } = req.body;
        const docId = new ObjectId(doctor_id);
        const patId = new ObjectId(patient_id);

        if (time < "08:00" || time > "11:30")
            return res.status(400).json({ message: "Outside working hours" });

        const clash = await collection("appointments").findOne({
            doctor_id: docId,
            date,
            time,
        });
        if (clash)
            return res.status(409).json({ message: "Slot already booked" });

        const apptDoc = {
            doctor_id: docId,
            patient_id: patId,
            status: "Scheduled",
            date,
            time,
            appointment_type: type,
            createdAt: new Date(),
        };

        const { insertedId } = await collection("appointments").insertOne(apptDoc);

        // Notify the patient
        const content = `Your appointment is scheduled on ${date} at ${time}.`;
        await sendNotificationToUser(patId, content);

        res.status(201).json({ message: "Appointment created", appointmentId: insertedId });
    } catch (err) {
        console.error("Admin create appointment failed:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
