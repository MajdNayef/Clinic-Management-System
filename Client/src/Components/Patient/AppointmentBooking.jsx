import React, { useState } from "react"
import DashboardLayout from "./layout/DashboardLayout"
import { FiClock, FiCalendar, FiUser } from "react-icons/fi"
import styles from "./css/appointmentbooking.module.css"

const AppointmentBooking = () => {
    const [appointmentType, setAppointmentType] = useState("in-person")
    const [selectedDoctor, setSelectedDoctor] = useState("")
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")

    const doctors = [
        { id: 1, name: "Dr. Ahmed Hassan", specialty: "Cardiology", image: "/placeholder.svg?height=50&width=50" },
        { id: 2, name: "Dr. Sara Khalid", specialty: "Dermatology", image: "/placeholder.svg?height=50&width=50" },
        { id: 3, name: "Dr. Mohammed Ali", specialty: "Orthopedics", image: "/placeholder.svg?height=50&width=50" },
        { id: 4, name: "Dr. Layla Mahmoud", specialty: "Pediatrics", image: "/placeholder.svg?height=50&width=50" },
    ]

    const timeSlots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM",
        "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    ]

    const handleSubmit = (e) => {
        e.preventDefault()
        alert(`Appointment booked with ${selectedDoctor} on ${selectedDate} at ${selectedTime}`)
    }

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
                            {["in-person", "virtual"].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`${styles.typeButton} ${appointmentType === type ? styles.active : ""}`}
                                    onClick={() => setAppointmentType(type)}
                                >
                                    <span className="icon">{type === "in-person" ? "🏥" : "💻"}</span>
                                    <span>{type === "in-person" ? "In‑Person Visit" : "Virtual Consultation"}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.appointmentForm}>
                        {/* Select Doctor */}
                        <div className={styles.formSection}>
                            <h2>Select Doctor</h2>
                            <div className={styles.doctorsList}>
                                {doctors.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className={`${styles.doctorCard} ${selectedDoctor === doc.name ? styles.selected : ""}`}
                                        onClick={() => setSelectedDoctor(doc.name)}
                                    >
                                        <img src={doc.image} alt={doc.name} className={styles.doctorImage} />
                                        <div className={styles.doctorInfo}>
                                            <h3>{doc.name}</h3>
                                            <p>{doc.specialty}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Select Date */}
                        <div className={styles.formSection}>
                            <h2>Select Date</h2>
                            <div className={styles.dateInput}>
                                <span className="icon">📅</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Select Time */}
                        <div className={styles.formSection}>
                            <h2>Select Time</h2>
                            <div className={styles.timeSlots}>
                                {timeSlots.map((time) => (
                                    <button
                                        key={time}
                                        type="button"
                                        className={`${styles.timeSlot} ${selectedTime === time ? styles.selected : ""}`}
                                        onClick={() => setSelectedTime(time)}
                                    >
                                        <span className="icon">⏰</span>
                                        <span>{time}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className={styles.formSection}>
                            <h2>Appointment Details</h2>
                            <div className={styles.appointmentSummary}>
                                {selectedDoctor && selectedDate && selectedTime ? (
                                    <>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">👨‍⚕️</span>
                                            <span><strong>Doctor:</strong> {selectedDoctor}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">📅</span>
                                            <span><strong>Date:</strong> {selectedDate}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">⏰</span>
                                            <span><strong>Time:</strong> {selectedTime}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <span className="icon">{appointmentType === "in-person" ? "🏥" : "💻"}</span>
                                            <span>
                                                <strong>Type:</strong>{" "}
                                                {appointmentType === "in-person" ? "In‑Person Visit" : "Virtual Consultation"}
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
                            disabled={!selectedDoctor || !selectedDate || !selectedTime}
                        >
                            Book Appointment
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default AppointmentBooking
