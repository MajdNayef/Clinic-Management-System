// src/Components/Doctor/ProfilePage.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Edit2, Save, X, Camera } from "react-feather";
import DashboardLayout from "./layout/DashboardLayout";
import ProfilePage from "../CommonPages/ProfilePage"; // Ensure this is the only declaration of ProfilePage
import styles from "./css/ProfilePage.module.css";
import toast from "react-hot-toast";

const DoctorProfilePage = () => {

  return (
    <DashboardLayout>
      <ProfilePage />
    </DashboardLayout>
  );
};

export default DoctorProfilePage;
