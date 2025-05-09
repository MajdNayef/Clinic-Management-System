// src/Components/FAQ.jsx
import React, { useState, useEffect } from "react";
import {
    ChevronDown,
    Search,
    MessageCircle,
    Mail,
    Phone,
    Plus,
} from "react-feather";
import styles from "./css/helpCenter.module.css";
import DashboardLayout from "./layout/DashboardLayout";

const FAQ = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("general");
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const [filteredQuestions, setFilteredQuestions] = useState([]);

    const faqData = {
        general: [
            {
                id: "g1",
                question: "What is MedConnect?",
                answer:
                    "MedConnect is a healthcare platform that connects patients with healthcare providers for appointments, consultations, and records management.",
            },
            {
                id: "g2",
                question: "Is MedConnect free to use?",
                answer:
                    "Yes, MedConnect is free for patients. Certain services or consultations may have associated costs.",
            },
        ],
        appointments: [
            {
                id: "a1",
                question: "How do I book an appointment?",
                answer:
                    "Login and navigate to 'Book Appointment'. Choose doctor, time and confirm.",
            },
            {
                id: "a2",
                question: "Can I reschedule my appointment?",
                answer:
                    "Yes, go to 'My Appointments' and choose 'Reschedule' for the desired booking.",
            },
        ],
        account: [
            {
                id: "ac1",
                question: "How do I change my email address?",
                answer:
                    "Go to 'My Profile' > 'Account Settings', and click on 'Edit Email'. You’ll receive a verification link.",
            },
            {
                id: "ac2",
                question: "Can I delete my MedConnect account?",
                answer:
                    "Yes, contact support via email or chat to initiate the deletion process.",
            },
            {
                id: "ac3",
                question: "How do I enable dark mode?",
                answer:
                    "Click the profile icon > 'Appearance Settings' > 'Dark Mode'.",
            },
        ],
    };

    useEffect(() => {
        const initial = {};
        Object.keys(faqData).forEach((cat) => {
            faqData[cat].forEach((q) => (initial[q.id] = false));
        });
        setExpandedQuestions(initial);
        setFilteredQuestions(getAllQuestions());
    }, []);

    const getAllQuestions = () => Object.values(faqData).flat();

    useEffect(() => {
        if (!searchQuery.trim()) return setFilteredQuestions(getAllQuestions());
        setFilteredQuestions(
            getAllQuestions().filter(
                (q) =>
                    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    q.answer.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    }, [searchQuery]);

    const toggleQuestion = (id) => {
        setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const getCategoryTitle = (category) => {
        const titles = {
            general: "General Questions",
            appointments: "Appointments",
            payments: "Payments & Billing",
            technical: "Technical Support",
            account: "Account Settings",
        };
        return (
            titles[category] || category.charAt(0).toUpperCase() + category.slice(1)
        );
    };

    return (
        <DashboardLayout>
            <div className={styles.faqWrapper}>
                <div className={styles.faqHeader}>
                    <h1>FAQs</h1>
                    <p>Your questions answered. Browse or search for help below.</p>
                    <hr className={styles.sectionDivider} />

                    <div className={styles.faqSearchBox}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.faqBody}>
                    <div className={styles.faqSidebar}>
                        <h3>Categories</h3>
                        {Object.keys(faqData).map((key) => (
                            <button
                                key={key}
                                className={`${styles.categoryBtn} ${activeCategory === key ? styles.active : ""
                                    }`}
                                onClick={() => setActiveCategory(key)}
                            >
                                <Plus size={14} /> {getCategoryTitle(key)}
                            </button>
                        ))}
                    </div>

                    <div className={styles.faqMain}>
                        <h2>{
                            searchQuery ? "Search Results" : getCategoryTitle(activeCategory)
                        }</h2>

                        {filteredQuestions.length ? (
                            filteredQuestions.map((q) => (
                                <div key={q.id} className={styles.faqItem}>
                                    <div
                                        className={styles.faqQuestion}
                                        onClick={() => toggleQuestion(q.id)}
                                    >
                                        <span>{q.question}</span>
                                        <ChevronDown
                                            className={
                                                expandedQuestions[q.id] ? styles.rotate : ""
                                            }
                                        />
                                    </div>
                                    {expandedQuestions[q.id] && (
                                        <div className={styles.faqAnswer}>{q.answer}</div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className={styles.noResult}>No questions matched your search.</p>
                        )}

                        <div className={styles.faqContactBox}>
                            <h3>Still need help?</h3>
                            <a href=""><MessageCircle size={16} /> Open Chat Bot </a>
                            <hr />
                            <p>Or contact us via:</p>
                            <ul>
                                <li><Mail size={16} /> support@medconnect.com</li>
                                <li><Phone size={16} /> +1-800-555-1234</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
};

export default FAQ;