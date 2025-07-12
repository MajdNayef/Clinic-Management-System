import React, { useState, useEffect } from 'react';
import {
  FiBell, FiUser, FiClipboard, FiCalendar, FiInfo, FiSettings,
} from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import axios from 'axios';

import MedconnectLogo from '../../Assets/MedconnectLogo.png';
import Chatbot from '../../CommonPages/ChatBot';
import LanguageSelector from '../../CommonPages/LanguageSelector';
import styles from './dashboardLayout.module.css';

axios.defaults.baseURL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DashboardLayout = ({ children }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [user, setUser] = useState(null);          // ← live profile
  const { t } = useTranslation();

  /* ─── Load profile once on mount ──────────────────────────────── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      jwtDecode(token);   // just validates the structure
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      axios.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token')); // invalid / expired
    } catch {
      localStorage.removeItem('token');
    }
  }, []);

  /*  Greeting based on clock  */
  const greet = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.goodMorning');
    if (h < 18) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  })();

  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Guest';
  const firstName = user ? user.first_name : 'Guest';

  return (
    <div className={styles.dashboardWrapper}>
      {/* Header */}
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <img src={MedconnectLogo} alt="MedConnect Logo" className={styles.logoImg} />
          <h1>MedConnect</h1>
        </div>

        <nav className={styles.navLinks}>
          <NavLink
            to="#"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {t('common.dashboard')}
          </NavLink>
          {/* <NavLink
            to="/Services"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Services
          </NavLink> */}
          {/* <NavLink
            to="/HelpCenter"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Help Center
          </NavLink> */}
          {/* <NavLink
            to="/ContactUs"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Contact Us
          </NavLink> */}
        </nav>

        <div className={styles.headerControls}>
          <button
            className={styles.logoutButton}
            onClick={() => { localStorage.removeItem('token'); window.location = '/'; }}
          >
            {t('common.logout')}
          </button>
          <LanguageSelector className={styles.languageSelector} />
        </div>
      </header>

      {/* Body */}
      <div className={styles.dashboardBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarProfile}>
            <div className={styles.sidebarHeaderRow}>
              <div className={styles.greeting}>{greet}, Mr.</div>
              <div style={{ position: 'relative' }}>
                <FiBell
                  className={styles.sidebarBell}
                  size={18}
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ cursor: 'pointer' }}
                />
                {showNotifications && (
                  <div className={styles.notificationPopup}>
                    <h4>{t('dashboard.notifications')}</h4>
                    <ul className={styles.notificationList}>
                      <li>💉 Your appointment was rescheduled</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.profileDetails}>
              <div className={styles.avatarCircle}>
                {user?.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={fullName}
                    className={styles.avatarImg}
                  />
                ) : (
                  <FiUser size={20} />
                )}
              </div>
              <div className={styles.profileText}>
                <div className={styles.username}>{user?.first_name || 'Unknown'}</div>
                <div className={styles.userEmail}>{user?.email || 'Unkownen@gmail.com'}</div>
              </div>
            </div>

            <hr className={styles.sidebarDivider} />
          </div>

          <nav className={styles.sidebarNav}>
            <NavLink
              to="/AdminDashboard"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiInfo size={16} /> {t('admin.overview')}
            </NavLink>

            <NavLink
              to="/ManageUsers"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiClipboard size={16} /> {t('admin.manageUsers')}
            </NavLink>

            <NavLink
              to="/ManageAppointments"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiCalendar size={16} /> {t('admin.manageAppointments')}
            </NavLink>

            <NavLink
              to="/ClinicCapacityManager"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiUser size={16} /> {t('admin.clinicCapacity')}
            </NavLink>

            <NavLink
              to="/ReportsManagerPage"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiClipboard size={16} /> {t('admin.reportsAndAnalyticsSidebar')}
            </NavLink>
          </nav>

          <div className={styles.sidebarFooter}>
            <NavLink
              to="/AdminProfilePage"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiSettings size={16} /> {t('common.myProfile')}
            </NavLink>

            <div className={styles.notificationToggle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiBell size={16} /> {t('common.emailNotification')}
              </div>
              <label className={styles.switch}>
                <span className={styles.slider} />
              </label>
            </div>
          </div>
        </aside>

        <main className={styles.dashboardMain}>{children}</main>
      </div>

      <footer className={styles.dashboardFooter} onClick={() => setShowChatbot(!showChatbot)}>
        {t('common.needHelp')}
      </footer>

      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </div>
  );
};

export default DashboardLayout;
