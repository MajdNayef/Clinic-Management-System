// src/Components/Doctors/ViewAppointments.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from './layout/DashboardLayout';
import styles from './css/viewAppointments.module.css';
import { FaStethoscope, FaComments } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function ViewAppointments() {
    const { t } = useTranslation();
    const [appts, setAppts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Example “off days” (you could also fetch these from an API)
    const offDays = ['2025-04-10', '2025-04-15', '2025-04-25'];

    // use the current year/month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1–12

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get('/api/appointments/calendar', {
                    params: { year, month }
                });
                setAppts(res.data);
            } catch (e) {
                console.error('Calendar fetch error ▶', e);
                setError('Could not load calendar');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [year, month]);

    // count in-person vs virtual on a given date
    const getCounts = dateStr => {
        const slice = appts.filter(a => a.date === dateStr);
        return {
            physical: slice.filter(a => a.appointment_type === 'In-Person').length,
            virtual: slice.filter(a => a.appointment_type === 'Virtual').length,
        };
    };

    // calculate calendar layout
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0=Sun … 6=Sat
    const daysInMonth = new Date(year, month, 0).getDate();

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <h2 className={styles.title}>{t('doctor.monthlySchedule')}</h2>
                <hr className={styles.divider} />

                {loading && <p>{t('doctor.loadingCalendar')}</p>}
                {error && <p className={styles.error}>{error}</p>}

                {!loading && !error && (
                    <>
                        <div className={styles.calendarHeader}>
                            {new Date(year, month - 1)
                                .toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </div>

                        <div className={styles.grid}>
                            {[t('common.sun'), t('common.mon'), t('common.tue'), t('common.wed'), t('common.thu'), t('common.fri'), t('common.sat')].map(d => (
                                <div key={d} className={styles.dayLabel}>{d}</div>
                            ))}

                            {/* leading blank cells */}
                            {Array.from({ length: firstDayIndex })
                                .map((_, i) => <div key={`e${i}`} className={styles.empty} />)}

                            {/* actual days */}
                            {Array.from({ length: daysInMonth })
                                .map((_, i) => {
                                    const day = i + 1;
                                    const mm = String(month).padStart(2, '0');
                                    const dd = String(day).padStart(2, '0');
                                    const date = `${year}-${mm}-${dd}`;
                                    const { physical, virtual } = getCounts(date);
                                    const isOff = offDays.includes(date);

                                    return (
                                        <div
                                            key={date}
                                            className={`${styles.cell} ${isOff ? styles.offDay : ''}`}
                                        >
                                            <div className={styles.date}>{day}</div>
                                            {isOff && <div className={styles.offDayText}>{t('doctor.offDay')}</div>}

                                            {!isOff && physical > 0 && (
                                                <div className={styles.tag}>
                                                    <FaStethoscope className={styles.physicalIcon} />
                                                    <span>{physical}</span>
                                                </div>
                                            )}
                                            {!isOff && virtual > 0 && (
                                                <div className={styles.tag}>
                                                    <FaComments className={styles.virtualIcon} />
                                                    <span>{virtual}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
