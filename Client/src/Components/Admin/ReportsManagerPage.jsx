// pages/ReportsManagerPage.js
import React, { useState } from 'react';
import DashboardLayout from './layout/DashboardLayout';
import styles from './ReportsPages/reports.module.css';

import AppointmentReportsPage from './ReportsPages/AppointmentReports';
import DoctorPerformancePage from './ReportsPages/DoctorPerformancePage';
import AppointmentStatisticsPage from './ReportsPages/AppointmentStatisticsPage';

export default function ReportsManagerPage() {
    const [activeTab, setActiveTab] = useState('appointment');

    const renderContent = () => {
        switch (activeTab) {
            case 'appointment':
                return <AppointmentReportsPage />;
            case 'performance':
                return <DoctorPerformancePage />;
                case 'statistics':
                    return <AppointmentStatisticsPage />;
                default:
                return null;
        }
    };

    return (
        <DashboardLayout>
            <div className={styles.reportsContainer}>
                <h2 className={styles.title}>Reports & Analytics</h2><hr />
                <div className={styles.tabs}>
                    <button
                        className={activeTab === 'appointment' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('appointment')}
                    >
                        Appointment Reports
                    </button>
                    <button
                        className={activeTab === 'performance' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('performance')}
                    >
                        Doctor Performance
                    </button>
                    <button
                        className={activeTab === 'statistics' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('statistics')}
                    >
                        Appointment Statistics
                    </button>
                </div>

                <div className={styles.pageContent}>
                    {renderContent()}
                </div>
            </div>
        </DashboardLayout>
    );
}
