import React from 'react'
import DashboardLayout from './layout/DashboardLayout'
import styles from './css/viewAppointments.module.css'
import { FaStethoscope, FaComments } from 'react-icons/fa' // Import Font Awesome icons

const appointments = [
    { date: '2025-04-07', type: 'Physical' },
    { date: '2025-04-07', type: 'Physical' },
    { date: '2025-04-07', type: 'Physical' },
    { date: '2025-04-07', type: 'Physical' },
    { date: '2025-04-07', type: 'Live chat' },
    { date: '2025-04-09', type: 'Live chat' },
    { date: '2025-04-20', type: 'Physical' },
    { date: '2025-04-20', type: 'Live chat' },
    { date: '2025-04-20', type: 'Live chat' },
    { date: '2025-04-26', type: 'Physical' }
]

const offDays = ['2025-04-10', '2025-04-15', '2025-04-25']; // Predefined off days

const getAppointmentCounts = (dateStr) => {
    const filtered = appointments.filter(a => a.date === dateStr)
    return {
        physical: filtered.filter(a => a.type === 'Physical').length,
        virtual: filtered.filter(a => a.type === 'Live chat').length
    }
}
const DoctorSchedule = () => {
    const daysInMonth = 30
    const firstDayIndex = new Date('2025-04-01').getDay() // 2 for Tuesday

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <h2 className={styles.title}>Doctor's Monthly Schedule</h2><hr />
                <div className={styles.calendarHeader}>April 2025</div>

                <div className={styles.grid}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className={styles.dayLabel}>{day}</div>
                    ))}

                    {Array(firstDayIndex).fill(null).map((_, idx) => (
                        <div key={'empty-' + idx} className={styles.empty}></div>
                    ))}

                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1
                        const dateStr = `2025-04-${day.toString().padStart(2, '0')}`
                        const { physical, virtual } = getAppointmentCounts(dateStr)
                        const isOffDay = offDays.includes(dateStr);

                        return (
                            <div key={day} className={`${styles.cell} ${isOffDay ? styles.offDay : ''}`}>
                                <div className={styles.date}>{day}</div>
                                {isOffDay && <div className={styles.offDayText}>Off Day</div>}
                                {physical > 0 && !isOffDay && (
                                    <div className={styles.tag}>
                                        <FaStethoscope className={styles.physicalIcon} />
                                        <span>{physical}</span>
                                    </div>
                                )}
                                {virtual > 0 && !isOffDay && (
                                    <div className={styles.tag}>
                                        <FaComments className={styles.virtualIcon} />
                                        <span>{virtual}</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </DashboardLayout>
    )
}

export default DoctorSchedule
