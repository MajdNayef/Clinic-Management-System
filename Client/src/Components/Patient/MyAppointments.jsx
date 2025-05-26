// src/Components/MyAppointments.jsx
import React, { useState, useEffect } from "react";
import { Clock, Calendar, MessageCircle, Star } from "react-feather";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/myAppointments.module.css";

export default function MyAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // overlay state
    const [cancelAppt, setCancelAppt] = useState(null);
    const [reschedAppt, setReschedAppt] = useState(null);

    // reschedule form state
    const [newDate, setNewDate] = useState("");
    const [freeSlots, setFreeSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [newTime, setNewTime] = useState("");

    useEffect(() => {
        fetchAppointments();
    }, []);

    function fetchAppointments() {
        setLoading(true);
        axios
            .get("/api/appointments")
            .then(res => setAppointments(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }

    // cancel
    const confirmCancel = appt => setCancelAppt(appt);
    const doCancel = async () => {
        try {
            await axios.delete(`/api/appointments/${cancelAppt._id}`);
            fetchAppointments();
        } catch (err) {
            console.error(err);
            alert("Cancel failed");
        } finally {
            setCancelAppt(null);
        }
    };

    // reschedule
    const startReschedule = appt => {
        setReschedAppt(appt);
        setNewDate("");
        setFreeSlots([]);
        setNewTime("");
    };
    const loadSlots = date => {
        setSlotsLoading(true);
        axios
            .get("/api/appointments/available", {
                params: {
                    doctor_id: reschedAppt.doctor._id,
                    date
                }
            })
            .then(res => setFreeSlots(res.data))
            .catch(console.error)
            .finally(() => setSlotsLoading(false));
    };
    const doReschedule = async () => {
        try {
            await axios.put(`/api/appointments/${reschedAppt._id}`, {
                date: newDate,
                time: newTime
            });
            fetchAppointments();
            setReschedAppt(null);
        } catch (err) {
            console.error(err);
            alert("Reschedule failed");
        }
    };

    // split upcoming vs previous
    const upcoming = appointments.filter(a => a.status === "Scheduled");
    const previous = appointments.filter(a => a.status !== "Scheduled");

    return (
        <DashboardLayout>
            <div className={styles.wrapper}>
                <h2 className={styles.heading}>My Appointments</h2>
                <hr />

                {loading ? (
                    <p>Loading…</p>
                ) : (
                    <>
                        <Section title="Upcoming Appointments">
                            {upcoming.length === 0 && <p>No upcoming appointments</p>}
                            {upcoming.map(appt => (
                                <Card key={appt._id} data={appt}>
                                    <div className={styles.actions}>
                                        <button
                                            className={styles.link}
                                            onClick={() => startReschedule(appt)}
                                        >
                                            Reschedule
                                        </button>
                                        <button
                                            className={styles.link}
                                            onClick={() => confirmCancel(appt)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </Section>

                        <Section title="Previous Appointments">
                            {previous.length === 0 && <p>No previous appointments</p>}
                            {previous.map(appt => (
                                <Card key={appt._id} data={appt} />
                            ))}
                        </Section>
                    </>
                )}
            </div>

            {/* Cancel confirmation overlay */}
            {cancelAppt && (
                <div className={styles.overlay} onClick={() => setCancelAppt(null)}>
                    <div
                        className={styles.modal}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3>Cancel Appointment</h3>
                        <p>
                            Are you sure you want to cancel your appointment with{" "}
                            <strong>
                                Dr. {cancelAppt.doctor.first_name} {cancelAppt.doctor.last_name}
                            </strong>{" "}
                            on {cancelAppt.date} at {cancelAppt.time}?
                        </p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setCancelAppt(null)}>No</button>
                            <button onClick={doCancel}>Yes, cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule overlay */}
            {reschedAppt && (
                <div className={styles.overlay} onClick={() => setReschedAppt(null)}>
                    <div
                        className={styles.modal}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3>Reschedule Appointment</h3>
                        <p>
                            Dr. {reschedAppt.doctor.first_name} {reschedAppt.doctor.last_name}
                        </p>

                        <label>
                            New Date:
                            <input
                                type="date"
                                value={newDate}
                                onChange={e => {
                                    setNewDate(e.target.value);
                                    loadSlots(e.target.value);
                                }}
                            />
                        </label>

                        <div>
                            {slotsLoading ? (
                                <p>Loading slots…</p>
                            ) : (
                                freeSlots.map(slot => (
                                    <button
                                        key={slot}
                                        className={
                                            slot === newTime ? styles.selectedSlot : styles.slot
                                        }
                                        onClick={() => setNewTime(slot)}
                                    >
                                        {slot}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button onClick={() => setReschedAppt(null)}>Cancel</button>
                            <button
                                onClick={doReschedule}
                                disabled={!newDate || !newTime}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function Section({ title, children }) {
    return (
        <section className={styles.section}>
            <h3>{title}</h3>
            {children}
        </section>
    );
}

function Card({ data, children }) {
    const typeClass =
        data.appointment_type === "Virtual"
            ? styles.liveTag
            : styles.physicalTag;

    return (
        <div className={styles.card}>
            <div className={styles.info}>
                <h4>
                    Dr. {data.doctor.first_name} {data.doctor.last_name}
                </h4>
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
                <span className={styles.status}>{data.status}</span>
                {/* child buttons */}
                {children}

                {/* previous-only feedback/chat */}
                {data.status === "Completed" && !children && (
                    <button className={styles.link}>
                        <MessageCircle size={14} /> Give Feedback
                    </button>
                )}
            </div>
        </div>
    );
}
