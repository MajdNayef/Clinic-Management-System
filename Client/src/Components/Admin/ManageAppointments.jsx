// pages/ManageAppointments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/manageappointments.module.css";
import Select from "react-select";

export default function ManageAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    /* filters & search */
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");       // All | Virtual | Physical
    const [timeFilter, setTimeFilter] = useState("all");       // all | today | tomorrow | custom
    const [customDate, setCustomDate] = useState("");

    /* modal state */
    const [showModal, setShowModal] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [slots, setSlots] = useState([]);

    const [form, setForm] = useState({
        doctor_id: "",
        patient_id: "",
        date: "",
        time: "",
        type: "In-Person"
    });

    /* ───────────────────────────────────────── fetch data ── */
    useEffect(() => {
        fetchAppointments();
    }, [timeFilter, customDate]);

    useEffect(() => {
        if (form.doctor_id && form.date) {
            axios
                .get("/api/appointments/available", {
                    params: { doctor_id: form.doctor_id, date: form.date }
                })
                .then((res) => setSlots(res.data))
                .catch(() => setSlots([]));
        }
    }, [form.doctor_id, form.date]);

    useEffect(() => {
        axios.get("/api/doctors").then((res) => setDoctors(res.data));
        axios.get("/api/admin/users?role=Patient").then((res) => setPatients(res.data));
    }, []);

    async function fetchAppointments() {
        setLoading(true);
        try {
            let query = "";
            if (timeFilter === "today" || timeFilter === "tomorrow")
                query = `?dateFilter=${timeFilter}`;
            else if (timeFilter === "custom" && customDate)
                query = `?dateFilter=${customDate}`;

            const { data } = await axios.get(`/api/admin/appointments${query}`);
            setAppointments(data);
        } catch (err) {
            alert("Failed to fetch appointments");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    /* ───────────────────────────────────────── filtering ── */
    const matchesType = (appt) => {
        if (typeFilter === "All") return true;
        if (typeFilter === "Physical") return appt.appointment_type === "In-Person";
        return appt.appointment_type === typeFilter; // Virtual
    };

    const filtered = appointments.filter((a) => {
        const q = search.toLowerCase();
        const doctorName = `${a?.doctor?.first_name || ""} ${a?.doctor?.last_name || ""}`.toLowerCase();
        const patientName = `${a?.patient?.first_name || ""} ${a?.patient?.last_name || ""}`.toLowerCase();

        return (doctorName.includes(q) || patientName.includes(q)) && matchesType(a);
    });

    /* ───────────────────────────────────── status handlers ─ */
    const handleStatusChange = async (id, newStatus, userId) => {
        try {
            await axios.put(`/api/admin/appointments/${id}`, { status: newStatus });
            const content = `Your appointment status has been updated to "${newStatus}".`;
            await axios.post("/api/notifications", { userId, content });
            fetchAppointments();
        } catch (err) {
            alert("Failed to update status or send notification");
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this appointment?")) return;
        try {
            await axios.delete(`/api/admin/appointments/${id}`);
            fetchAppointments();
        } catch (err) {
            alert("Failed to delete appointment");
            console.error(err);
        }
    };

    /* ───────────────────────────────────────── modal save ─ */
    const handleSubmit = async () => {
        try {
            await axios.post("/api/admin/appointments", form);
            alert("Appointment created");
            fetchAppointments();
            setShowModal(false);
        } catch (err) {
            console.error("Create failed", err);
            alert("Failed to create appointment");
        }
    };

    /* ─────────────────────────────────────────── render ─── */
    return (
        <DashboardLayout>
            <h2 className={styles.sectionTitle}>Manage Appointments</h2>
            <hr />

            {/* ------------- Controls ------------- */}
            <div className={styles.container}>
                <div className={styles.controls}>
                    {/* search + type tabs */}
                    <div style={{ flexGrow: 1 }}>
                        <input
                            type="text"
                            placeholder="Search by doctor or patient name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        <div className={styles.roleTabs}>
                            {["All", "Virtual", "Physical"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={typeFilter === type ? styles.activeTab : styles.tab}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* date filter + new appointment */}
                    <div className={styles.headerBar}>
                        <div className={styles.timeTabs}>
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => {
                                    setTimeFilter("custom");
                                    setCustomDate(e.target.value);
                                }}
                                className={styles.searchInput}
                            />
                            {["all", "today", "tomorrow"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        setTimeFilter(t);
                                        setCustomDate("");
                                    }}
                                    className={timeFilter === t ? styles.activeTimeTab : styles.timeTab}
                                >
                                    {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>

                        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                            + New Appointment
                        </button>
                    </div>
                </div>

                {/* ------------- Appointment cards ------------- */}
                {loading ? (
                    <p>Loading appointments…</p>
                ) : (
                    <div className={styles.cardGrid}>
                        {filtered.map((a) => (
                            <div key={a._id} className={styles.card}>
                                <div className={styles.info}>
                                    <p><strong>Appointment ID :</strong> {a._id}</p>
                                    <p><strong>Doctor:</strong> {a?.doctor?.first_name} {a?.doctor?.last_name}</p>
                                    <p><strong>Patient:</strong> {a?.patient?.first_name} {a?.patient?.last_name}</p>
                                    <p><strong>Date:</strong> {a.date}</p>
                                    <p><strong>Time:</strong> {a.time}</p>
                                    <p><strong>Type:</strong> {a.appointment_type}</p>
                                    <p><strong>Created:</strong> {new Date(a.createdAt).toLocaleString()}</p>
                                    <hr />
                                    <p><strong>Status:</strong>
                                        <span className={a.status}> {a.status}</span>
                                    </p>
                                </div>

                                <div className={styles.actions}>
                                    {["Scheduled", "Completed", "Cancelled"].map((s) => (
                                        <button
                                            key={s}
                                            className={styles.statusBtn}
                                            onClick={() => handleStatusChange(a._id, s, a?.patient?._id)}
                                            disabled={a.status === s}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                    <button onClick={() => handleDelete(a._id)} className={styles.deleteBtn}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ------------- Modal ------------- */}
            {showModal && (
                <div className={styles.overlay}>
                    <div className={styles.modalBox}>
                        <h3>Create Appointment</h3>

                        <label>Patient:</label>
                        <Select
                            options={patients.map((p) => ({
                                value: p._id,
                                label: `${p.first_name} ${p.last_name}`,
                            }))}
                            onChange={(opt) => setForm({ ...form, patient_id: opt?.value })}
                            className={styles.select}
                            placeholder="Select a patient..."
                            isSearchable
                        />

                        <label>Doctor:</label>
                        <Select
                            options={doctors.map((d) => ({
                                value: d._id,
                                label: `Dr. ${d.first_name} ${d.last_name}`,
                            }))}
                            onChange={(opt) => setForm({ ...form, doctor_id: opt?.value })}
                            className={styles.select}
                            placeholder="Select a doctor..."
                            isSearchable
                        />

                        <label>Type:</label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            <option>In-Person</option>
                            <option>Virtual</option>
                        </select>

                        <label>Date:</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />

                        <label>Time:</label>
                        <select
                            value={form.time}
                            onChange={(e) => setForm({ ...form, time: e.target.value })}
                        >
                            <option value="">-- Select Slot --</option>
                            {slots.map((t) => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>

                        <div className={styles.modalActions}>
                            <button
                                onClick={handleSubmit}
                                disabled={
                                    !form.patient_id || !form.doctor_id || !form.date || !form.time
                                }
                            >
                                Create
                            </button>
                            <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
