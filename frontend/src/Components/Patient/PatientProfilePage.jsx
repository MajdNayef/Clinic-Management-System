// src/Components/Patient/ProfilePage.jsx

import DashboardLayout from "./layout/DashboardLayout";
import ProfilePage from "../CommonPages/ProfilePage"; // Ensure this is the only declaration of ProfilePage

const PatientProfilePage = () => {
  return (
    <DashboardLayout>
      <ProfilePage />
    </DashboardLayout>
  );
};

export default PatientProfilePage;
