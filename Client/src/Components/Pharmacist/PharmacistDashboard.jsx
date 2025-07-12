// src/components/Pharmacist/PharmacistDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
    Clock,
    Calendar,
    Download,
    Search,
    Filter,
    CheckCircle,
    AlertCircle,
    Package
} from "react-feather";
import styles from "./css/pharmacistdashboard.module.css";
import DashboardLayout from "./layout/DashboardLayout";

export default function PharmacistDashboard() {
    const [medicalReports, setMedicalReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const { t } = useTranslation();
    const [selectedReport, setSelectedReport] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);

    useEffect(() => {
        fetchMedicalReports();
    }, []);

    function fetchMedicalReports() {
        setLoading(true);
        axios
            .get("/api/medical-reports/pharmacist")
            .then((res) => setMedicalReports(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }

    const filteredReports = medicalReports.filter(report => {
        const matchesSearch = report.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             report.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "All" || report.prescription_state === statusFilter;
        return matchesSearch && matchesStatus;
    });

    async function updatePrescriptionStatus(reportId, newStatus) {
        try {
            await axios.patch(`/api/medical-reports/${reportId}/prescription-status`, {
                prescription_state: newStatus
            });
            fetchMedicalReports();
            setShowStatusModal(false);
            setSelectedReport(null);
        } catch (error) {
            alert(t("pharmacist.couldNotUpdateStatus"));
        }
    }

    async function downloadReport(reportId) {
        try {
            const { data } = await axios.get(
                `/api/medical-reports/reports/${reportId}/pdf`,
                { responseType: "blob" }
            );
            const pdfBlob = new Blob([data], { type: "application/pdf" });
            const url = URL.createObjectURL(pdfBlob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 1000 * 60);
        } catch (err) {
            console.error("Could not download report:", err);
            alert(t("pharmacist.couldNotDownloadReport"));
        }
    }

    return (
        <DashboardLayout>
        <div className={styles.pharmacistDashboardContainer}>
            <h2 className={styles.sectionTitle}>{t("pharmacist.pharmacistDashboard")}</h2>
            <hr className={styles.divider} />

            {/* Search and Filter */}
            <div className={styles.searchFilterSection}>
                <div className={styles.searchBox}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder={t("pharmacist.searchReports")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.filterBox}>
                    <Filter size={16} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="All">{t("pharmacist.allStatuses")}</option>
                        <option value="Pending">{t("common.pending")}</option>
                        <option value="Issued">{t("common.issued")}</option>
                        <option value="Dispensed">{t("common.dispensed")}</option>
                    </select>
                </div>
            </div>

            {/* Medical Reports List */}
            <section>
                <h3 className={styles.sectionTitle}>{t("pharmacist.medicalReports")}</h3>
                {loading ? (
                    <p>{t("common.loading")}</p>
                ) : filteredReports.length === 0 ? (
                    <p>{t("pharmacist.noReportsFound")}</p>
                ) : (
                    <div className={styles.reportsGrid}>
                        {filteredReports.map((report) => (
                            <div key={report._id} className={styles.reportCard}>
                                <div className={styles.reportHeader}>
                                    <div className={styles.patientInfo}>
                                        <h4>{report.patient_name}</h4>
                                        <div className={styles.metaRow}>
                                            <Calendar size={14} /> {new Date(report.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className={styles.metaRow}>
                                            <Clock size={14} /> {new Date(report.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <div className={styles.statusBadge}>
                                        {report.prescription_state === "Pending" && (
                                            <span className={styles.pendingStatus}>
                                                <AlertCircle size={14} /> {t("common.pending")}
                                            </span>
                                        )}
                                        {report.prescription_state === "Issued" && (
                                            <span className={styles.issuedStatus}>
                                                <CheckCircle size={14} /> {t("common.issued")}
                                            </span>
                                        )}
                                        {report.prescription_state === "Dispensed" && (
                                            <span className={styles.dispensedStatus}>
                                                <Package size={14} /> {t("common.dispensed")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.reportContent}>
                                    <div className={styles.diagnosisSection}>
                                        <strong>{t("pharmacist.diagnosis")}:</strong>
                                        <p>{report.diagnosis}</p>
                                    </div>
                                    <div className={styles.treatmentSection}>
                                        <strong>{t("pharmacist.treatment")}:</strong>
                                        <p>{report.treatment}</p>
                                    </div>
                                </div>
                                <div className={styles.reportActions}>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => downloadReport(report._id)}
                                        title={t("pharmacist.downloadReport")}
                                    >
                                        <Download size={14} /> {t("pharmacist.download")}
                                    </button>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => {
                                            setSelectedReport(report);
                                            setShowStatusModal(true);
                                        }}
                                    >
                                        {t("pharmacist.updateStatus")}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Status Update Modal */}
            {showStatusModal && selectedReport && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <h4>{t("pharmacist.updatePrescriptionStatus")}</h4>
                        <p>{t("pharmacist.selectNewStatus")}</p>
                        <div className={styles.statusOptions}>
                            <button
                                className={`${styles.statusOption} ${selectedReport.prescription_state === "Pending" ? styles.active : ""}`}
                                onClick={() => updatePrescriptionStatus(selectedReport._id, "Pending")}
                            >
                                <AlertCircle size={16} /> {t("common.pending")}
                            </button>
                            <button
                                className={`${styles.statusOption} ${selectedReport.prescription_state === "Issued" ? styles.active : ""}`}
                                onClick={() => updatePrescriptionStatus(selectedReport._id, "Issued")}
                            >
                                <CheckCircle size={16} /> {t("common.issued")}
                            </button>
                            <button
                                className={`${styles.statusOption} ${selectedReport.prescription_state === "Dispensed" ? styles.active : ""}`}
                                onClick={() => updatePrescriptionStatus(selectedReport._id, "Dispensed")}
                            >
                                <Package size={16} /> {t("common.dispensed")}
                            </button>
                        </div>
                        <button
                            className={styles.cancelBtn}
                            onClick={() => {
                                setShowStatusModal(false);
                                setSelectedReport(null);
                            }}
                        >
                            {t("common.cancel")}
                        </button>
                    </div>
                </div>
            )}
        </div>
        </DashboardLayout>
    );
} 