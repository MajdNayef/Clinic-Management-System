import React, { useState } from 'react';
import styles from './reports.module.css';
import { FaDownload, FaHistory, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const AppointmentReports = () => {
    const { t } = useTranslation();
    const [appointment, setAppointment] = useState(null);
    const [generatedReports, setGeneratedReports] = useState([]);
    const [searchId, setSearchId] = useState('');

    const fetchAppointmentById = async () => {
        if (!searchId) return;
        try {
            const { data } = await axios.get(`/api/admin/reports/appointments/details/${searchId}`);
            setAppointment(data);
        } catch (err) {
            alert("❌ Appointment not found");
            console.error("Fetch failed:", err);
        }
    };

    const generateReport = async (appointmentId) => {
        try {
            const res = await axios.post(`/api/admin/reports/appointment/generate/${appointmentId}`, {}, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url);
            loadReportHistory();
        } catch (err) {
            console.error("❌ PDF generation failed:", err);
        }
    };

    const loadReportHistory = async () => {
        try {
            const { data } = await axios.get('/api/admin/reports/appointments/history');
            setGeneratedReports(data);
        } catch (err) {
            console.error("❌ Failed to load report history:", err);
        }
    };

    return (
        <div className={styles.reportContainer}>
            <h2 className={styles.sectionTitle}>{t('admin.appointmentReport')}</h2>

            {/* Search by Appointment ID */}
            <div className={styles.searchRow}>
                <input
                    type="text"
                    placeholder="Enter Appointment ObjectId"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className={styles.searchInput}
                />
                <button onClick={fetchAppointmentById} className={styles.searchBtn}>
                    <FaSearch /> {t('common.search')}
                </button>
            </div>


            {/* Appointment Info */}
            {appointment && (
                <div className={styles.singleResult}>
                    <p><strong>{t('admin.patient')}:</strong> {appointment.patient?.first_name} {appointment.patient?.last_name}</p>
                    <p><strong>{t('admin.doctor')}:</strong> {appointment.doctor?.first_name} {appointment.doctor?.last_name}</p>
                    <p><strong>Appointment Type :</strong> {appointment.appointment?.appointment_type || 'N/A'}</p>
                    <p><strong>Date:</strong> {appointment.appointment?.date || 'N/A'}</p>
                    <p><strong>Time:</strong> {appointment.appointment?.time || 'N/A'}</p>
                    <p><strong>Status:</strong> {appointment.appointment?.status || 'N/A'}</p>
                    <p><strong>Patient Rating:</strong> {appointment.feedback?.rating ?? 'N/A'} </p>
                    <p><strong>Patient Feedback:</strong> {appointment.feedback?.note || 'N/A'}</p>
                    {appointment.appointment?.appointment_type === 'Virtual' && (
                        <p><strong>Chat Messages:</strong> {appointment.chatMessages?.length || ("There is No Chat Session For This Appointment")}</p>
                    )}
                    <button onClick={() => generateReport(appointment.appointment._id)} className={styles.actionBtn}>
                        <FaDownload /> View PDF
                    </button>
                </div>
            )}

            {/* History */}
            <h3 className={styles.sectionSubtitle}><FaHistory /> {t('admin.generatedPDFs')}</h3>
            <div className={styles.historyList}>
                {generatedReports.length > 0 ? generatedReports.map((r) => (
                    <div key={r._id} className={styles.historyItem}>
                        <span>{new Date(r.generatedAt).toLocaleDateString()} — {r.filename}</span>
                        <a href={r.downloadUrl} target="_blank" rel="noreferrer" className={styles.downloadLink}>
                            <FaDownload /> Download
                        </a>
                    </div>
                )) : <p>No reports generated yet.</p>}
            </div>
        </div>
    );
};

export default AppointmentReports;
