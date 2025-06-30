// src/Components/MyAppointments.jsx
import React, { useState, useEffect } from "react";
import {
    Clock,
    Calendar,
    MessageCircle,
    Star,
    Info as InfoIcon,
    X as CloseIcon
} from "react-feather";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/myAppointments.module.css";

export default function MyAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // overlay state
    const [cancelAppt, setCancelAppt] = useState(null);
    const [reschedAppt, setReschedAppt] = useState(null);

    // details & feedback overlays
    const [detailsAppt, setDetailsAppt] = useState(null);
    const [feedbackAppt, setFeedbackAppt] = useState(null);

    // feedback form state
    const [feedback, setFeedback] = useState({ rating: 0, note: "" });
    const [feedbackLoading, setFeedbackLoading] = useState(false);

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
            .then((res) => setAppointments(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }

    // cancel
    const confirmCancel = (appt) => setCancelAppt(appt);
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
    const startReschedule = (appt) => {
        setReschedAppt(appt);
        setNewDate("");
        setFreeSlots([]);
        setNewTime("");
    };
    const loadSlots = (date) => {
        setSlotsLoading(true);
        axios
            .get("/api/appointments/available", {
                params: { doctor_id: reschedAppt.doctor._id, date }
            })
            .then((res) => setFreeSlots(res.data))
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

    // submit feedback
    const submitFeedback = async () => {
        setFeedbackLoading(true);
        try {
            await axios.post(`/api/appointments/${feedbackAppt._id}/feedback`, {
                rating: feedback.rating,
                note: feedback.note
            });

            alert("Feedback submitted successfully!");
            // clear & close
            setFeedbackAppt(null);
            setFeedback({ rating: 0, note: "" });
        } catch (err) {
            console.error(err);
            alert("Failed to submit feedback.");
        } finally {
            setFeedbackLoading(false);
        }
    };

    // split upcoming vs previous
    const upcoming = appointments.filter((a) => a.status === "Scheduled");
    const previous = appointments.filter((a) => a.status !== "Scheduled");

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
                            {upcoming.map((appt) => (
                                <Card
                                    key={appt._id}
                                    data={appt}
                                    setDetailsAppt={setDetailsAppt} // Pass as prop
                                >
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
                            {previous.map((appt) => (
                                <Card
                                    key={appt._id}
                                    data={appt}
                                    setDetailsAppt={setDetailsAppt} // Pass as prop
                                >
                                    {appt.status === "Completed" && (
                                        <button
                                            className={styles.link}
                                            onClick={() => setFeedbackAppt(appt)}
                                        >
                                            <MessageCircle size={14} /> Give Feedback
                                        </button>
                                    )}
                                </Card>
                            ))}
                        </Section>
                    </>
                )}
            </div>

            {/* Cancel confirmation overlay */}
            {cancelAppt && (
                <Overlay onClose={() => setCancelAppt(null)}>
                    <div className={styles.modal}>
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
                </Overlay>
            )}

            {/* Details overlay */}
            {detailsAppt && (
                <Overlay onClose={() => setDetailsAppt(null)}>
                    <div className={styles.modal}>
                        <button
                            className={styles.closeBtn}
                            onClick={() => setDetailsAppt(null)}
                        >
                            <CloseIcon size={18} />
                        </button>
                        <h3>Appointment Details</h3>
                        <p>
                            <strong>Doctor:</strong> Dr. {detailsAppt.doctor.first_name}{" "}
                            {detailsAppt.doctor.last_name}
                        </p>
                        <p>
                            <strong>Specialization:</strong>{" "}
                            {detailsAppt.doctor.specialization}
                        </p>
                        <p>
                            <strong>Bio:</strong> {detailsAppt.doctor.bio}
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
                        <div className={styles.modalActions}>
                            <button onClick={() => setDetailsAppt(null)}>Close</button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* Reschedule overlay */}
            {reschedAppt && (
                <Overlay onClose={() => setReschedAppt(null)}>
                    <div className={styles.modal}>
                        <button
                            className={styles.closeBtn}
                            onClick={() => setReschedAppt(null)}
                        >
                            <CloseIcon size={18} />
                        </button>

                        <h3>Reschedule Appointment</h3>
                        <p>
                            Dr. {reschedAppt.doctor.first_name}{" "}
                            {reschedAppt.doctor.last_name}
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
                                            slot === newTime
                                                ? styles.selectedSlot
                                                : styles.slot
                                        }
                                        onClick={() => setNewTime(slot)}
                                    >
                                        {slot}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button onClick={() => setReschedAppt(null)}>
                                Cancel
                            </button>
                            <button
                                onClick={doReschedule}
                                disabled={!newDate || !newTime}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}


            {/* Feedback overlay */}
            {feedbackAppt && (
                <Overlay onClose={() => setFeedbackAppt(null)}>
                    <div className={styles.modal}>
                        <h3>Give Feedback</h3>

                        <div className={styles.feedbackSection}>
                            <label><strong>Rate your experience:</strong></label>
                            <div className={styles.stars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={24}
                                        className={
                                            feedback.rating >= star
                                                ? styles.starSelected
                                                : styles.star
                                        }
                                        onClick={() =>
                                            setFeedback((f) => ({ ...f, rating: star }))
                                        }
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={styles.feedbackSection}>
                            <label><strong>Leave a note:</strong></label>
                            <textarea
                                rows="4"
                                className={styles.textarea}
                                placeholder="Write your feedback here..."
                                value={feedback.note}
                                onChange={(e) =>
                                    setFeedback((f) => ({ ...f, note: e.target.value }))
                                }
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setFeedbackAppt(null)}
                                disabled={feedbackLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitFeedback}
                                disabled={
                                    feedbackLoading ||
                                    feedback.rating === 0 ||
                                    feedback.note.trim() === ""
                                }
                            >
                                {feedbackLoading ? "Submitting..." : "Submit Feedback"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}
        </DashboardLayout>
    );
}

// ---- helper components ----
function Section({ title, children }) {
    return (
        <section className={styles.section}>
            <h3>{title}</h3>
            {children}
        </section>
    );
}

function Card({ data, children, setDetailsAppt }) {
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
                <span className={styles.status}>
                    {data.status}
                    <InfoIcon
                        size={16}
                        className={styles.infoIcon}
                        onClick={() => setDetailsAppt(data)} // Use the passed prop
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
