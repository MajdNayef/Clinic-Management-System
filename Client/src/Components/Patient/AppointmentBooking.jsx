import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import { FiX, FiClock, FiCalendar, FiUser } from "react-icons/fi";
import styles from "./css/appointmentbooking.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';


axios.defaults.baseURL =
    process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function AppointmentBooking() {
    const { t } = useTranslation();
    // --- appointment type (matches API expectations) ---
    const [appointmentType, setAppointmentType] = useState("In-Person");

    // compute today in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // --- fetched data & loading state ---
    const [doctors, setDoctors] = useState([]);
    const [freeSlots, setFreeSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // --- user selections ---
    const [doctorId, setDoctorId] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [confirmationMessage, setConfirmationMessage] = useState(""); // Add state for confirmation message
    const navigate = useNavigate();                       // ← hook

    const appointmentTypes = [
        { value: 'In-Person', label: t('appointments.inPerson') },
        { value: 'Virtual', label: t('appointments.virtual') }
    ];

    // 1️⃣ load doctor list
    useEffect(() => {
        axios.get("/api/doctors")
            .then(res => setDoctors(res.data))
            .catch(() => toast.error("Failed to load doctors"));
    }, []);

    // 2️⃣ load available slots whenever doctor or date changes
    useEffect(() => {
        if (!doctorId || !date) {
            setFreeSlots([]);
            return;
        }
        setLoadingSlots(true);
        axios.get("/api/appointments/available", {
            params: { doctor_id: doctorId, date }
        })
            .then(res => setFreeSlots(res.data))
            .catch(() => toast.error("Failed to load slots"))
            .finally(() => setLoadingSlots(false));
    }, [doctorId, date]);

    // 3️⃣ submit booking
    const handleSubmit = async e => {
        e.preventDefault();
        console.log('📝 handleSubmit:', {
            doctor_id: doctorId,
            date,
            time,
            type: appointmentType
        });

        try {
            const res = await axios.post('/api/appointments', {
                doctor_id: doctorId,
                date,
                time,
                type: appointmentType
            });
            console.log('✅ booked response:', res.data);

            // remove that slot locally so it disappears immediately
            setFreeSlots(slots => slots.filter(t => t !== time));
            setTime('');
            toast.success('Appointment booked 🎉');
            setConfirmationMessage("Your appointment has been successfully booked!"); // Set confirmation message
        } catch (err) {
            console.error('❌ booking error:', err.response || err);
            toast.error(err.response?.data?.message || 'Booking failed');
        }
    };

    return (
        <DashboardLayout>
            <div className={styles.appointmentContainer}>
                <div className={styles.appointmentHeader}>
                    <h1>{t('appointments.bookTitle')}</h1>
                    <p>{t('appointments.bookSubtitle')}</p>
                    <hr className={styles.sectionDivider} />
                </div>

                <div className={styles.appointmentContent}>

                    {/* Appointment Type */}
                    <div className={styles.appointmentTypeSelector}>
                        <h2>{t('appointments.selectType')}</h2>
                        <div className={styles.typeButtons}>
                            {appointmentTypes.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    className={`${styles.typeButton} ${appointmentType === type.value ? styles.active : ""}`}
                                    onClick={() => setAppointmentType(type.value)}
                                >
                                    <span className="icon">
                                        {type.value === "In-Person" ? "🏥" : "💻"}
                                    </span>
                                    <span>
                                        {type.value === "In-Person"
                                            ? t('appointments.inPersonVisit')
                                            : t('appointments.virtualConsultation')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.appointmentForm}>

                        {/* Select Doctor */}
                        <div className={styles.formSection}>
                            <h2>{t('appointments.selectDoctor')}</h2>
                            <div className={styles.doctorsList}>
                                {doctors.map(d => {
                                    const displayName = d.first_name && d.last_name
                                        ? `Dr. ${d.first_name} ${d.last_name}`
                                        : `Dr. ${d.bio?.split(' ')[0] || 'Doctor'}`;

                                    return (
                                        <div
                                            key={d._id}
                                            className={`${styles.doctorCard} ${d._id === doctorId ? styles.selected : ''}`}
                                            onClick={() => {
                                                setDoctorId(d._id);
                                                setSelectedDoctor(displayName);
                                            }}
                                        >
                                            <img
                                                src="/placeholder.svg?height=50&width=50"
                                                alt={displayName}
                                                className={styles.doctorImage}
                                            />
                                            <div className={styles.doctorInfo}>
                                                <h3>{displayName}</h3>
                                                <p>{d.specialization}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Select Date */}
                        <div className={styles.formSection}>
                            <h2>{t('appointments.selectDate')}</h2>
                            <div className={styles.dateInput}>
                                <span className="icon">📅</span>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                    min={today}            // ← no earlier than today
                                />
                            </div>
                        </div>

                        {/* Select Time */}
                        <div className={styles.formSection}>
                            <h2>{t('appointments.selectTime')}</h2>
                            {loadingSlots ? (
                                <p>Loading…</p>
                            ) : (
                                <div className={styles.timeSlots}>
                                    {freeSlots.map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`${styles.timeSlot} ${time === t ? styles.selected : ""}`}
                                            onClick={() => setTime(t)}
                                        >
                                            <span className="icon">⏰</span>
                                            <span>{t}</span>
                                        </button>
                                    ))}
                                    {freeSlots.length === 0 && doctorId && date && (
                                        <p>No free slots</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className={styles.formSection}>
                            <h2>{t('appointments.details')}</h2>
                            <div className={styles.appointmentSummary}>
                                {selectedDoctor && date && time ? (
                                    <>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">👨‍⚕️</span>
                                            <span><strong>{t('appointments.doctor')}:</strong> {selectedDoctor}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">📅</span>
                                            <span><strong>{t('appointments.date')}:</strong> {date}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">⏰</span>
                                            <span><strong>{t('appointments.time')}:</strong> {time}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">
                                                {appointmentType === "In-Person" ? "🏥" : "💻"}
                                            </span>
                                            <span>
                                                <strong>{t('appointments.type')}:</strong>{" "}
                                                {appointmentType === "In-Person"
                                                    ? t('appointments.inPersonVisit')
                                                    : t('appointments.virtualConsultation')}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <p className={styles.noSelection}>{t('appointments.completeSelection')}</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.bookButton}
                            disabled={!selectedDoctor || !date || !time}
                        >
                            {t('appointments.bookBtn')}
                        </button>
                    </form>

                    {/* Confirmation Message */}
                    {confirmationMessage && (
                        <div
                            className={styles.overlay}
                            onClick={() => navigate("/PatientDashboard")}
                        >
                            <div
                                className={styles.confirmationModal}
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    className={styles.closeBtn}
                                    onClick={() => navigate("/PatientDashboard")} // ← navigate on X
                                >
                                    <FiX />
                                </button>
                                <p>{confirmationMessage}</p>
                            </div>
                        </div>
                    )
                    }

                </div >
            </div >
        </DashboardLayout >
    );
}
