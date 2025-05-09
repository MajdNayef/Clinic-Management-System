import React from 'react'
import styles from './css/doctordashboard.module.css'
import { Clock, Calendar, Check, X as Cancel, Users } from 'react-feather'
import DashboardLayout from './layout/DashboardLayout'

const DoctorDashboard = () => {
    const currentAppointment = {
        name: 'Patient Majd Nayef Youssef',
        time: '09:00 - 10:00 AM',
        date: '12 / 1 / 2025',
        type: 'Physical',
        status: 'Scheduled',
    }

    const nextAppointments = [
        { name: 'Patient Abdulah', time: '10:00 - 11:00 AM', type: 'Physical' },
        { name: 'Patient Salma', time: '10:00 - 11:00 AM', type: 'Live chat' },
        { name: 'Patient Salma', time: '10:00 - 11:00 AM', type: 'Live chat' },
        { name: 'Patient Abdulah', time: '10:00 - 11:00 AM', type: 'Physical' },
        { name: 'Patient Salma', time: '10:00 - 11:00 AM', type: 'Live chat' },
        { name: 'Patient Salma', time: '10:00 - 11:00 AM', type: 'Live chat' },
    ]

    return (
        <DashboardLayout>
            <div className={styles.doctorDashboardContainer}>
                <h2 className={styles.sectionTitle}>DMC Doctors Dashboard</h2>
                <hr className={styles.divider} />

                <section>
                    <h3 className={styles.sectionTitle}>Current Appointment</h3>
                    <div className={styles.currentAppointmentCard}>
                        <div className={styles.currentDetails}>
                            <div className={styles.patientName}>{currentAppointment.name}</div>
                            <div className={styles.metaRow}><Clock size={14} /> {currentAppointment.time}</div>
                            <div className={styles.metaRow}><Calendar size={14} /> {currentAppointment.date}</div>
                            <div><span className={styles.tag}><Users size={14} />  -  {currentAppointment.type}</span></div>
                        </div>
                        <div className={styles.actionsRow}>
                            <button className={styles.actionBtn}>Patient Medical report</button>
                            <button className={`${styles.actionBtn} ${styles.disabled}`}>Connect to live chat</button>
                            <div className={styles.statusLegend}>
                                <span><Check size={14} /> Done</span>
                                <span><Cancel size={14} /> Canceled</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className={styles.sectionTitle}>Next Appointments</h3>
                    <div className={styles.nextAppointmentsGrid}>
                        {nextAppointments.map((appt, idx) => (
                            <div key={idx} className={styles.appointmentCard}>
                                <h4>{appt.name}</h4>
                                <div className={styles.timeRow}><Clock size={14} /> {appt.time}</div>
                                <div className={styles.timeRow}><Calendar size={14} /> Date</div>
                                <div className={styles.cardTags}>
                                    <span className={styles.tag}><Users size={14} /> - {appt.type}</span>
                                    {/* <div className={styles.roleIcons}>
                                        <span>A</span>
                                        <span>G</span>
                                    </div> */}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    )
}

export default DoctorDashboard
