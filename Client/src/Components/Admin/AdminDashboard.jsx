// --- UPDATED: AdminDashboard.jsx with Real-Time Tracking + Calendar View ---

import React, { useEffect, useState } from "react";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/admindashboard.module.css";
import { Users, User, UserCheck, UserPlus, Activity, Calendar } from "react-feather";
import { FaStethoscope, FaComments } from 'react-icons/fa';
import axios from "axios";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        doctors: 0,
        patients: 0,
        admins: 0,
        pharmacists: 0,
        totalAppointments: 0,
        virtualAppointments: 0,
        physicalAppointments: 0
    });

    const [onSitePatients, setOnSitePatients] = useState([]);
    const [calendarData, setCalendarData] = useState([]);
    const [calendarError, setCalendarError] = useState(null);
    const [todaySlotLimits, setTodaySlotLimits] = useState({ virtual: 0, physical: 0 });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    useEffect(() => {
        fetchStats();
        fetchOnSitePatients();
        fetchCalendarData();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await axios.get("/api/admin/dashboard");
            setStats(data);

            const today = new Date().toISOString().split("T")[0];
            const slotRes = await axios.get("/api/admin/clinic-capacities", {
                params: { date: today }
            });

            // Calculate aggregate max slots
            const totalPhysical = slotRes.data.reduce((sum, entry) => sum + (entry.max_physical_appointments || 0), 0);
            const totalVirtual = slotRes.data.reduce((sum, entry) => sum + (entry.max_virtual_appointments || 0), 0);

            setTodaySlotLimits({ physical: totalPhysical, virtual: totalVirtual });
        } catch (err) {
            console.error("Failed to fetch stats or slot limits", err);
        }
    };


    const fetchOnSitePatients = async () => {
        try {
            const { data } = await axios.get("/api/admin/patients/on-site");
            setOnSitePatients(data);
        } catch (err) {
            console.error("Failed to fetch on-site patients", err);
        }
    };

    const fetchCalendarData = async () => {
        try {
            const res = await axios.get('/api/admin/appointments/calendar', {
                params: { year, month }
            });
            setCalendarData(res.data);
        } catch (err) {
            setCalendarError("Could not load calendar data");
        }
    };

    const getCounts = dateStr => {
        const slice = calendarData.filter(a => a.date === dateStr);
        return {
            physical: slice.filter(a =>
                a.appointment_type === 'Physical' || a.appointment_type === 'In-Person'
            ).length,
            virtual: slice.filter(a =>
                a.appointment_type === 'Virtual' || a.appointment_type === 'Online'
            ).length
        };
    };


    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    return (
        <DashboardLayout>
            <div className={styles.adminDashboardContainer}>
                <h2 className={styles.sectionTitle}>DMC Admin Dashboard</h2>
                <hr className={styles.divider} />

                {/* Community Section */}
                <section>
                    <h3 className={styles.sectionSubtitle}>DMC Community</h3>
                    <div className={styles.statBox}>
                        <div className={styles.statItem}><Users size={18} /> Total System Users: {stats.totalUsers}</div>
                        <div className={styles.statRow}>
                            <div className={styles.statMini}><User size={16} /> Doctors: {stats.doctors}</div>
                            <div className={styles.statMini}><UserCheck size={16} /> Patients: {stats.patients}</div>
                            <div className={styles.statMini}><UserPlus size={16} /> Admins: {stats.admins}</div>
                            <div className={styles.statMini}><Activity size={16} /> Pharmacists: {stats.pharmacists}</div>
                        </div>
                    </div>
                </section>

                {/* Slot Limits Section */}
                <section>
                    <h3 className={styles.sectionSubtitle}>Today's Slot Limits</h3>
                    <div className={styles.statBox}>
                        <div className={styles.statRow}>
                            <div className={styles.statMini}><FaStethoscope /> Max Physical Slots: {todaySlotLimits.physical}</div>
                            <div className={styles.statMini}><FaComments /> Max Virtual Slots: {todaySlotLimits.virtual}</div>
                        </div>
                    </div>
                </section>

                {/* Appointments Section */}
                <section>
                    <h3 className={styles.sectionSubtitle}>DMC Appointments</h3>
                    <div className={styles.statBox}>
                        <div className={styles.statItem}><Users size={18} /> Today Total Appointments: {stats.totalAppointments}</div>
                        <div className={styles.statRow}>
                            <div className={styles.statMini}><User size={16} /> Virtual: {stats.virtualAppointments}</div>
                            <div className={styles.statMini}><UserCheck size={16} /> Physical: {stats.physicalAppointments}</div>
                        </div>
                    </div>
                </section>

                {/* On-Site Tracking */}
                <section>
                    <h3 className={styles.sectionSubtitle}>Real-Time On-Site Patients</h3>
                    <div className={styles.statBox}>

                        {onSitePatients.length > 0 ? (
                            <ul className={styles.onSiteList}>
                                {onSitePatients.map(p => (
                                    <li key={p._id}>
                                        {p.first_name} {p.last_name} ({p.email})
                                    </li>
                                ))}
                            </ul>
                        ) : <p>No patients currently on-site.</p>}
                    </div>
                </section>

                {/* Calendar View */}
                <section>
                    <h3 className={styles.sectionSubtitle}><Calendar size={18} /> Appointment Calendar</h3>
                    <div className={styles.statBox}>

                        {calendarError ? <p>{calendarError}</p> : (
                            <div className={styles.grid}>
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                    <div key={day} className={styles.dayLabel}>{day}</div>
                                ))}

                                {Array.from({ length: firstDayIndex }).map((_, i) => (
                                    <div key={`e${i}`} className={styles.empty}></div>
                                ))}

                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const { physical, virtual } = getCounts(dateStr);
                                    return (
                                        <div key={dateStr} className={styles.cell}>
                                            <div className={styles.date}>{day}</div>
                                            {physical > 0 && (
                                                <div className={styles.tag}>
                                                    <FaStethoscope className={styles.physicalIcon} /><span>{physical}</span>
                                                </div>
                                            )}
                                            {virtual > 0 && (
                                                <div className={styles.tag}>
                                                    <FaComments className={styles.virtualIcon} /><span>{virtual}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
