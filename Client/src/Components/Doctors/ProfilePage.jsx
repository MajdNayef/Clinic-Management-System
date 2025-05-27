// src/Components/Doctor/ProfilePage.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Edit2, Save, X, Camera } from "react-feather";
import DashboardLayout from "../Doctors/layout/DashboardLayout";
import styles from "./css/ProfilePage.module.css";
import toast from "react-hot-toast";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);

  // when the user picks a file:

  // userData holds the “source of truth” from the server
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    profileImage: "/placeholder.svg",
  });

  // formData holds the in-flight edits
  const [formData, setFormData] = useState({ ...userData });
  const fileInputRef = useRef(null);


  // NEW: upload avatar **first**, then save other fields
  const handleAvatarUpload = async file => {
    const data = new FormData();
    data.append("avatar", file);
    const res = await axios.post("/api/auth/me/avatar", data, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data.url; // the URL returned by your server
  };


  // 1️⃣ Fetch real profile on mount
  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then(({ data }) => {
        const unified = {
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone_number,
          address: data.address,
          profileImage: data.profile_image || "/placeholder.svg",
        };
        setUserData(unified);
        setFormData(unified);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load profile");
      });
  }, []);

  // 2️⃣ Handlers
  const handleEditToggle = () => {
    setIsEditing(true);
    setFormData(userData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(userData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleImageChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      // 1) upload to /api/auth/me/avatar
      const url = await handleAvatarUpload(file);
      // 2) update local form state with the new URL
      setFormData(f => ({ ...f, profileImage: url }));
    } catch (err) {
      console.error(err);
      toast.error("Could not upload avatar");
    }
  };


  // 3️⃣ Save back to server

  const handleSave = async () => {
    try {
      // No more Base64 in formData.profileImage—
      // it's now a small URL string returned by your avatar endpoint.
      await axios.put("/api/auth/me", {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        address: formData.address,
        profile_image: formData.profileImage,
      });
      setUserData(formData);
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

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
              <button onClick={handleCancel} className={styles.cancelBtn}>
                <X size={16} /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className={styles.profileContent}>
          <div className={styles.avatarSection}>
            {/* <img
              src={formData.profileImage}
              alt="avatar"
              className={styles.avatarImg}
            /> */}

            <img
              src={`${API_BASE}${formData.profileImage}`}
              alt="avatar"
              className={styles.avatarImg}
            />

            {isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className={styles.cameraBtn}
                >
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
  );
};

export default ProfilePage;
