import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import { Clock, Calendar, Check, X as Cancel, Users } from "react-feather";
import styles from "./css/doctordashboard.module.css";

export default function DoctorDashboard() {
    const [allAppts, setAllAppts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState({ show: false, id: null, status: "" });

    useEffect(fetchData, []);

    function fetchData() {
        setLoading(true);
        axios
            .get("/api/appointments/doctor")
            .then((res) => setAllAppts(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }

    function handleActionClick(id, status) {
        setConfirmAction({ show: true, id, status });
    }

    async function confirmUpdateStatus() {
        try {
            await axios.patch(`/api/appointments/${confirmAction.id}/status`, { status: confirmAction.status });
            fetchData();
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Could not update status");
        } finally {
            setConfirmAction({ show: false, id: null, status: "" });
        }
    }

    function cancelUpdateStatus() {
        setConfirmAction({ show: false, id: null, status: "" });
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // only keep today’s appointments that are not completed or canceled
    const todayAppts = allAppts.filter(
        (a) => a.date === todayStr && a.status !== "Completed" && a.status !== "Canceled"
    );

    // sort by start time
    const sorted = todayAppts
        .map((a) => ({
            ...a,
            startDt: new Date(`${a.date}T${a.time.split(" - ")[0]}`),
        }))
        .sort((a, b) => a.startDt - b.startDt);

    const current = sorted[0] || null;
    const next = sorted.slice(1);

    return (
        <DashboardLayout>
            <div className={styles.doctorDashboardContainer}>
                <h2 className={styles.sectionTitle}>DMC Doctors Dashboard</h2>
                <hr className={styles.divider} />

                <section>
                    <h3 className={styles.sectionTitle}>Current Appointment</h3>
                    {loading ? (
                        <p>Loading…</p>
                    ) : current ? (
                        <div className={styles.currentAppointmentCard}>
                            {current.patient_avatar ? (
                                <img
                                    src={
                                        current.patient_avatar.startsWith("http")
                                            ? current.patient_avatar
                                            : `${axios.defaults.baseURL}${current.patient_avatar}`
                                    }
                                    alt={current.patient_name}
                                    className={styles.avatarImg}
                                />
                            ) : (
                                <div className={styles.avatarCircle}>
                                    {current.patient_name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </div>
                            )}

                            <div className={styles.currentDetails}>
                                <div className={styles.patientName}>
                                    {current.patient_name}
                                </div>
                                <div className={styles.metaRow}>
                                    <Clock size={14} /> {current.time}
                                </div>
                                <div className={styles.metaRow}>
                                    <Calendar size={14} /> {current.date}
                                </div>
                                <div>
                                    <span className={styles.tag}>
                                        <Users size={14} /> – {current.appointment_type}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.actionsRow}>
                                <button className={styles.actionBtn}>
                                    Patient Medical report
                                </button>
                                {current.appointment_type === "Virtual" && (
                                    <button className={styles.actionBtn}>
                                        Connect to live chat
                                    </button>
                                )}
                                <div className={styles.statusLegend}>
                                    <span
                                        onClick={() => handleActionClick(current._id, "Completed")}
                                        className={styles.actionClickable}
                                    >
                                        <Check size={14} /> Done
                                    </span>
                                    <span
                                        onClick={() => handleActionClick(current._id, "Canceled")}
                                        className={styles.actionClickable}
                                    >
                                        <Cancel size={14} /> Canceled
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>No current appointment</p>
                    )}
                </section>

                <section>
                    <h3 className={styles.sectionTitle}>Rest of Today’s Appointments</h3>
                    {loading ? (
                        <p>Loading…</p>
                    ) : next.length === 0 ? (
                        <p>No more appointments today</p>
                    ) : (
                        <div className={styles.nextAppointmentsGrid}>
                            {next.map((appt) => (
                                <div key={appt._id} className={styles.appointmentCard}>
                                    {appt.patient_avatar ? (
                                        <img
                                            src={
                                                appt.patient_avatar.startsWith("http")
                                                    ? appt.patient_avatar
                                                    : `${axios.defaults.baseURL}${appt.patient_avatar}`
                                            }
                                            alt={appt.patient_name}
                                            className={styles.avatarImg}
                                        />
                                    ) : (
                                        <div className={styles.avatarCircle}>
                                            {appt.patient_name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h4>{appt.patient_name}</h4>
                                        <div className={styles.metaRow}>
                                            <Clock size={14} /> {appt.time}
                                        </div>
                                        <div className={styles.metaRow}>
                                            <Calendar size={14} /> {appt.date}
                                        </div>
                                        <div>
                                            <span className={styles.tag}>
                                                <Users size={14} /> – {appt.appointment_type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            {confirmAction.show && (
                <div className={styles.overlay}>
                    <div className={styles.confirmDialog}>
                        <p>Are you sure you want to mark this appointment as {confirmAction.status}?</p>
                        <button onClick={confirmUpdateStatus} className={styles.confirmBtn}>Yes</button>
                        <button onClick={cancelUpdateStatus} className={styles.cancelBtn}>No</button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
