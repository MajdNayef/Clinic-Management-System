// --- UPDATED: AdminDashboard.jsx with Real-Time Tracking + Calendar View ---

import React, { useEffect, useState } from "react";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/admindashboard.module.css";
import { Users, User, UserCheck, UserPlus, Activity, Calendar } from "react-feather";
import { FaStethoscope, FaComments } from 'react-icons/fa';
import axios from "axios";
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
    const { t } = useTranslation();
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
                <h2>{t('admin.dmcAdminDashboard')}</h2>
                <hr className={styles.divider} />

                {/* Community Section */}
                <section>
                    <h3>{t('admin.dmcCommunity')}</h3>
                    <div className={styles.statBox}>
                        <div className={styles.statItem}><Users size={18} /> {t('admin.totalSystemUsers')}: {stats.totalUsers}</div>
                        <div className={styles.statRow}>
                            <div className={styles.statMini}><User size={16} /> {t('admin.doctors')}: {stats.doctors}</div>
                            <div className={styles.statMini}><UserCheck size={16} /> {t('admin.patients')}: {stats.patients}</div>
                            <div className={styles.statMini}><UserPlus size={16} /> {t('admin.admins')}: {stats.admins}</div>
                            <div className={styles.statMini}><Activity size={16} /> {t('admin.pharmacists')}: {stats.pharmacists}</div>
                        </div>
                    </div>
                </section>
                {/* Slot Limits + Appointments in One Row */}
                <div className={styles.sectionRow}>

                    <section className={styles.halfWidth}>
                        <h3>{t('admin.dmcTodayAppointments')}</h3>
                        <div className={styles.statBox}>
                            <div className={styles.statRow}>
                            <div className={styles.statMini}><Users size={18} /> {t('admin.total')}: {stats.totalAppointments}</div>
                                <div className={styles.statMini}><User size={16} /> {t('admin.virtual')}: {stats.virtualAppointments}</div>
                                <div className={styles.statMini}><UserCheck size={16} /> {t('admin.physical')}: {stats.physicalAppointments}</div>
                            </div>
                        </div>
                    </section>
                    <section className={styles.halfWidth}>
                        <h3>{t('admin.todaysSlotLimits')}</h3>
                        <div className={styles.statBox}>
                            <div className={styles.statRow}>
                                <div className={styles.statMini}><FaStethoscope /> {t('admin.maxPhysicalSlots')}: {todaySlotLimits.physical}</div>
                                <div className={styles.statMini}><FaComments /> {t('admin.maxVirtualSlots')}: {todaySlotLimits.virtual}</div>
                            </div>
                        </div>
                    </section>
                </div>
                {/* On-Site Tracking */}
                <section>
                    <h3>{t('admin.realTimeOnSitePatients')}</h3>
                    <div className={styles.statBox}>

                        {onSitePatients.length > 0 ? (
                            <ul className={styles.onSiteList}>
                                {onSitePatients.map(p => (
                                    <li key={p._id}>
                                        {p.first_name} {p.last_name} ({p.email})
                                    </li>
                                ))}
                            </ul>
                        ) : <p>{t('admin.noPatientsCurrentlyOnSite')}</p>}
                    </div>
                </section>

                {/* Calendar View */}
                <section>
                    <h3>{t('admin.appointmentCalendar')}</h3>
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
