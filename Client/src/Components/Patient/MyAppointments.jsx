// src/Components/MyAppointments.jsx
import React from "react"
import styles from "./css/myAppointments.module.css"
import DashboardLayout from './layout/DashboardLayout';
import { useState } from "react"
import { Clock, Calendar, MessageCircle, Star } from "react-feather"


const appointments = {
    upcoming: [
        {
            id: 1,
            doctor: "Dr. Ruhidah",
            time: "09:00 - 10:00 AM",
            date: "12 / 1 / 2025",
            type: "Physical",
            status: "Scheduled",
        },
    ],
    previous: [
        {
            id: 2,
            doctor: "Dr. Abdullah",
            time: "09:00 - 10:00 AM",
            date: "12 / 10 / 2024",
            type: "Physical",
            status: "Completed",
            feedbackGiven: false,
        },
        {
            id: 3,
            doctor: "Dr. Abdullah",
            time: "09:00 - 10:00 AM",
            date: "1 / 1 / 2025",
            type: "Physical",
            status: "Canceled",
        },
        {
            id: 4,
            doctor: "Dr. Najmi",
            time: "09:00 - 10:00 AM",
            date: "14 / 1 / 2025",
            type: "Live chat",
            status: "Completed",
            feedbackGiven: true,
        },
    ],
}

const MyAppointments = () => {
    return (
        <DashboardLayout>

            <div className={styles.wrapper}>
                <h2 className={styles.heading}>My Appointments</h2>
                <hr />

                <section className={styles.section}>
                    <h3>Upcoming Appointments</h3>
                    {appointments.upcoming.map((appt) => (
                        <AppointmentCard key={appt.id} data={appt} isUpcoming />
                    ))}
                </section>

                <section className={styles.section}>
                    <h3>Previous Appointments</h3>
                    {appointments.previous.map((appt) => (
                        <AppointmentCard key={appt.id} data={appt} />
                    ))}
                </section>
            </div>
        </ DashboardLayout>
    )
}
const AppointmentCard = ({ data, isUpcoming }) => {
    const [showFeedback, setShowFeedback] = useState(false)
    const [rating, setRating] = useState(0)
    const [feedback, setFeedback] = useState("")

    const typeClass =
        data.type.toLowerCase() === "live chat"
            ? styles.liveTag
            : styles.physicalTag

    const handleStarClick = (value) => setRating(value)

    const submitFeedback = () => {
        console.log({ rating, feedback })
        // Add actual submission logic here
        setShowFeedback(false)
    }

    return (
        <div className={styles.card}>
            <div className={styles.info}>
                <h4>{data.doctor}</h4>
                <div className={styles.meta}>
                    <span><Clock size={14} /> {data.time}</span>
                    <span><Calendar size={14} /> {data.date}</span>
                    <span className={typeClass}>{data.type}</span>
                </div>
            </div>

            <div className={styles.action}>
                <span className={styles.status}>{data.status}</span>

                {isUpcoming && (
                    <div className={styles.actions}>
                        <button className={styles.link}>Reschedule</button>
                        <button className={styles.link}>Cancel</button>
                    </div>
                )}

                {!isUpcoming && data.status === "Completed" && !data.feedbackGiven && !showFeedback && (
                    <button
                        className={styles.link}
                        onClick={() => setShowFeedback(true)}
                    >
                        <MessageCircle size={14} /> Give Feedback
                    </button>
                )}

                {showFeedback && (
                    <div className={styles.feedbackBox}>
                        <div className={styles.feedbackHeader}>
                            {/* <img src="/heart-icon.svg" alt="Heart Specialist" className={styles.icon} /> */}
                            <div>
                                <h4 className={styles.specialist}>Heart Specialist</h4>
                                <span className={styles.doctor}>• {data.doctor}</span>
                            </div>
                        </div>

                        <div className={styles.ratingRow}>
                            <span>Rating</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={22}
                                    className={star <= rating ? styles.filledStar : styles.star}
                                    onClick={() => handleStarClick(star)}
                                />
                            ))}
                        </div>

                        <div className={styles.feedbackInput}>
                            <label>Care to share more</label>
                            <textarea
                                placeholder="Type your feedbacks"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>

                        <button className={styles.submitBtn} onClick={submitFeedback}>
                            Submit
                        </button>
                    </div>
                )}

                {data.feedbackGiven && (
                    <span className={styles.feedbackSubmitted}>
                        ✓ Feedback Submitted
                    </span>
                )}

                {data.type === "Live chat" && (
                    <div className={styles.chatLinks}>
                        <button className={styles.chatBtn}>View chat</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyAppointments
