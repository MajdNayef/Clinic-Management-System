import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/cliniccapacity.module.css";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

export default function ClinicCapacity() {
    const { t } = useTranslation();
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [target, setTarget] = useState("all");
    const [selectedDoctors, setSelectedDoctors] = useState([]);
    const [maxPhysical, setMaxPhysical] = useState("");
    const [maxVirtual, setMaxVirtual] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedDays, setSelectedDays] = useState([]);

    const weekdays = [
        t('admin.monday'), t('admin.tuesday'), t('admin.wednesday'), t('admin.thursday'), t('admin.friday'), t('admin.saturday'), t('admin.sunday')
    ];

    useEffect(() => {
        fetchDoctors();
    }, [selectedDate]);

    const fetchDoctors = async () => {
        try {
            const res = await axios.get(`/api/admin/doctors?date=${selectedDate}`);
            setDoctors(res.data);
        } catch (err) {
            console.error("Failed to load doctors", err);
        }
    };

    const handleCheckbox = (id) => {
        setSelectedDoctors(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleDay = (day) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSaveWorkingHours = async () => {
        if (!startTime || !endTime) return toast.error(t('admin.startEndTimeRequired'));

        try {
            setLoading(true);
            const workingData = {
                start: startTime,
                end: endTime,
                available_days: selectedDays
            };

            if (target === "all") {
                await axios.put("/api/admin/working-hours", workingData);
                toast.success(t('admin.updatedWorkingHoursAll'));
            } else {
                await axios.put("/api/admin/working-hours/bulk", {
                    doctorIds: selectedDoctors,
                    ...workingData
                });
                toast.success(t('admin.updatedWorkingHoursSelected'));
            }

            fetchDoctors();
        } catch (err) {
            console.error("Update failed", err);
            toast.error(t('admin.updateFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCapacity = async () => {
        if (!maxPhysical || !maxVirtual) return toast.error(t('admin.slotLimitsRequired'));

        try {
            setLoading(true);
            await axios.put("/api/admin/clinic-capacities/global", {
                max_physical: maxPhysical,
                max_virtual: maxVirtual,
                date: selectedDate
            });
            toast.success(t('admin.updatedGlobalClinicCapacity'));
            fetchDoctors();
        } catch (err) {
            console.error("Failed to update capacities", err);
            toast.error(t('admin.failedToUpdateSlots'));
        } finally {
            setLoading(false);
        }
    };

    const setToday = () => {
        const today = new Date().toISOString().split("T")[0];
        setSelectedDate(today);
    };

    const setTomorrow = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split("T")[0]);
    };

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <h2 className={styles.title}>{t('admin.clinicCapacityManagement')}</h2>
                <hr />

                {/* Section 1: Global Capacity Slots */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t('admin.setGlobalMaxSlots')}</h3>
                    <div className={styles.formRow}>
                        <button
                            className={styles.tabButton}
                            onClick={setToday}
                        >
                            {t('admin.today')}
                        </button>
                        <button
                            className={styles.tabButton}
                            onClick={setTomorrow}
                        >
                            {t('admin.tomorrow')}
                        </button>
                        <label>{t('admin.orChooseDate')}</label>
                        <input
                            type="date"
                            className={styles.datePickerInput}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>{t('admin.maxPhysical')}</label>
                        <input type="number" value={maxPhysical} onChange={(e) => setMaxPhysical(e.target.value)} />
                        <label>{t('admin.maxVirtual')}</label>
                        <input type="number" value={maxVirtual} onChange={(e) => setMaxVirtual(e.target.value)} />
                        <div className={styles.rightAligned}>
                            <button className={styles.primaryButton} onClick={handleSaveCapacity} disabled={loading}>
                                {loading ? t('admin.saving') : t('admin.saveSlotLimits')}
                            </button>
                        </div>

                    </div>

                </div>

                {/* Section 2: Working Hours */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t('admin.setWorkingHours')}</h3>
                    <div className={styles.formRow}>
                        <div className={styles.formRow}>
                            <div className={styles.radioGroup}>
                                <label className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        value="all"
                                        checked={target === "all"}
                                        onChange={() => setTarget("all")}
                                    />
                                    {t('admin.allDoctors')}
                                </label>
                                <label className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        value="selected"
                                        checked={target === "selected"}
                                        onChange={() => setTarget("selected")}
                                    />
                                    {t('admin.selectedOnly')}
                                </label>
                            </div>
                        </div>

                    </div>
                    <div className={styles.formRow}>
                        <label>{t('admin.startTime')}</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        <label>{t('admin.endTime')}</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                    <div className={styles.formRow}>
                        <label>{t('admin.availableDays')}</label>
                        <div className={styles.checkboxGroup}>
                            {weekdays.map(day => (
                                <label key={day} className={styles.dayCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedDays.includes(day)}
                                        onChange={() => toggleDay(day)}
                                    /> {day}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className={`${styles.formRow} ${styles.rightAligned}`}>
                        <button className={styles.primaryButton} onClick={handleSaveWorkingHours} disabled={loading}>
                            {loading ? t('admin.saving') : t('admin.saveWorkingHours')}
                        </button>
                    </div>

                    {/* Section 3: Doctor Overview */}
                    <h3 className={styles.sectionTitle}>{t('admin.doctorOverview')}</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {target === "selected" && <th>{t('admin.select')}</th>}
                                <th>{t('admin.name')}</th>
                                <th>{t('admin.availableDays')}</th>
                                <th>{t('admin.start')}</th>
                                <th>{t('admin.end')}</th>
                                <th>{t('admin.maxPhysical')}</th>
                                <th>{t('admin.maxVirtual')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map(doc => (
                                <tr key={doc._id}>
                                    {target === "selected" && (
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedDoctors.includes(doc._id)}
                                                onChange={() => handleCheckbox(doc._id)}
                                            />
                                        </td>
                                    )}
                                    <td>{doc.first_name} {doc.last_name}</td>
                                    <td>{doc.doctorData?.available_days?.join(", ") || "-"}</td>
                                    <td>{doc.doctorData?.available_start_time || "-"}</td>
                                    <td>{doc.doctorData?.available_end_time || "-"}</td>
                                    <td>{doc.max_physical_appointments ?? "-"}</td>
                                    <td>{doc.max_virtual_appointments ?? "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
