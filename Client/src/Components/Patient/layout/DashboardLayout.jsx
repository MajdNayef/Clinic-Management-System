// src/Components/Patient/layout/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import {
  FiBell,
  FiUser,
  FiClipboard,
  FiCalendar,
  FiInfo,
  FiSettings,
} from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';              // ← named import
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import MedconnectLogo from '../../Assets/MedconnectLogo.png';
import Chatbot from '../../CommonPages/ChatBot';
import styles from './dashboardLayout.module.css';

axios.defaults.baseURL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DashboardLayout = ({ children }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [user, setUser] = useState(null);
  const [greet, setGreet] = useState('Hello');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      jwtDecode(token);                           // validate format
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      axios.get('/api/auth/me').then(res => setUser(res.data));
    } catch {
      // invalid token
    }
  }, []);

  useEffect(() => {
    const hr = new Date().getHours();
    setGreet(hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Guest';

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
            to="/PatientDashboard"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/Services"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Services
          </NavLink>
          <NavLink
            to="/HelpCenter"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Help Center
          </NavLink>
          <NavLink
            to="/ContactUs"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Contact Us
          </NavLink>
        </nav>

        <div className={styles.headerControls}>
          <button
            className={styles.logoutButton}
            onClick={() => {
              localStorage.removeItem('token');
              window.location = '/';
            }}
          >
            Logout
          </button>
          <div className={styles.languageSelector}>
            <select>
              <option>English</option>
              <option>العربية</option>
            </select>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className={styles.dashboardBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarProfile}>
            <div className={styles.sidebarHeaderRow}>
              <div className={styles.greeting}>
                {greet}, {fullName.split(' ')[0]}
              </div>
              <div style={{ position: 'relative' }}>
                <FiBell
                  className={styles.sidebarBell}
                  size={18}
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ cursor: 'pointer' }}
                />
                {showNotifications && (
                  <div className={styles.notificationPopup}>
                    <h4>🔔 Notifications</h4>
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
                <div className={styles.username}>{fullName}</div>
                <div className={styles.userEmail}>{user?.email || ''}</div>
              </div>
            </div>
            <hr className={styles.sidebarDivider} />
          </div>

          <nav className={styles.sidebarNav}>
            <NavLink
              to="/PatientDashboard"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiInfo size={16} /> Overview
            </NavLink>
            <NavLink
              to="/book"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiClipboard size={16} /> Book a new appointment
            </NavLink>
            <NavLink
              to="/MyAppointments"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiCalendar size={16} /> My Appointments
            </NavLink>
          </nav>

          <div className={styles.sidebarFooter}>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive
                  ? `${styles.sidebarLink} ${styles.active}`
                  : styles.sidebarLink
              }
            >
              <FiSettings size={16} /> My profile
            </NavLink>
            <div className={styles.notificationToggle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiBell size={16} /> Email Notification
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  defaultChecked={user?.notifications_enabled}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </aside>

        <main className={styles.dashboardMain}>{children}</main>
      </div>

      <footer
        className={styles.dashboardFooter}
        onClick={() => setShowChatbot(!showChatbot)}
      >
        Need Help ? 💬
      </footer>

      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </div>
  );
};

export default DashboardLayout;
