import React, { useEffect, useState } from "react";
import styles from "./reports.module.css";
import axios from "axios";
import { useTranslation } from 'react-i18next';

const DoctorReports = () => {
    const [doctors, setDoctors] = useState([]);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/admin/reports/doctors/summary", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDoctors(res.data);
            } catch (err) {
                console.error("Error fetching doctor report summary:", err);
            }
        };

        fetchSummary();
    }, []);
    const handleGenerate = async (doctorId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `/api/admin/reports/doctors/generate/${doctorId}`,
                null,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob", // VERY important to receive PDF correctly
                }
            );

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (err) {
            console.error("Error generating PDF:", err);
        }
    };


    return (
        <div className={styles.pageContent}>
            <h2 className={styles.title}>{t('admin.doctorPerformanceReports')}</h2>

            <div className={styles.tableWrapper}>
                <table className={styles.reportTable}>
                    <thead>
                        <tr>
                            <th>{t('admin.doctorName')}</th>
                            <th>Specialization</th>
                            <th>{t('admin.totalAppointments')}</th>
                            <th>{t('admin.virtual')}</th>
                            <th>{t('admin.physical')}</th>
                            <th>Avg Rating ⭐</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.map((doc) => (
                            <tr key={doc.doctorId}>
                                <td>{doc.name}</td>
                                <td>{doc.specialization || "N/A"}</td>
                                <td>{doc.totalAppointments}</td>
                                <td>{doc.virtualCount}</td>
                                <td>{doc.physicalCount}</td>
                                <td>{doc.averageRating}</td>
                                <td>
                                    <button
                                        className={styles.generateBtn}
                                        onClick={() => handleGenerate(doc.doctorId)}
                                    >
                                        Generate Report
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DoctorReports;
