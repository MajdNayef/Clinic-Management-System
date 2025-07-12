// src/components/Doctors/DoctorDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Clock,
    Calendar,
    Check,
    X as Cancel,
    Users,
    FileText,
    PlusSquare,
    Download,
} from "react-feather";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/doctordashboard.module.css";

export default function DoctorDashboard() {
    /* ─────────────────── state ─────────────────── */
    const [allAppts, setAllAppts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    const [confirmAction, setConfirmAction] = useState({
        show: false,
        id: null,
        status: "",
    });

    const [reportModal, setReportModal] = useState({
        show: false,
        mode: "menu", // menu | list | form
        appt: null,
    });

    const [newReport, setNewReport] = useState({
        diagnosis: "",
        treatment: "",
        prescription_state: "Pending",
    });

    const [previousReports, setPreviousReports] = useState([]);
    const [prevLoading, setPrevLoading] = useState(false);

    const navigate = useNavigate();

    /* ───────────────── fetch today's appointments ───────────────── */
    useEffect(fetchData, []);
    function fetchData() {
        setLoading(true);
        axios
            .get("/api/appointments/doctor")
            .then((res) => setAllAppts(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }

    /* ───────────────── status update confirm ───────────────── */
    function handleActionClick(id, status) {
        setConfirmAction({ show: true, id, status });
    }
    async function confirmUpdateStatus() {
        try {
            await axios.patch(`/api/appointments/${confirmAction.id}/status`, {
                status: confirmAction.status,
            });
            fetchData();
        } catch {
            alert(t("doctor.couldNotUpdateStatus"));
        } finally {
            setConfirmAction({ show: false, id: null, status: "" });
        }
    }

    /* ───────────────── live chat ───────────────── */
    async function handleLiveChat(appt) {
        const appointmentId = appt._id;
        const doctorId = appt.doctor_id;
        const patientId = appt.patient_id;
        if (!appointmentId || !doctorId || !patientId) {
            return alert(t("doctor.missingIdsCannotStartChat"));
        }
        try {
            const { data } = await axios.post("/api/chat-sessions", { appointmentId });
            navigate(
                `/doctor/live-chat?` +
                `sessionId=${data.sessionId}` +
                `&doctorId=${doctorId}` +
                `&patientId=${patientId}` +
                `&userType=doctor` +
                `&chatWith=${encodeURIComponent(appt.patient_name)}`
            );
        } catch (err) {
            console.error("live chat error", err);
            alert(t("doctor.couldNotStartLiveChat"));
        }
    }

    /* ───────────────── patient-report overlay ───────────────── */
    async function openReportMenu(appt) {
        setReportModal({ show: true, mode: "menu", appt });
        setPrevLoading(true);
        try {
            // ← updated path here
            const { data } = await axios.get(
                `/api/medical-reports/reports/patient/${appt.patient_id}`
            );
            setPreviousReports(data);
        } catch {
            setPreviousReports([]);
        } finally {
            setPrevLoading(false);
        }
    }
    function closeReportModal() {
        setReportModal({ show: false, mode: "menu", appt: null });
        setPreviousReports([]);
        setNewReport({ diagnosis: "", treatment: "", prescription_state: "Pending" });
    }
    function startNewRecord() {
        setReportModal((p) => ({ ...p, mode: "form" }));
    }
    function viewList() {
        setReportModal((p) => ({ ...p, mode: "list" }));
    }

    async function submitNewReport(e) {
        e.preventDefault();
        const appt = reportModal.appt;
        if (!appt) return;
        const payload = {
            diagnosis: newReport.diagnosis,
            treatment: newReport.treatment,
            prescription_state: newReport.prescription_state,
            patient_id: appt.patient_id,
            doctor_id: appt.doctor_id,
            appointment_id: appt._id,
        };
        try {
            // ← updated path here
            await axios.post(`/api/medical-reports/reports/patient`, payload);
            alert(t("doctor.medicalReportSaved"));
            closeReportModal();
        } catch {
            alert(t("doctor.couldNotSaveReport"));
        }
    }

    async function downloadReport(id) {
        try {
            const { data } = await axios.get(
                `/api/medical-reports/reports/patient/${id}/pdf`,
                { responseType: "blob" }
            );
            const pdfBlob = new Blob([data], { type: "application/pdf" });
            const url = URL.createObjectURL(pdfBlob);
            // open in a new tab
            window.open(url, "_blank");
            // optional: revoke the URL after a bit
            setTimeout(() => URL.revokeObjectURL(url), 1000 * 60);
        } catch (err) {
            console.error("Could not open report in new tab:", err);
            alert(t("doctor.couldNotOpenReport"));
        }
    }

    async function downloadAllReports() {
        const pid = reportModal.appt.patient_id;
        try {
            const { data } = await axios.get(
                `/api/medical-reports/reports/patient/${pid}/all/pdf`,
                { responseType: "blob" }
            );
            const pdfBlob = new Blob([data], { type: "application/pdf" });
            const url = URL.createObjectURL(pdfBlob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 1000 * 60);
        } catch (err) {
            console.error("Could not open combined report:", err);
            alert(t("doctor.couldNotOpenCombinedReport"));
        }
    }

    /* ───────────────── helpers ───────────────── */
    const todayStr = new Date().toLocaleDateString("en-CA");
    const todayAppts = allAppts.filter(
        (a) => a.date === todayStr && !["Completed", "Canceled"].includes(a.status)
    );
    const sorted = todayAppts
        .map((a) => ({
            ...a,
            startDt: new Date(`${a.date}T${a.time.split(" - ")[0]}`),
        }))
        .sort((a, b) => a.startDt - b.startDt);

    const current = sorted[0] || null;
    const next = sorted.slice(1);

    /* ───────────────── render ───────────────── */
    return (
        <DashboardLayout>
            <div className={styles.doctorDashboardContainer}>
                <h2 className={styles.sectionTitle}>{t("doctor.doctorDashboard")}</h2>
                <hr className={styles.divider} />

                {/* Current Appointment */}
                <section>
                    <h3 className={styles.sectionTitle}>{t("doctor.currentAppointment")}</h3>
                    {loading ? (
                        <p>{t("common.loading")}</p>
                    ) : current ? (
                        <div className={styles.currentAppointmentCard}>
                            {current.patient_avatar ? (
                                <img
                                    src={
                                        current.patient_avatar.startsWith("http")
                                            ? current.patient_avatar
                                            : `${axios.defaults.baseURL}${current.patient_avatar}`
                                    }
                                    alt={current.patient_name}
                                    className={styles.avatarImg}
                                />
                            ) : (
                                <div className={styles.avatarCircle}>
                                    {current.patient_name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </div>
                            )}

                            <div className={styles.currentDetails}>
                                <div className={styles.patientName}>
                                    {current.patient_name}
                                </div>
                                <div className={styles.metaRow}>
                                    <Clock size={14} /> {current.time}
                                </div>
                                <div className={styles.metaRow}>
                                    <Calendar size={14} /> {current.date}
                                </div>
                                <div>
                                    <span className={styles.tag}>
                                        <Users size={14} /> – {current.appointment_type}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.actionsRow}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => openReportMenu(current)}
                                >
                                    {t("doctor.patientMedicalReport")}
                                </button>
                                {current.appointment_type === "Virtual" && (
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => handleLiveChat(current)}
                                    >
                                        {t("doctor.connectToLiveChat")}
                                    </button>
                                )}
                                <div className={styles.statusLegend}>
                                    <span
                                        className={styles.actionClickable}
                                        onClick={() =>
                                            handleActionClick(current._id, "Completed")
                                        }
                                    >
                                        <Check size={14} /> {t("common.done")}
                                    </span>
                                    <span
                                        className={styles.actionClickable}
                                        onClick={() =>
                                            handleActionClick(current._id, "Canceled")
                                        }
                                    >
                                        <Cancel size={14} /> {t("common.canceled")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>{t("common.noCurrentAppointment")}</p>
                    )}
                </section>

                {/* Rest of Today's Appointments */}
                <section>
                    <h3 className={styles.sectionTitle}>
                        {t("doctor.restOfTodayAppointments")}
                    </h3>
                    {loading ? (
                        <p>{t("common.loading")}</p>
                    ) : next.length === 0 ? (
                        <p>{t("common.noMoreAppointments")}</p>
                    ) : (
                        <div className={styles.nextAppointmentsGrid}>
                            {next.map((appt) => (
                                <div
                                    key={appt._id}
                                    className={styles.appointmentCard}
                                >
                                    {appt.patient_avatar ? (
                                        <img
                                            src={
                                                appt.patient_avatar.startsWith("http")
                                                    ? appt.patient_avatar
                                                    : `${axios.defaults.baseURL}${appt.patient_avatar}`
                                            }
                                            alt={appt.patient_name}
                                            className={styles.avatarImg}
                                        />
                                    ) : (
                                        <div className={styles.avatarCircle}>
                                            {appt.patient_name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()}
                                        </div>
                                    )}

                                    <div>
                                        <h4>{appt.patient_name}</h4>
                                        <div className={styles.metaRow}>
                                            <Clock size={14} /> {appt.time}
                                        </div>
                                        <div className={styles.metaRow}>
                                            <Calendar size={14} /> {appt.date}
                                        </div>
                                        <div>
                                            <span className={styles.tag}>
                                                <Users size={14} /> – {appt.appointment_type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Confirm status overlay */}
            {confirmAction.show && (
                <div className={styles.overlay}>
                    <div className={styles.confirmDialog}>
                        <p>
                            {t("doctor.areYouSureMarkAppointment")} {confirmAction.status}?
                        </p>
                        <button
                            onClick={confirmUpdateStatus}
                            className={styles.confirmBtn}
                        >
                            {t("common.yes")}
                        </button>
                        <button
                            onClick={() => setConfirmAction({ show: false })}
                            className={styles.cancelBtn}
                        >
                            {t("common.no")}
                        </button>
                    </div>
                </div>
            )}

            {/* Patient Report Modal */}
            {reportModal.show && (
                <div className={styles.reportOverlay}>
                    <div className={styles.reportModal}>

                        {/* MENU */}
                        {reportModal.mode === "menu" && (
                            <>
                                <h4 className={styles.modalTitle}>
                                    {t("doctor.patientMedicalReportTitle")}
                                </h4>
                                <p className={styles.modalSubtitle}>
                                    {t("doctor.whatWouldYouLikeToDo")}
                                </p>
                                <button
                                    className={styles.optionBtn}
                                    onClick={startNewRecord}
                                >
                                    <PlusSquare size={16} /> {t("doctor.createNewRecord")}
                                </button>
                                <button
                                    className={styles.optionBtn}
                                    onClick={viewList}
                                >
                                    <FileText size={16} /> {t("doctor.viewPreviousRecords")}
                                </button>
                                <button
                                    className={styles.optionBtn}
                                    onClick={downloadAllReports}
                                >
                                    <Download size={16} /> {t("doctor.downloadAllRecords")}
                                </button>
                                <button
                                    className={styles.modalCloseBtn}
                                    onClick={closeReportModal}
                                >
                                    {t("common.close")}
                                </button>
                            </>
                        )}

                        {/* LIST */}
                        {reportModal.mode === "list" && (
                            <>
                                <h4 className={styles.modalTitle}>
                                    {t("doctor.previousReports")}
                                </h4>
                                {prevLoading ? (
                                    <p>{t("common.loading")}</p>
                                ) : previousReports.length === 0 ? (
                                    <p>{t("common.noReportsYet")}</p>
                                ) : (
                                    <ul
                                        style={{
                                            maxHeight: 240,
                                            overflowY: "auto",
                                            padding: 0,
                                        }}
                                    >
                                        {previousReports.map((r) => (
                                            <li
                                                key={r._id}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: ".5rem",
                                                    listStyle: "none",
                                                }}
                                            >
                                                <div>
                                                    <strong>
                                                        {new Date(r.createdAt).toLocaleDateString()}
                                                    </strong>
                                                    <div
                                                        style={{
                                                            fontSize: ".8rem",
                                                            color: "#6b7280",
                                                        }}
                                                    >
                                                        {r.diagnosis.slice(0, 40)}
                                                        {r.diagnosis.length > 40 && "…"}
                                                    </div>
                                                </div>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => downloadReport(r._id)}
                                                    title="Download PDF"
                                                >
                                                    <Download size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className={styles.modalBtnRow}>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() =>
                                            setReportModal((p) => ({ ...p, mode: "menu" }))
                                        }
                                    >
                                        {t("common.back")}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* FORM */}
                        {reportModal.mode === "form" && (
                            <>
                                <h4 className={styles.modalTitle}>
                                    {t("doctor.newMedicalRecord")}
                                </h4>
                                <form
                                    className={styles.modalForm}
                                    onSubmit={submitNewReport}
                                >
                                    <label className={styles.modalLabel}>
                                        {t("doctor.diagnosis")}
                                        <textarea
                                            required
                                            className={styles.modalTextarea}
                                            value={newReport.diagnosis}
                                            onChange={(e) =>
                                                setNewReport({
                                                    ...newReport,
                                                    diagnosis: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    <label className={styles.modalLabel}>
                                        {t("doctor.treatment")}
                                        <textarea
                                            required
                                            className={styles.modalTextarea}
                                            value={newReport.treatment}
                                            onChange={(e) =>
                                                setNewReport({
                                                    ...newReport,
                                                    treatment: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    <label className={styles.modalLabel}>
                                        {t("doctor.prescriptionState")}
                                        <select
                                            className={styles.modalSelect}
                                            value={newReport.prescription_state}
                                            onChange={(e) =>
                                                setNewReport({
                                                    ...newReport,
                                                    prescription_state: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="Pending">{t("common.pending")}</option>
                                            <option value="Issued">{t("common.issued")}</option>
                                            <option value="Dispensed">{t("common.dispensed")}</option>
                                        </select>
                                    </label>
                                    <div className={styles.modalBtnRow}>
                                        <button
                                            type="submit"
                                            className={styles.confirmBtn}
                                        >
                                            {t("common.save")}
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.cancelBtn}
                                            onClick={() =>
                                                setReportModal((p) => ({
                                                    ...p,
                                                    mode: "menu",
                                                }))
                                            }
                                        >
                                            {t("common.cancel")}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
