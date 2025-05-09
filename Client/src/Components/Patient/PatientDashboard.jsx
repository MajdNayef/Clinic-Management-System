// PatientDashboard.jsx
import React from 'react';
import DashboardLayout from './layout/DashboardLayout';
import { FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import styles from './css/patientdashboard.module.css';

const PatientDashboard = () => (
    <DashboardLayout>
        <h2 className={styles.dashboardTitle}>DMC Patient Dashboard</h2>
        <hr className={styles.sectionDivider} />

        <section className={styles.appointmentsSection}>
            <h3 className={styles.sectionHeading}>📌 Upcoming Appointments</h3>
            <div className={styles.appointmentsGrid}>
                {/* 1 */}
                <div className={styles.appointmentCard}>
                    <div className={styles.appointmentContent}>
                        <div className={styles.appointmentHeader}>Dr. Ruhidah</div>
                        <div className={styles.appointmentDetails}>
                            <FiClock /> 09:00 – 10:00 AM
                        </div>
                        <div className={styles.appointmentDetails}>
                            <FiCalendar /> 12 / 1 / 2025
                        </div>
                        <div className={`${styles.appointmentType} ${styles.physical}`}>
                            <FiUser /> Physical
                        </div>
                        <button className={styles.detailsButton}>
                            Details
                        </button>
                    </div>
                    <div className={styles.appointmentStatusContainer}>
                        <div className={styles.appointmentStatus}>Scheduled</div>
                    </div>
                </div>

                {/* 2 */}
                <div className={styles.appointmentCard}>
                    <div className={styles.appointmentContent}>
                        <div className={styles.appointmentHeader}>Dr. Najmi</div>
                        <div className={styles.appointmentDetails}>
                            <FiClock /> 09:00 – 10:00 AM
                        </div>
                        <div className={styles.appointmentDetails}>
                            <FiCalendar /> 14 / 1 / 2025
                        </div>
                        <div className={`${styles.appointmentType} ${styles.live}`}>
                            <FiUser /> Live chat
                        </div>
                        <button className={styles.detailsButton}>
                            Details
                        </button>
                    </div>
                    <div className={styles.appointmentStatusContainer}>
                        <div className={styles.appointmentStatus}>Scheduled</div>
                    </div>
                </div>
            </div>
        </section>
{/*
        <section className={styles.appointmentsSection}>
            <h3 className={styles.sectionHeading}>Previous Appointments</h3>
            <div className={styles.appointmentsGrid}>

                <div className={styles.appointmentCard}>
                    <div className={styles.appointmentContent}>
                        <div className={styles.appointmentHeader}>Dr. Abdullah</div>
                        <div className={styles.appointmentDetails}>
                            <FiClock /> 09:00 – 10:00 AM
                        </div>
                        <div className={styles.appointmentDetails}>
                            <FiCalendar /> 1 / 1 / 2025
                        </div>
                        <div className={`${styles.appointmentType} ${styles.physical}`}>
                            <FiUser /> Physical
                        </div>
                        <button className={styles.detailsButton}>
                            Details
                        </button>
                    </div>
                    <div className={styles.appointmentStatusContainer}>
                        <div className={`${styles.appointmentStatus} ${styles.cancelled}`}>Canceled</div>
                    </div>
                </div>
                <div className={styles.appointmentCard}>
                    <div className={styles.appointmentContent}>
                        <div className={styles.appointmentHeader}>Dr. Abdullah</div>
                        <div className={styles.appointmentDetails}>
                            <FiClock /> 09:00 – 10:00 AM
                        </div>
                        <div className={styles.appointmentDetails}>
                            <FiCalendar /> 12 / 10 / 2024
                        </div>
                        <div className={`${styles.appointmentType} ${styles.physical}`}>
                            <FiUser /> Physical
                        </div>
                        <button className={styles.detailsButton}>
                            Details
                        </button>
                    </div>
                    <div className={styles.appointmentStatusContainer}>
                        <div className={`${styles.appointmentStatus} ${styles.completed}`}>Completed</div>
                    </div>
                </div>
            </div>
        </section>
         */}
    </DashboardLayout>
);

export default PatientDashboard;
