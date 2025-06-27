const { collection } = require('../config/db');
const { ObjectId } = require('mongodb');
const users = () => collection('users');
const appointments = () => collection('appointments');
const doctors = () => collection('doctors'); // Add missing definition
const patients = () => collection('patients'); // Add missing definition

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


