// pages/AppointmentStatisticsPage.js
import React, { useState } from "react";
import axios from "axios";
import styles from "./reports.module.css";

const AppointmentStatisticsPage = () => {
    const [startMonth, setStartMonth] = useState("");
    const [endMonth, setEndMonth] = useState("");
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch summary for the chosen range
    const fetchStatistics = async () => {
        if (!startMonth || !endMonth) return alert("Please pick both start and end months.");

        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get("/api/admin/reports/appointments/statistics", {
                headers: { Authorization: `Bearer ${token}` },
                params: { start: startMonth, end: endMonth },      // 👉 adjust to your backend query names
            });
            setStats(res.data);
        } catch (err) {
            console.error("Error loading appointment statistics:", err);
            alert("Failed to load statistics. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    // Generate/download PDF for a stored statistics report
    const handleGenerate = async (reportId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `/api/admin/reports/appointments/statistics/generate/${reportId}`, // 👉 align with your route
                null,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                }
            );

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Could not generate PDF. Check console for details.");
        }
    };

    return (
        <div className={styles.pageContent}>
            <h2 className={styles.title}>Appointment Statistics Reports</h2>

            {/* ► Date-range picker row */}
            <div className={styles.filterBar}>
                <label>
                    Start&nbsp;Month&nbsp;
                    <input
                        type="month"
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        className={styles.dateInput}
                    />
                </label>

                <label>
                    End&nbsp;Month&nbsp;
                    <input
                        type="month"
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                        className={styles.dateInput}
                    />
                </label>

                <button onClick={fetchStatistics} className={styles.generateBtn}>
                    {loading ? "Loading..." : "Fetch Report"}
                </button>
            </div>

            {/* ► Results table */}
            <div className={styles.tableWrapper}>
                <table className={styles.reportTable}>
                    <thead>
                        <tr>
                            <th>Date Range</th>
                            <th>Total Appointments</th>
                            <th>Face-to-Face</th>
                            <th>Virtual</th>
                            <th>Created At</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {stats.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center" }}>
                                    {loading ? "Fetching data…" : "No data for selected range."}
                                </td>
                            </tr>
                        )}

                        {stats.map((r) => (
                            <tr key={r._id}>
                                <td>{r.report_date_range}</td>
                                <td>{r.total_appointments}</td>
                                <td>{r.f2f_appointments}</td>
                                <td>{r.virtual_appointments}</td>
                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className={styles.generateBtn}
                                        onClick={() => handleGenerate(r._id)}
                                    >
                                        Generate PDF
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

export default AppointmentStatisticsPage;
