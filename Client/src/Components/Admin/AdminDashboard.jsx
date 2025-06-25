import React, { useEffect, useState } from "react";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/admindashboard.module.css";
import { Users, User, UserCheck, UserPlus, Activity } from "react-feather";
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

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await axios.get("/api/admin/dashboard");
            setStats({
                totalUsers: data.totalUsers,
                doctors: data.doctors,
                patients: data.patients,
                admins: data.admins,
                pharmacists: data.pharmacists,
                totalAppointments: data.totalAppointments,
                virtualAppointments: data.virtualAppointments,
                physicalAppointments: data.physicalAppointments
            });
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    return (
        <DashboardLayout>
            <div className={styles.adminDashboardContainer}>
                <h2 className={styles.sectionTitle}>DMC Admin Dashboard</h2>
                <hr className={styles.divider} />

                {/* Community Section */}
                <section>
                    <h3 className={styles.sectionSubtitle}>DMC Community</h3>
                    <div className={styles.statBox}>
                        <div className={styles.statItem}>
                            <Users size={18} /> Total System Users: {stats.totalUsers}
                        </div>
                        <div className={styles.statRow}>
                            <div className={styles.statMini}><User size={16} /> Doctors: {stats.doctors}</div>
                            <div className={styles.statMini}><UserCheck size={16} /> Patients: {stats.patients}</div>
                            <div className={styles.statMini}><UserPlus size={16} /> Admins: {stats.admins}</div>
                            <div className={styles.statMini}><Activity size={16} /> Pharmacists: {stats.pharmacists}</div>
                        </div>
                    </div>
                </section>

                {/* Appointments Section */}
                <section>
                    <h3 className={styles.sectionSubtitle}>DMC Appointments</h3>
                    <div className={styles.statBox}>
                        <div className={styles.statItem}>
                            <Users size={18} /> Today Total Appointments: {stats.totalAppointments}
                        </div>
                        <div className={styles.statRow}>
                            <div className={styles.statMini}><User size={16} /> Virtual: {stats.virtualAppointments}</div>
                            <div className={styles.statMini}><UserCheck size={16} /> Physical: {stats.physicalAppointments}</div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
