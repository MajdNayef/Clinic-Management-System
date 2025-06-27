import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/manageappointments.module.css";

export default function ManageAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState("all"); // all | today | tomorrow | custom
    const [customDate, setCustomDate] = useState("");

    useEffect(() => {
        fetchAppointments();
    }, [timeFilter, customDate]);

    async function fetchAppointments() {
        setLoading(true);
        try {
            let query = "";

            if (timeFilter === "today" || timeFilter === "tomorrow") {
                query = `?dateFilter=${timeFilter}`;
            } else if (timeFilter === "custom" && customDate) {
                query = `?dateFilter=${customDate}`;
            }

            const { data } = await axios.get(`/api/admin/appointments${query}`);
            setAppointments(data);
        } catch (err) {
            alert("Failed to fetch appointments");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = appointments.filter((a) => {
        const q = search.toLowerCase();
        const doctorName = `${a?.doctor?.first_name || ""} ${a?.doctor?.last_name || ""}`.toLowerCase();
        const patientName = `${a?.patient?.first_name || ""} ${a?.patient?.last_name || ""}`.toLowerCase();
        const matchesSearch = doctorName.includes(q) || patientName.includes(q);
        const matchesType = typeFilter === "All" || a.appointment_type === typeFilter;
        return matchesSearch && matchesType;
    });

    const handleStatusChange = async (id, newStatus, userId) => {
        try {
            // Update appointment status
            await axios.put(`/api/admin/appointments/${id}`, { status: newStatus });

            // Send notification to the user
            const notificationContent = `Your appointment status has been updated to "${newStatus}".`;
            await axios.post(`/api/notifications`, {
                userId,
                content: notificationContent,
            });

            // Refresh appointments
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

    return (
        <DashboardLayout>
            <h2 className={styles.sectionTitle}>Manage Appointments</h2>
            <hr />
            <div className={styles.container}>
                <div className={styles.controls}>
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
                                    setCustomDate(""); // reset custom date if any
                                }}
                                className={
                                    timeFilter === t
                                        ? styles.activeTimeTab
                                        : styles.timeTab
                                }
                            >
                                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <p>Loading appointments…</p>
                ) : (
                    <div className={styles.cardGrid}>
                        {filtered.map((a) => (
                            <div key={a._id} className={styles.card}>
                                <div className={styles.info}>
                                    <p><strong>Date:</strong> {a.date}</p>
                                    <p><strong>Time:</strong> {a.time}</p>
                                    <p><strong>Type:</strong> {a.appointment_type}</p>
                                    <p><strong>Doctor:</strong> {a?.doctor?.first_name} {a?.doctor?.last_name}</p>
                                    <p><strong>Patient:</strong> {a?.patient?.first_name} {a?.patient?.last_name}</p>
                                    <p><strong>Created:</strong> {new Date(a.createdAt).toLocaleString()}</p>
                                    <hr />
                                    <p><strong>Status:</strong><span className={a.status}> {a.status}</span></p>
                                </div>
                                <div className={styles.actions}>
                                    {["Scheduled", "Completed", "Cancelled"].map((s) => (
                                        <button
                                            key={s}
                                            className={styles.statusBtn}
                                            onClick={() => handleStatusChange(a._id, s, a?.patient?._id)} // Pass patient userId
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
        </DashboardLayout>
    );
}
