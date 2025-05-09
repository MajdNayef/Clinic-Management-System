import React, { useState, useRef } from "react"
import styles from "./css/ProfilePage.module.css"
import DashboardLayout from './layout/DashboardLayout';
import { Edit2, Save, X, Camera } from "react-feather"



const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    firstName: "Mohammed",
    lastName: "Ahmed",
    email: "mohammed.ahmed@example.com",
    phone: "+966 50 123 4567",
    address: "123 Al Nakheel District, Riyadh, Saudi Arabia",
    profileImage: "/placeholder.svg",
  })
  const [formData, setFormData] = useState({ ...userData })

  const fileInputRef = useRef(null)

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
    setFormData({ ...userData })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setFormData({ ...formData, profileImage: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    setUserData({ ...formData })
    setIsEditing(false)
  }


  return (
    <DashboardLayout>
      <div className={styles.profileWrapper}>
        <div className={styles.headerRow}>
          <h2>My Profile</h2>
          {!isEditing ? (
            <button onClick={handleEditToggle} className={styles.editBtn}>
              <Edit2 size={16} /> Edit
            </button>
          ) : (
            <div className={styles.editActions}>
              <button onClick={handleSave} className={styles.saveBtn}>
                <Save size={16} /> Save
              </button>
              <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}>
                <X size={16} /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className={styles.profileContent}>
          <div className={styles.avatarSection}>
            <img src={formData.profileImage} alt="avatar" className={styles.avatarImg} />
            {isEditing && (
              <>
                <button onClick={() => fileInputRef.current.click()} className={styles.cameraBtn}>
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className={styles.hiddenInput}
                />
              </>
            )}
          </div>

          <div className={styles.formSection}>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  disabled={!isEditing}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  disabled={!isEditing}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled={!isEditing}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  disabled={!isEditing}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                disabled={!isEditing}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ProfilePage
