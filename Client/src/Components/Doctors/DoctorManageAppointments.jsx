import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/manageAppointments.module.css";
import {
    Clock,
    Calendar,
    Info as InfoIcon,
    FileText,
    Edit2,
} from "react-feather";

export default function DoctorManageAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPast, setShowPast] = useState(false);
    const [detailsAppt, setDetailsAppt] = useState(null);
    const [searchName, setSearchName] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [reschedAppt, setReschedAppt] = useState(null);

    /** ------------------------------------------------------------------
     *  Fetch list whenever “today / past” toggle or date filter changes
     *  ------------------------------------------------------------------ */
    useEffect(() => {
        fetchDoctorAppointments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPast, selectedDate]);

    const fetchDoctorAppointments = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/appointments/doctor", {
                params: { past: showPast, date: selectedDate || undefined },
            });
            setAppointments(data);
        } catch (err) {
            console.error("Failed to load doctor appointments", err);
        } finally {
            setLoading(false);
        }
    };

    /** ------------------------------------------------------------------
     *  Doctor marks an appointment Completed / Canceled
     *  ------------------------------------------------------------------ */
    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.patch(`/api/appointments/${id}/status`, { status });
            fetchDoctorAppointments();
        } catch (err) {
            alert("Failed to update appointment status");
            console.error(err);
        }
    };

    /** ------------------------------------------------------------------
     *  Client-side filtering by patient name + date picker
     *  ------------------------------------------------------------------ */
    const filtered = appointments.filter((a) => {
        const nameMatch = a.patient_name
            ?.toLowerCase()
            .includes(searchName.toLowerCase());
        const dateMatch = selectedDate ? a.date === selectedDate : true;
        return nameMatch && dateMatch;
    });

    return (
        <DashboardLayout>
            <div className={styles.wrapper}>
                <h2 className={styles.heading}>Doctor Appointments</h2>

                {/* ─── control bar ───────────────────────────────────────────── */}
                <div className={styles.controls}>
                    <input
                        type="text"
                        placeholder="Search patient name…"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className={styles.searchInput}
                    />

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={styles.searchInput}
                    />

                    <button
                        onClick={() => setShowPast(!showPast)}
                        className={styles.addBtn}
                    >
                        {showPast ? "Show Today’s Appointments" : "Show Past Appointments"}
                    </button>
                </div>

                {/* ─── list / loader ─────────────────────────────────────────── */}
                {loading ? (
                    <p>Loading…</p>
                ) : (
                    <Section
                        title={showPast ? "Past Appointments" : "Today’s Appointments"}
                    >
                        {filtered.length === 0 && <p>No appointments found.</p>}

                        {filtered.map((appt) => (
                            <Card
                                key={appt._id}
                                data={appt}
                                setDetailsAppt={setDetailsAppt}
                                setReschedAppt={setReschedAppt}
                            >
                                <div className={styles.actions}>
                                    {["Completed", "Canceled"].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleStatusUpdate(appt._id, s)}
                                            className={styles.statusBtn}
                                            disabled={appt.status === s}
                                        >
                                            {s}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setReschedAppt(appt)}
                                        className={styles.statusBtn}
                                    >
                                        <Edit2 size={14} /> Reschedule
                                    </button>

                                    {appt.medical_report_url && (
                                        <a
                                            href={appt.medical_report_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={styles.reportLink}
                                        >
                                            <FileText size={14} /> Report
                                        </a>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </Section>
                )}
            </div>

            {/* details pop-up */}
            {detailsAppt && (
                <Overlay onClose={() => setDetailsAppt(null)}>
                    <div className={styles.modal}>
                        <h3>Appointment Details</h3>
                        <p>
                            <strong>Patient:</strong> {detailsAppt.patient_name}
                        </p>
                        <p>
                            <strong>Date:</strong> {detailsAppt.date}
                        </p>
                        <p>
                            <strong>Time:</strong> {detailsAppt.time}
                        </p>
                        <p>
                            <strong>Type:</strong> {detailsAppt.appointment_type}
                        </p>
                        <p>
                            <strong>Status:</strong> {detailsAppt.status}
                        </p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setDetailsAppt(null)}>Close</button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* reschedule pop-up */}
            {reschedAppt && (
                <RescheduleModal
                    appt={reschedAppt}
                    close={() => setReschedAppt(null)}
                    onSave={() => {
                        setReschedAppt(null);
                        fetchDoctorAppointments();
                    }}
                />
            )}
        </DashboardLayout>
    );
}

/* ───────────────────────────────────────── helpers ────────────────── */
function Section({ title, children }) {
    return (
        <section className={styles.section}>
            <h3>{title}</h3>
            {children}
        </section>
    );
}

function Card({ data, children, setDetailsAppt, setReschedAppt }) {
    const typeClass =
        data.appointment_type === "Virtual"
            ? styles.liveTag
            : styles.physicalTag;

    return (
        <div className={styles.card}>
            <div className={styles.info}>
                <h4>{data.patient_name}</h4>
                <div className={styles.meta}>
                    <span>
                        <Clock size={14} /> {data.time}
                    </span>
                    <span>
                        <Calendar size={14} /> {data.date}
                    </span>
                    <span className={typeClass}>{data.appointment_type}</span>
                </div>
            </div>

            <div className={styles.action}>
                <span className={styles.status}>
                    {data.status}
                    <InfoIcon
                        size={16}
                        className={styles.infoIcon}
                        onClick={() => setDetailsAppt(data)}
                    />
                </span>
                {children}
            </div>
        </div>
    );
}

function Overlay({ children, onClose }) {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </div>
    );
}

/* ─────────────────────────── reschedule modal ────────────────────── */
function RescheduleModal({ appt, close, onSave }) {
    const [date, setDate] = useState("");
    const [slots, setSlots] = useState([]);
    const [time, setTime] = useState("");

    /* fetch free slots whenever the user picks a date */
    useEffect(() => {
        if (!date) {
            setSlots([]);
            setTime("");
            return;
        }

        (async () => {
            try {
                const { data: free } = await axios.get(
                    "/api/appointments/available",
                    { params: { doctor_id: appt.doctor_id, date } }
                );
                setSlots(free);
                setTime("");
            } catch (err) {
                console.error("Failed to load free slots", err);
            }
        })();
    }, [date, appt.doctor_id]);

    /* submit new date/time */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!date || !time) return alert("Pick date & time");

        try {
            await axios.put(`/api/appointments/${appt._id}`, { date, time });
            onSave();
        } catch (err) {
            alert(err.response?.data?.message || "Reschedule failed");
            console.error(err);
        }
    };

    return (
        <Overlay onClose={close}>
            <form className={styles.modal} onSubmit={handleSubmit}>
                <h3>Reschedule</h3>

                <label className={styles.label}>New date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={styles.searchInput}
                    required
                />

                {slots.length > 0 && (
                    <>
                        <label className={styles.label}>Available times</label>
                        <select
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className={styles.searchInput}
                            required
                        >
                            <option value="">-- select time --</option>
                            {slots.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </>
                )}

                <div className={styles.modalActions}>
                    <button
                        type="button"
                        onClick={close}
                        className={styles.statusBtn}
                    >
                        Cancel
                    </button>
                    <button type="submit" className={styles.addBtn}>
                        Save
                    </button>
                </div>
            </form>
        </Overlay>
    );
}
