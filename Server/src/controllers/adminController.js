const { collection } = require('../config/db');
const { ObjectId } = require('mongodb');
const users = () => collection('users');
const appointments = () => collection('appointments');
const clinicCapacities = () => collection('clinic_capacities');
const doctors = () => collection('doctors'); // Add missing definition
const patients = () => collection('patients'); // Add missing definition
const { validationResult } = require('express-validator');
const { sendNotificationToUser } = require('./notificationController');
// const { doctor_user_id, date, time_slot, max_slots } = req.body;







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

        const virtualAppointments = allAppointments.filter(a => a.appointment_type?.toLowerCase() === "virtual").length;
        const physicalAppointments = allAppointments.filter(a => a.appointment_type?.toLowerCase() === "in-person").length;


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

// GET /api/doctors
exports.getAllDoctors = async (req, res) => {
    try {
        const selectedDate = req.query.date || new Date().toISOString().split("T")[0];

        const result = await users().aggregate([
            { $match: { role: "Doctor" } },
            {
                $lookup: {
                    from: "doctors",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "doctorData"
                }
            },
            {
                $unwind: {
                    path: "$doctorData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "clinic_capacities",
                    let: { doctorId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$doctor_user_id", "$$doctorId"] },
                                        { $eq: ["$date", selectedDate] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "capacityData"
                }
            },
            {
                $unwind: {
                    path: "$capacityData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    first_name: 1,
                    last_name: 1,
                    doctorData: {
                        available_days: 1,
                        available_start_time: 1,
                        available_end_time: 1
                    },
                    max_physical_appointments: "$capacityData.max_physical_appointments",
                    max_virtual_appointments: "$capacityData.max_virtual_appointments"
                }
            }
        ]).toArray();

        res.json(result);
    } catch (err) {
        console.error("Failed to fetch doctors with capacities", err);
        res.status(500).json({ message: "Failed to load doctors" });
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
        updates.user_id = userId;

        if (updates.available_days?.length) {
            updates.available_days = updates.available_days.map(d => d.trim());
        }

        // New support
        if (updates.max_virtual_appointments) {
            updates.max_virtual_appointments = parseInt(updates.max_virtual_appointments);
        }
        if (updates.max_physical_appointments) {
            updates.max_physical_appointments = parseInt(updates.max_physical_appointments);
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


exports.getWorkingHours = async (req, res) => {
    try {
        // Assuming all doctors share the same start/end — get one as reference
        const sampleDoctor = await collection("doctors").findOne({
            available_start_time: { $exists: true },
            available_end_time: { $exists: true }
        });

        if (!sampleDoctor) {
            return res.status(404).json({ message: "No working hours found" });
        }

        res.json({
            start: sampleDoctor.available_start_time,
            end: sampleDoctor.available_end_time
        });
    } catch (err) {
        console.error("Failed to fetch working hours:", err);
        res.status(500).json({ message: "Server error" });
    }
};


// PUT: /api/admin/working-hours
// PUT: /api/admin/working-hours
// PUT: /api/admin/working-hours
// PUT: /api/admin/working-hours


// controllers/adminController.js (UPDATED with separated routes)

// ✅ UPDATE Working Hours ONLY
exports.updateWorkingHours = async (req, res) => {
    const { start, end, available_days } = req.body;

    if (!start || !end) {
        return res.status(400).json({ message: "Start and end times required" });
    }

    try {
        const update = {
            available_start_time: start,
            available_end_time: end,
        };

        if (Array.isArray(available_days)) {
            update.available_days = available_days.map(d => d.trim());
        }

        const result = await doctors().updateMany({}, { $set: update });

        res.json({ message: "Updated working hours", updated: result.modifiedCount });
    } catch (err) {
        console.error("Update working hours failed:", err);
        res.status(500).json({ message: "Failed to update working hours" });
    }
};


exports.updateBulkWorkingHours = async (req, res) => {
    const { doctorIds, start, end, available_days } = req.body;

    if (!doctorIds || !start || !end || !available_days) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const objectIds = doctorIds.map(id => new ObjectId(id)); // convert strings to ObjectId

        const result = await doctors().updateMany(
            { user_id: { $in: objectIds } },
            {
                $set: {
                    available_start_time: start,
                    available_end_time: end,
                    available_days: available_days.map(d => d.trim())
                }
            }
        );

        res.status(200).json({ message: "Working hours updated", updated: result.modifiedCount });
    } catch (error) {
        console.error("Bulk update error:", error);
        res.status(500).json({ message: "Failed to update working hours" });
    }
};



// ✅ UPDATE Global Clinic Capacity (applies for today only)
exports.updateGlobalClinicCapacity = async (req, res) => {
    const { max_physical, max_virtual } = req.body;

    if (max_physical == null || max_virtual == null) {
        return res.status(400).json({ message: "Max values are required" });
    }

    try {
        const doctorsList = await users().find({ role: "Doctor" }).toArray();
        const today = new Date().toISOString().split("T")[0];

        for (const doc of doctorsList) {
            await clinicCapacities().updateOne(
                { doctor_user_id: doc._id, date: today },
                {
                    $set: {
                        max_physical_appointments: parseInt(max_physical),
                        max_virtual_appointments: parseInt(max_virtual),
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
        }

        res.json({ message: "Updated global clinic capacity for today" });
    } catch (err) {
        console.error("Failed to update global capacity:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ SET/CREATE Clinic Capacity for a specific doctor & date
exports.setClinicCapacity = async (req, res) => {
    try {
        const { doctor_user_id, date, max_virtual_appointments, max_physical_appointments } = req.body;

        if (!doctor_user_id || !date || max_virtual_appointments == null || max_physical_appointments == null) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const doctorId = new ObjectId(doctor_user_id);
        const existing = await clinicCapacities().findOne({ doctor_user_id: doctorId, date });

        if (existing) {
            await clinicCapacities().updateOne(
                { _id: existing._id },
                {
                    $set: {
                        max_virtual_appointments: parseInt(max_virtual_appointments),
                        max_physical_appointments: parseInt(max_physical_appointments),
                        updatedAt: new Date()
                    }
                }
            );
            return res.json({ message: "Updated clinic capacity" });
        }

        const entry = {
            doctor_user_id: doctorId,
            date,
            max_virtual_appointments: parseInt(max_virtual_appointments),
            max_physical_appointments: parseInt(max_physical_appointments),
            createdAt: new Date()
        };

        const { insertedId } = await clinicCapacities().insertOne(entry);
        res.status(201).json({ message: "Created clinic capacity", _id: insertedId });
    } catch (err) {
        console.error("Set clinic capacity failed:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ GET Clinic Capacities
exports.getClinicCapacities = async (req, res) => {
    try {
        const data = await clinicCapacities().aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "doctor_user_id",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            { $addFields: { doctor: { $arrayElemAt: ["$doctor", 0] } } },
            {
                $project: {
                    doctor: { first_name: 1, last_name: 1, email: 1 },
                    date: 1,
                    max_virtual_appointments: 1,
                    max_physical_appointments: 1
                }
            },
            { $sort: { date: 1 } }
        ]).toArray();

        res.json(data);
    } catch (err) {
        console.error("Get clinic capacities failed:", err);
        res.status(500).json({ message: "Server error" });
    }
};


exports.getOnSitePatients = async (req, res) => {
    try {
        // You may use a flag like status: "On-Site"
        const todaysDate = new Date().toISOString().split("T")[0];
        const pipeline = [
            {
                $match: {
                    status: "On-Site",
                    date: todaysDate
                }
            },
            {
                $lookup: {
                    from: "patients",
                    localField: "patient_id",
                    foreignField: "_id",
                    as: "patientInfo"
                }
            },
            { $unwind: "$patientInfo" },
            {
                $lookup: {
                    from: "users",
                    localField: "patientInfo.user_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            { $unwind: "$userInfo" },
            {
                $project: {
                    _id: "$userInfo._id",
                    first_name: "$userInfo.first_name",
                    last_name: "$userInfo.last_name",
                    email: "$userInfo.email"
                }
            }
        ];

        const result = await appointments().aggregate(pipeline).toArray();
        res.json(result);
    } catch (err) {
        console.error("Error fetching on-site patients:", err);
        res.status(500).json({ message: "Failed to fetch on-site patients" });
    }
};

exports.getCalendarAppointments = async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required" });
    }

    try {
        const results = await appointments()
            .find({
                date: { $regex: `^${year}-${String(month).padStart(2, '0')}-` }
            })
            .project({
                _id: 0,
                date: 1,
                appointment_type: 1
            })
            .toArray();

        // Normalize types for frontend matching
        const normalized = results.map(a => ({
            ...a,
            appointment_type: a.appointment_type?.toLowerCase() === 'in-person'
                ? 'Physical'
                : a.appointment_type?.toLowerCase() === 'virtual'
                    ? 'Virtual'
                    : a.appointment_type
        }));

        res.json(normalized);
    } catch (err) {
        console.error("Failed to load calendar data:", err);
        res.status(500).json({ message: "Failed to fetch appointment calendar data" });
    }
};
