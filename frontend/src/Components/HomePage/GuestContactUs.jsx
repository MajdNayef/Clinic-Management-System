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
                            <p>123 Health Street, Al Nakheel District, Medinah, Saudi Arabia</p>
                        </div>
                    </div>
                    <div className={styles.mapContainer}>
                        <h3>Clinic Location</h3>
                        <iframe
                            title="Clinic Location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3630.8143522730757!2d39.62500285933744!3d24.491888478262545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15bdbf99191c3081%3A0x9c4a2e5b638155ec!2z2YXYrNmF2Lkg2KfZhNi32Kgg2KfZhNmF2KrZhdmK2LIg2KfZhNi32KjZig!5e0!3m2!1sar!2smy!4v1748242571068!5m2!1sar!2smy"
                            width="100%"
                            height="250"
                            style={{ border: 0, borderRadius: "8px", marginTop: "1rem" }}
                            allowFullScreen=""
                            loading="lazy"
                        />
                    </div>


                </div>
            </div>
        </div >
    );
};

export default GuestContactUs;
