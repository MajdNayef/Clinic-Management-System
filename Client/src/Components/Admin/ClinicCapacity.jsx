import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/cliniccapacity.module.css";
import toast from "react-hot-toast";

export default function ClinicCapacity() {
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

    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
        if (!startTime || !endTime) return toast.error("Start and end time required");

        try {
            setLoading(true);
            const workingData = {
                start: startTime,
                end: endTime,
                available_days: selectedDays
            };

            if (target === "all") {
                await axios.put("/api/admin/working-hours", workingData);
                toast.success("Updated working hours for all doctors");
            } else {
                await axios.put("/api/admin/working-hours/bulk", {
                    doctorIds: selectedDoctors,
                    ...workingData
                });
                toast.success("Updated selected doctors' working hours");
            }

            fetchDoctors();
        } catch (err) {
            console.error("Update failed", err);
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCapacity = async () => {
        if (!maxPhysical || !maxVirtual) return toast.error("Slot limits are required");

        try {
            setLoading(true);
            await axios.put("/api/admin/clinic-capacities/global", {
                max_physical: maxPhysical,
                max_virtual: maxVirtual,
                date: selectedDate
            });
            toast.success("Updated global clinic capacity slots");
            fetchDoctors();
        } catch (err) {
            console.error("Failed to update capacities", err);
            toast.error("Failed to update slots");
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
                <h2 className={styles.title}>Clinic Capacity Management</h2>
                <hr />

                {/* Section 1: Global Capacity Slots */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>1. Set Global Max Slots</h3>
                    <div className={styles.formRow}>
                        <button
                            className={styles.tabButton}
                            onClick={setToday}
                        >
                            Today
                        </button>
                        <button
                            className={styles.tabButton}
                            onClick={setTomorrow}
                        >
                            Tomorrow
                        </button>
                        <label>Or choose date:</label>
                        <input
                            type="date"
                            className={styles.datePickerInput}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className={styles.formRow}>
                        <label>Max Physical:</label>
                        <input type="number" value={maxPhysical} onChange={(e) => setMaxPhysical(e.target.value)} />
                        <label>Max Virtual:</label>
                        <input type="number" value={maxVirtual} onChange={(e) => setMaxVirtual(e.target.value)} />
                        <div className={styles.rightAligned}>
                            <button className={styles.primaryButton} onClick={handleSaveCapacity} disabled={loading}>
                                {loading ? "Saving..." : "Save Slot Limits"}
                            </button>
                        </div>

                    </div>

                </div>

                {/* Section 2: Working Hours */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>2. Set Working Hours</h3>
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
                                    All Doctors
                                </label>
                                <label className={styles.radioOption}>
                                    <input
                                        type="radio"
                                        value="selected"
                                        checked={target === "selected"}
                                        onChange={() => setTarget("selected")}
                                    />
                                    Selected Only
                                </label>
                            </div>
                        </div>

                    </div>
                    <div className={styles.formRow}>
                        <label>Start Time:</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        <label>End Time:</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                    <div className={styles.formRow}>
                        <label>Available Days:</label>
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
                            {loading ? "Saving..." : "Save Working Hours"}
                        </button>
                    </div>

                    {/* Section 3: Doctor Overview */}
                    <h3 className={styles.sectionTitle}>3. Doctor Overview</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {target === "selected" && <th>Select</th>}
                                <th>Name</th>
                                <th>Available Days</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Max Physical</th>
                                <th>Max Virtual</th>
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
