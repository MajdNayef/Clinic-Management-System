import React, { useState } from 'react'
import {
  FiBell,
  FiUser,
  FiClipboard,
  FiCalendar,
  FiInfo,
  FiSettings,
} from 'react-icons/fi'
import MedconnectLogo from '../../Assets/MedconnectLogo.png'
import Chatbot from '../../Chats/ChatBot'
import styles from './dashboardLayout.module.css'


const DashboardLayout = ({ children }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)

  console.log(styles);

  return (
    <div className={styles.dashboardWrapper}>
      {/* Header */}
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <img
            src={MedconnectLogo}
            alt="MedConnect Logo"
            className={styles.logoImg}
          />
          <h1>MedConnect</h1>
        </div>
        <nav className={styles.navLinks}>
          <a className={styles.active} href="#">
            Dashboard
          </a>
          <a href="#">Services</a>
          <a href="#">Help Center</a>
          <a href="#">Contact Us</a>
        </nav>
        <div className={styles.headerControls}>
          <button className={styles.logoutButton}>Logout</button>
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
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarProfile}>
            <div className={styles.sidebarHeaderRow}>
              <div className={styles.greeting}>Good Morning, Dr.</div>
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
                      <li>💉 Your Appointment with Patient Ahmed has been rescheduled</li>
                      {/* <li>📧 New message from support</li>
                      <li> Annual check-up reminder</li> */}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.profileDetails}>
              <div className={styles.avatarCircle}>
                <FiUser size={20} />
              </div>
              <div className={styles.profileText}>
                <div className={styles.username}>Majd </div>
                <div className={styles.userEmail}>MajdNayef@gmail.com</div>
              </div>
            </div>

            <hr className={styles.sidebarDivider} />
          </div>

          <nav className={styles.sidebarNav}>
            <a className={styles.active} href="#">
              <FiInfo size={16} /> Overview
            </a>
            <a href="#">
              <FiClipboard size={16} /> View Schedule
            </a>
            <a href="#">
              <FiCalendar size={16} /> Manage Appointments
            </a>
          </nav>

          <div className={styles.sidebarFooter}>
            <a href="#">
              <FiSettings size={16} /> My profile
            </a>
            <div className={styles.notificationToggle}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiBell size={16} /> Email Notification
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.dashboardMain}>{children}</main>
      </div>

      <footer
        className={styles.dashboardFooter}
        onClick={() => setShowChatbot(!showChatbot)}
      >
        Need Help ? 💬
      </footer>

      {/* Chatbot */}

      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </div>
  )
}

export default DashboardLayout