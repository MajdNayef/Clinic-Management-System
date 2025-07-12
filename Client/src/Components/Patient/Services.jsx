// src/Components/Patient/Services.jsx
import React, { useState, useEffect } from "react";
import { ChevronDown, User } from "react-feather";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/services.module.css";
import { useTranslation } from 'react-i18next';

export default function Services() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState([]);
  const [expanded, setExpanded] = useState(null);

  // 1️⃣ Fetch doctors, group by specialization
  useEffect(() => {
    axios.get("/api/doctors")
      .then(({ data }) => {
        const bySpec = data.reduce((acc, d) => {
          const spec = d.specialization;
          if (!acc[spec]) acc[spec] = [];
          acc[spec].push({
            id: d._id,
            name: t('services.doctorName', { first: d.first_name, last: d.last_name }),
            initials: d.first_name[0] + d.last_name[0],
            credentials: d.bio || "",
            status: t('services.available'),          // or derive from another API
            next: "TBD"                 // placeholder
          });
          return acc;
        }, {});

        // turn into an array
        setDepartments(Object.entries(bySpec).map(([spec, docs]) => ({
          id: spec.toLowerCase().replace(/\s+/g, "-"),
          name: spec,
          icon: <User />,            // you can swap icons per spec if you like
          description: t('services.departmentDescription', { department: spec }),
          doctors: docs
        })));
      })
      .catch(console.error);
  }, []);

  return (
    <DashboardLayout>
      <div className={styles.servicesSection}>
        <h1 className={styles.pageTitle}>{t('services.ourMedicalDepartments')}</h1>
        <p className={styles.pageIntro}>{t('services.pageIntro')}</p>

        <div className={styles.departmentGrid}>
          {departments.map((d) => (
            <motion.div
              key={d.id}
              layout
              className={styles.departmentCard}
              onClick={() => setExpanded(expanded === d.id ? null : d.id)}
            >
              <div className={styles.header}>
                <div className={styles.icon}>{d.icon}</div>
                <h2 className={styles.name}>{d.name}</h2>
                <ChevronDown
                  className={`${styles.chevron} ${expanded === d.id ? styles.rotated : ""}`}
                />
              </div>

              <AnimatePresence initial={false}>
                {expanded === d.id && (
                  <motion.div
                    className={styles.content}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className={styles.description}>{d.description}</p>
                    <div className={styles.doctorsGrid}>
                      {d.doctors.map((doc) => (
                        <div key={doc.id} className={styles.doctorCard}>
                          <div className={styles.avatar}>{doc.initials}</div>
                          <div className={styles.info}>
                            <h3>{doc.name}</h3>
                            <p className={styles.credentials}>{doc.credentials}</p>
                            <p>
                              <span className={styles.available}>{doc.status}</span> &nbsp;
                              <small>{t('services.next')}: {doc.next}</small>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
