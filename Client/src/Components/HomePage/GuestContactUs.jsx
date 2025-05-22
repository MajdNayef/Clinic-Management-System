// src/Components/ContactUs.jsx
import React from "react";
import { Mail, Phone, MapPin, MessageCircle } from "react-feather";
import styles from "./guestContactUs.module.css";
import Header from './Header'

const GuestContactUs = () => {
    return (
        <div>
            <Header />
            <div className={styles.contactWrapper}>
                <div className={styles.contactHeader}>
                    <h1>Contact Us</h1>
                    <p>We’re here to help. Reach out to us through the following channels.</p>
                    <hr className={styles.sectionDivider} />
                </div>

                <div className={styles.contactBody}>


                    <div className={styles.contactItem}>
                        <Mail size={18} className={styles.icon} />
                        <div>
                            <h4>Email</h4>
                            <p>support@medconnect.com</p>
                        </div>
                    </div>

                    <div className={styles.contactItem}>
                        <Phone size={18} className={styles.icon} />
                        <div>
                            <h4>Phone</h4>
                            <p>+1-800-555-1234</p>
                        </div>
                    </div>

                    <div className={styles.contactItem}>
                        <MapPin size={18} className={styles.icon} />
                        <div>
                            <h4>Clinic Address</h4>
                            <p>123 Health Street, Al Nakheel District, Riyadh, Saudi Arabia</p>
                        </div>
                    </div>



                </div>
            </div>
        </div >
    );
};

export default GuestContactUs;
