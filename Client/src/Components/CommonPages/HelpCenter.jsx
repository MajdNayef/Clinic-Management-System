// src/Components/HelpCenter.jsx

import React, { useState, useEffect } from "react";
import {
    ChevronDown,
    Search,
    MessageCircle,
    Mail,
    Phone,
} from "react-feather";
import DashboardLayout from "../Patient/layout/DashboardLayout";
import styles from "./css/helpCenter.module.css";

// Import the shared data module
import { faqData, getAllFAQs } from "./data/faqData";
import { useTranslation } from 'react-i18next';

const HelpCenter = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("general");
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const [filteredQuestions, setFilteredQuestions] = useState([]);

    // On mount: initialize expandedQuestions (all false) and show “general” questions
    useEffect(() => {
        const initialExpansion = {};
        Object.keys(faqData).forEach((cat) => {
            faqData[cat].forEach((q) => {
                initialExpansion[q.id] = false;
            });
        });
        setExpandedQuestions(initialExpansion);

        // Initially, show all “general” questions
        setFilteredQuestions(faqData.general);
    }, []);

    // When searchQuery changes, filter across all categories
    useEffect(() => {
        const trimmed = searchQuery.trim().toLowerCase();
        if (!trimmed) {
            // If no search text, just show whichever category is active
            setFilteredQuestions(faqData[activeCategory]);
        } else {
            // Otherwise, filter every question/answer across all categories
            const all = getAllFAQs();
            const filtered = all.filter(
                (q) =>
                    q.question.toLowerCase().includes(trimmed) ||
                    q.answer.toLowerCase().includes(trimmed)
            );
            setFilteredQuestions(filtered);
        }
    }, [searchQuery, activeCategory]);

    const toggleQuestion = (id) => {
        setExpandedQuestions((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const getCategoryTitle = (categoryKey) => {
        const titles = {
            general: t('faq.general'),
            appointments: t('faq.appointments'),
            account: t('faq.account'),
            payments: "Payments & Billing",
            technical: "Technical Support",
        };
        return titles[categoryKey] || categoryKey;
    };

    return (
        <DashboardLayout>
            <div className={styles.faqWrapper}>
                <div className={styles.faqHeader}>
                    <h1>{t('faq.title')}</h1>
                    <p>{t('faq.subtitle')}</p>
                    <hr className={styles.sectionDivider} />

                    <div className={styles.faqSearchBox}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={t('faq.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.faqBody}>
                    {/* Sidebar: Categories */}
                    <div className={styles.faqSidebar}>
                        <h3>{t('faq.categories')}</h3>
                        {Object.keys(faqData).map((catKey) => (
                            <button
                                key={catKey}
                                className={`${styles.categoryBtn} ${activeCategory === catKey ? styles.active : ""
                                    }`}
                                onClick={() => {
                                    setActiveCategory(catKey);
                                    setSearchQuery(""); // clear search when switching category
                                }}
                            >
                                <ChevronDown size={14} />
                                {getCategoryTitle(catKey)}
                            </button>
                        ))}
                    </div>

                    {/* Main FAQ area */}
                    <div className={styles.faqMain}>
                        <h2>
                            {searchQuery
                                ? `Search Results`
                                : `${getCategoryTitle(activeCategory)}`}
                        </h2>

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
                            <p className={styles.noResult}>
                                No questions matched your search.
                            </p>
                        )}

                        <div className={styles.faqContactBox}>
                            <h3>{t('faq.stillNeedHelp')}</h3>
                            <a href="#">
                                <MessageCircle size={16} /> {t('faq.openChatBot')}
                            </a>
                            <hr />
                            <p>{t('faq.orContactUs')}</p>
                            <ul>
                                <li>
                                    <Mail size={16} /> support@medconnect.com
                                </li>
                                <li>
                                    <Phone size={16} /> +1-800-555-1234
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HelpCenter;
