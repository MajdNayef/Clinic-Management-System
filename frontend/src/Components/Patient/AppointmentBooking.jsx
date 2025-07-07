import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import { FiX, FiClock, FiCalendar, FiUser } from "react-icons/fi";
import styles from "./css/appointmentbooking.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";

axios.defaults.baseURL = API_BASE_URL;

export default function AppointmentBooking() {
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
                    <h1>Book an Appointment</h1>
                    <p>Schedule your visit with our healthcare professionals</p>
                    <hr className={styles.sectionDivider} />
                </div>

                <div className={styles.appointmentContent}>

                    {/* Appointment Type */}
                    <div className={styles.appointmentTypeSelector}>
                        <h2>Select Appointment Type</h2>
                        <div className={styles.typeButtons}>
                            {["In-Person", "Virtual"].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`${styles.typeButton} ${appointmentType === type ? styles.active : ""}`}
                                    onClick={() => setAppointmentType(type)}
                                >
                                    <span className="icon">
                                        {type === "In-Person" ? "🏥" : "💻"}
                                    </span>
                                    <span>
                                        {type === "In-Person"
                                            ? "In-Person Visit"
                                            : "Virtual Consultation"}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.appointmentForm}>

                        {/* Select Doctor */}
                        <div className={styles.formSection}>
                            <h2>Select Doctor</h2>
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
                            <h2>Select Date</h2>
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
                            <h2>Select Time</h2>
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
                            <h2>Appointment Details</h2>
                            <div className={styles.appointmentSummary}>
                                {selectedDoctor && date && time ? (
                                    <>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">👨‍⚕️</span>
                                            <span><strong>Doctor:</strong> {selectedDoctor}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">📅</span>
                                            <span><strong>Date:</strong> {date}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">⏰</span>
                                            <span><strong>Time:</strong> {time}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">
                                                {appointmentType === "In-Person" ? "🏥" : "💻"}
                                            </span>
                                            <span>
                                                <strong>Type:</strong>{" "}
                                                {appointmentType === "In-Person"
                                                    ? "In-Person Visit"
                                                    : "Virtual Consultation"}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <p className={styles.noSelection}>Please complete your selection</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.bookButton}
                            disabled={!selectedDoctor || !date || !time}
                        >
                            Book Appointment
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
