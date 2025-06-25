const { collection } = require('../config/db');

const users = () => collection('users');
const appointments = () => collection('appointments');

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
