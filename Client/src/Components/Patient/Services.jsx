import { useState } from "react"
import styles from "./css/services.module.css"
import {
  ChevronDown,
  Heart,
  Shield,
  User,
  Activity,
} from "react-feather"
import DashboardLayout from './layout/DashboardLayout';


const Services = () => {
  // const [expandedDept, setExpandedDept] = useState("cardiology")
  const [expandedDept, setExpandedDept] = useState("")

  const toggleDepartment = (deptId) => {
    setExpandedDept(expandedDept === deptId ? null : deptId)
  }

  return (
    <DashboardLayout>

      <div className="dashboard-container">
        <div className={styles.servicesSection}>
          <p className={styles.servicesIntro}>
            MedConnect offers a wide range of medical services across various specialties. Our team of experienced
            doctors provides high-quality healthcare services to meet your needs.
          </p>

          <div className={styles.departmentsList}>
            {departments.map((dept) => (
              <div
                key={dept.id}
                className={`${styles.departmentItem} ${expandedDept === dept.id ? styles.active : ""}`}
              >
                <div
                  className={styles.departmentHeader}
                  onClick={() => toggleDepartment(dept.id)}
                >
                  <div className={styles.departmentIcon}>{dept.icon}</div>
                  <h2 className={styles.departmentName}>{dept.name}</h2>
                  <button className={styles.departmentToggle}>
                    <ChevronDown size={20} color="#6B7280" />
                  </button>
                </div>

                <div
                  className={`${styles.departmentContent} ${expandedDept !== dept.id ? styles.collapsed : ""
                    }`}
                >
                  <p className={styles.departmentDescription}>{dept.description}</p>

                  <div className={styles.doctorsList}>
                    {dept.doctors.map((doc) => (
                      <div key={doc.name} className={styles.doctorCard}>
                        <div className={styles.doctorImage}>
                          <div className={styles.avatarPlaceholder}>{doc.initials}</div>
                        </div>
                        <div className={styles.doctorInfo}>
                          <h3 className={styles.doctorName}>{doc.name}</h3>
                          <p className={styles.doctorSpecialty}>{doc.specialty}</p>
                          <p className={styles.doctorCredentials}>{doc.credentials}</p>
                          <div className={styles.doctorAvailability}>
                            <span
                              className={`${styles.availabilityBadge} ${doc.status === "Available" ? styles.available : styles.busy
                                }`}
                            >
                              {doc.status}
                            </span>
                            <span className={styles.nextAvailable}>{doc.next}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>

  )
}

const departments = [
  {
    id: "cardiology",
    name: "Cardiology",
    icon: <Heart size={20} color="#3B82F6" />,
    description:
      "Our cardiology department specializes in diagnosing and treating heart conditions and cardiovascular diseases.",
    doctors: [
      {
        name: "Dr. Ahmed Hassan",
        initials: "AH",
        specialty: "Interventional Cardiologist",
        credentials: "MD, FACC - 15+ years experience in complex cardiac interventions",
        status: "Available",
        next: "Today, 2:00 PM",
      },
      {
        name: "Dr. Fatima Al-Sayed",
        initials: "FA",
        specialty: "Non-Invasive Cardiologist",
        credentials:
          "MD, PhD - Specializes in preventive cardiology and heart failure management",
        status: "Busy",
        next: "Tomorrow, 10:00 AM",
      },
    ],
  },
  {
    id: "neurology",
    name: "Neurology",
    icon: <User size={20} color="#3B82F6" />,
    description:
      "Our neurology department focuses on disorders of the nervous system, including the User, spinal cord, and peripheral nerves.",
    doctors: [
      {
        name: "Dr. Mohammed Al-Najjar",
        initials: "MN",
        specialty: "Neurologist",
        credentials:
          "MD, PhD - Specializes in movement disorders and neurodegenerative diseases",
        status: "Available",
        next: "Today, 4:30 PM",
      },
    ],
  },
  {
    id: "orthopedics",
    name: "Orthopedics",
    icon: <Activity size={20} color="#3B82F6" />,
    description:
      "Our orthopedics department specializes in the diagnosis and treatment of conditions affecting the musculoskeletal system.",
    doctors: [
      {
        name: "Dr. Khalid Al-Mansour",
        initials: "KM",
        specialty: "Orthopedic Surgeon",
        credentials: "MD, FRCSC - Specializes in joint replacement and sports medicine",
        status: "Available",
        next: "Tomorrow, 9:00 AM",
      },
      {
        name: "Dr. Layla Ibrahim",
        initials: "LI",
        specialty: "Orthopedic Specialist",
        credentials: "MD - Specializes in pediatric orthopedics and spinal disorders",
        status: "Busy",
        next: "Friday, 11:30 AM",
      },
    ],
  },
  {
    id: "dermatology",
    name: "Dermatology",
    icon: <Shield size={20} color="#3B82F6" />,
    description:
      "Our dermatology department specializes in the diagnosis and treatment of skin, hair, and nail conditions.",
    doctors: [
      {
        name: "Dr. Sara Khalid",
        initials: "SK",
        specialty: "Dermatologist",
        credentials:
          "MD, FAAD - Specializes in cosmetic dermatology and skin cancer treatment",
        status: "Available",
        next: "Today, 3:15 PM",
      },
    ],
  },
]

export default Services;
