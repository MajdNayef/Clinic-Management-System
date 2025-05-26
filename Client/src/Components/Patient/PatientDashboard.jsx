import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import DashboardLayout from './layout/DashboardLayout';
import styles from './css/patientdashboard.module.css';

export default function PatientDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppt, setSelectedAppt] = useState(null);

    useEffect(() => {
        axios.get('/api/appointments')
            .then(res => setAppointments(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const closeModal = () => setSelectedAppt(null);

    return (
        <DashboardLayout>
            <h2 className={styles.dashboardTitle}>DMC Patient Dashboard</h2>
            <hr className={styles.sectionDivider} />

            <section className={styles.appointmentsSection}>
                <h3 className={styles.sectionHeading}>📌 Upcoming Appointments</h3>

                {loading
                    ? <p>Loading…</p>
                    : (
                        <div className={styles.appointmentsGrid}>
                            {appointments.length === 0 && <p>No upcoming appointments</p>}

                            {appointments.map(appt => {
                                const name = `Dr. ${appt.doctor.first_name} ${appt.doctor.last_name}`;
                                const isVirtual = appt.appointment_type === 'Virtual';
                                const typeCls = isVirtual ? styles.live : styles.physical;
                                const typeLabel = isVirtual ? 'Live chat' : 'Physical';

                                const dt = new Date(appt.date);
                                const dateStr = `${dt.getDate()} / ${dt.getMonth() + 1} / ${dt.getFullYear()}`;

                                return (
                                    <div key={appt._id} className={styles.appointmentCard}>
                                        <div className={styles.appointmentContent}>
                                            <div className={styles.appointmentHeader}>{name}</div>
                                            <div className={styles.appointmentDetails}>
                                                <FiClock /> {appt.time}
                                            </div>
                                            <div className={styles.appointmentDetails}>
                                                <FiCalendar /> {dateStr}
                                            </div>
                                            <div className={`${styles.appointmentType} ${typeCls}`}>
                                                <FiUser /> {typeLabel}
                                            </div>
                                            <button
                                                className={styles.detailsButton}
                                                onClick={() => setSelectedAppt(appt)}
                                            >
                                                Details
                                            </button>
                                        </div>
                                        <div className={styles.appointmentStatusContainer}>
                                            <div className={styles.appointmentStatus}>
                                                {appt.status}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                }
            </section>

            {/* Details Modal */}
            {selectedAppt && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div
                        className={styles.modalContent}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className={styles.closeButton}
                            onClick={closeModal}
                        >×</button>

                        <h2>Appointment Details</h2>
                        <p>
                            <strong>Doctor:</strong>{" "}
                            Dr. {selectedAppt.doctor.first_name} {selectedAppt.doctor.last_name}
                        </p>
                        <p>
                            <strong>Specialization:</strong> {selectedAppt.doctor.specialization}
                        </p>
                        <p>
                            <strong>Bio:</strong> {selectedAppt.doctor.bio}
                        </p>
                        <p>
                            <strong>Date:</strong> {selectedAppt.date}
                        </p>
                        <p>
                            <strong>Time:</strong> {selectedAppt.time}
                        </p>
                        <p>
                            <strong>Type:</strong> {selectedAppt.appointment_type}
                        </p>
                        <p>
                            <strong>Status:</strong> {selectedAppt.status}
                        </p>

                        {/* ← Here’s your conditional map embed */}
                        {selectedAppt.appointment_type === "In-Person" && (
                            <div className={styles.mapContainer}>
                                <h3>Clinic Location</h3>
                                <iframe
                                    title="Clinic Location"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3630.8143522730757!2d39.62500285933744!3d24.491888478262545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15bdbf99191c3081%3A0x9c4a2e5b638155ec!2z2YXYrNmF2Lkg2KfZhNi32Kgg2KfZhNmF2KrZhdmK2LIg2KfZhNi32KjZig!5e0!3m2!1sar!2smy!4v1748242571068!5m2!1sar!2smy"
                                    width="100%"
                                    height="250"
                                    style={{ border: 0, borderRadius: "8px", marginTop: "1rem" }}
                                    allowFullScreen=""
                                    loading="lazy"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

        </DashboardLayout>
    );
}
