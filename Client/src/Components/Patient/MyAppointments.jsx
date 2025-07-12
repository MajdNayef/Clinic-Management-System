// src/Components/MyAppointments.jsx
import React, { useState, useEffect } from "react";
import {
    Clock,
    Calendar,
    MessageCircle,
    Star,
    Info as InfoIcon,
    X as CloseIcon,
    FileText
} from "react-feather";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/myAppointments.module.css";
import { useTranslation } from 'react-i18next';

export default function MyAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

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


    // open SINGLE medical‐record PDF for this appointment
    const openMedicalRecord = async (appt) => {
        try {
            // 1) fetch all raw reports for this patient
            const { data: reports } = await axios.get(
                `/api/medical-reports/reports/patient/${appt.patient_id}`
            );

            // 2) find the one matching this appointment
            const report = reports.find(r => r.appointment_id === appt._id);
            if (!report) {
                return alert("No medical record found for this appointment");
            }

            // 3) stream back single-report PDF
            const { data: pdfBlob } = await axios.get(
                `/api/medical-reports/reports/patient/${report._id}/pdf`,
                { responseType: "blob" }
            );
            const url = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 60_000);

        } catch (err) {
            console.error(err);
            alert("Could not open medical record");
        }
    };
    // split upcoming vs previous
    const upcoming = appointments.filter((a) => a.status === "Scheduled");
    const previous = appointments.filter((a) => a.status !== "Scheduled");

    return (
        <DashboardLayout>
            <div className={styles.wrapper}>
                <h2 className={styles.heading}>{t('dashboard.myAppointments')}</h2>
                <hr />

                {loading ? (
                    <p>Loading…</p>
                ) : (
                    <>
                        <Section title={t('dashboard.upcomingAppointments')}>
                            {upcoming.length === 0 && <p>{t('dashboard.noUpcomingAppointments')}</p>}
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
                                            {t('appointments.reschedule')}
                                        </button>
                                        <button
                                            className={styles.link}
                                            onClick={() => confirmCancel(appt)}
                                        >
                                            {t('common.cancel')}
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
                                        <>
                                            <button
                                                className={styles.link}
                                                onClick={() => setFeedbackAppt(appt)}
                                            >
                                                <MessageCircle size={14} /> Give Feedback
                                            </button>

                                            <button
                                                className={styles.link}
                                                onClick={() => openMedicalRecord(appt)}
                                            >
                                                <FileText size={14} /> Open Medical Record
                                            </button>
                                        </>
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
                        <h3>{t('appointments.cancelTitle')}</h3>
                        <p>
                            {t('appointments.cancelConfirm', {
                                doctor: `${cancelAppt.doctor.first_name} ${cancelAppt.doctor.last_name}`,
                                date: cancelAppt.date,
                                time: cancelAppt.time
                            })}
                        </p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setCancelAppt(null)}>{t('common.no')}</button>
                            <button onClick={doCancel}>{t('appointments.yesCancel')}</button>
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
                        <h3>{t('appointments.details')}</h3>
                        <p>
                            <strong>{t('appointments.doctor')}:</strong> Dr. {detailsAppt.doctor.first_name}{" "}
                            {detailsAppt.doctor.last_name}
                        </p>
                        <p>
                            <strong>{t('appointments.specialization')}:</strong>{" "}
                            {detailsAppt.doctor.specialization}
                        </p>
                        <p>
                            <strong>{t('appointments.bio')}:</strong> {detailsAppt.doctor.bio}
                        </p>
                        <p>
                            <strong>{t('appointments.date')}:</strong> {detailsAppt.date}
                        </p>
                        <p>
                            <strong>{t('appointments.time')}:</strong> {detailsAppt.time}
                        </p>
                        <p>
                            <strong>{t('appointments.type')}:</strong> {detailsAppt.appointment_type}
                        </p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setDetailsAppt(null)}>{t('common.close')}</button>
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

                        <h3>{t('appointments.rescheduleTitle')}</h3>
                        <p>
                            Dr. {reschedAppt.doctor.first_name}{" "}
                            {reschedAppt.doctor.last_name}
                        </p>

                        <label>
                            {t('appointments.newDate')}:
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
                            <button onClick={() => setReschedAppt(null)}>{t('common.cancel')}</button>
                            <button
                                onClick={doReschedule}
                                disabled={!newDate || !newTime}
                            >
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}


            {/* Feedback overlay */}
            {feedbackAppt && (
                <Overlay onClose={() => setFeedbackAppt(null)}>
                    <div className={styles.modal}>
                        <h3>{t('appointments.giveFeedback')}</h3>

                        <div className={styles.feedbackSection}>
                            <label><strong>{t('appointments.rateExperience')}:</strong></label>
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
                            <label><strong>{t('appointments.leaveNote')}:</strong></label>
                            <textarea
                                rows="4"
                                className={styles.textarea}
                                placeholder={t('appointments.feedbackPlaceholder')}
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
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={submitFeedback}
                                disabled={
                                    feedbackLoading ||
                                    feedback.rating === 0 ||
                                    feedback.note.trim() === ""
                                }
                            >
                                {feedbackLoading ? t('appointments.submitting') : t('appointments.submitFeedback')}
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
