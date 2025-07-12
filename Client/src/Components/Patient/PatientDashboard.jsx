// src/components/Patient/PatientDashboard.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import DashboardLayout from './layout/DashboardLayout';
import styles from './css/patientdashboard.module.css';
import { useTranslation } from 'react-i18next';

export default function PatientDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppt, setSelectedAppt] = useState(null);

    const navigate = useNavigate();
    const { t } = useTranslation();

    // Fetch appointments on mount
    useEffect(() => {
        axios.get('/api/appointments')
            .then(res => setAppointments(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Close details modal
    const closeModal = () => setSelectedAppt(null);

    // Start/join live chat by appointmentId only
    const handleLiveChat = async (appt) => {
        console.log('👉 starting live chat for appt', appt);

        // 1) Grab _all_ three IDs
        const appointmentId = appt._id;
        const doctorId =
            appt.doctor?._id;  // if your API nested a doctor object

        const patientId =
            appt.patient?._id ||   // if your API nested a patient object
            appt.patientId ||   // or if it camelCased
            appt.patient_id ||   // or snake_cased in the raw DB
            localStorage.getItem('patientId'); // fallback to current patient id
        // console.log('👉 patient id ]', appt.patient_id);

        // 2) Guard
        if (!appointmentId || !doctorId || !patientId) {
            console.warn('missing IDs', { appointmentId, doctorId, patientId });
            return alert('Could not start chat: missing IDs');
        }

        try {
            // 3) POST to get-or-create the session
            const { data } = await axios.post('/api/chat-sessions', { appointmentId });
            console.log('✅ got sessionId', data.sessionId);

            // 4) Redirect, carrying all the things
            const chatWith = `Dr. ${appt.doctor.first_name} ${appt.doctor.last_name}`;
            navigate(
                `/patient/live-chat?` +
                `sessionId=${data.sessionId}` +
                `&doctorId=${doctorId}` +
                `&patientId=${patientId}` +
                `&userType=patient` +
                `&chatWith=${encodeURIComponent(chatWith)}` +
                `&doctorAvatar=${encodeURIComponent(data.doctorAvatar)}` +
                `&appointmentTime=${encodeURIComponent(data.appointmentTime)}` +
                `&appointmentDate=${encodeURIComponent(data.appointmentDate)}`,
                { replace: false }
            );
        } catch (err) {
            console.error('❌ error starting live chat:', err);
            alert('Could not start live chat. See console.');
        }
    };

    // Show today or future appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = appointments.filter(appt => {
        const d = new Date(appt.date);
        d.setHours(0, 0, 0, 0);
        return d >= today;
    });

    return (
        <DashboardLayout>
            <h2 className={styles.dashboardTitle}>{t('dashboard.patientDashboard')}</h2>
            <hr className={styles.sectionDivider} />

            <section className={styles.appointmentsSection}>
                <h3 className={styles.sectionHeading}>📌 {t('dashboard.upcomingAppointments')}</h3>

                {loading ? (
                    <p>{t('common.loading')}</p>
                ) : (
                    <div className={styles.appointmentsGrid}>
                        {upcoming.length === 0 && <p>{t('dashboard.noUpcomingAppointments')}</p>}

                        {upcoming.map(appt => {
                            const name = `Dr. ${appt.doctor.first_name} ${appt.doctor.last_name}`;
                            const isVirtual = appt.appointment_type === 'Virtual';
                            const typeCls = isVirtual ? styles.live : styles.physical;
                            const typeLabel = isVirtual ? t('appointments.liveChat') : t('appointments.physical');
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
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.detailsButton}
                                                onClick={() => setSelectedAppt(appt)}
                                            >
                                                {t('appointments.detailsBtn')}
                                            </button>
                                            {isVirtual && (
                                                <button
                                                    className={styles.detailsButton}
                                                    onClick={() => handleLiveChat(appt)}
                                                >
                                                    {t('appointments.joinLiveChat')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.appointmentStatusContainer}>
                                        <div
                                            className={`${styles.appointmentStatus} ${appt.status === 'Canceled' ? styles.canceled : ''
                                                }`}
                                        >
                                            {appt.status}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
                        >
                            ×
                        </button>

                        <h2>{t('appointments.details')}</h2>
                        <p>
                            <strong>{t('appointments.doctor')}:</strong>{' '}
                            Dr. {selectedAppt.doctor.first_name} {selectedAppt.doctor.last_name}
                        </p>
                        <p>
                            <strong>{t('appointments.specialization')}:</strong>{' '}
                            {selectedAppt.doctor.specialization}
                        </p>
                        <p>
                            <strong>{t('appointments.bio')}:</strong> {selectedAppt.doctor.bio}
                        </p>
                        <p>
                            <strong>{t('appointments.date')}:</strong> {selectedAppt.date}
                        </p>
                        <p>
                            <strong>{t('appointments.time')}:</strong> {selectedAppt.time}
                        </p>
                        <p>
                            <strong>{t('appointments.type')}:</strong> {selectedAppt.appointment_type}
                        </p>
                        <p>
                            <strong>{t('appointments.status')}:</strong>{' '}
                            <span
                                className={
                                    selectedAppt.status === 'Canceled' ? styles.canceled : ''
                                }
                            >
                                {selectedAppt.status}
                            </span>
                        </p>

                        {selectedAppt.appointment_type === 'In-Person' && (
                            <div className={styles.mapContainer}>
                                <h3>{t('appointments.clinicLocation')}</h3>
                                <iframe
                                    title="Clinic Location"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3630.8143522730757!2d39.62500285933744!3d24.491888478262545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15bdbf99191c3081%3A0x9c4a2e5b638155ec!2z2YXYrNmF2Lkg2KfZhNi32Kgg2KfZhNmF2KrZhdmK2LIg2KfZhNi32KjZig!5e0!3m2!1sar!2smy!4v1748242571068!5m2!1sar!2smy"
                                    width="100%"
                                    height="250"
                                    style={{ border: 0, borderRadius: '8px', marginTop: '1rem' }}
                                    allowFullScreen
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
