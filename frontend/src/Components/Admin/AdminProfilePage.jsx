// src/Components/Admin/ProfilePage.jsx
import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "./layout/DashboardLayout";
import ProfilePage from "../CommonPages/ProfilePage"; // Ensure this is the only declaration of ProfilePage

const AdminProfilePage = () => {

  return (
    <DashboardLayout>
      <ProfilePage />
    </DashboardLayout>
  );
};

export default AdminProfilePage;
