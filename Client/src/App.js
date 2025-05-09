// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// for users
import Signup from "./Components/loginSign/Signup";
import Login from "./Components/loginSign/Login";
import HomePage from "./Components/HomePage/HomePage";

// for patient
import PatientDashboard from "./Components/Patient/PatientDashboard";
import AppointmentBooking from "./Components/Patient/AppointmentBooking";
import Services from "./Components/Patient/Services";
import HelpCenter from "./Components/Patient/HelpCenter";
import Profile from "./Components/Patient/ProfilePage";
import MyAppointments from "./Components/Patient/MyAppointments";
import ContactUs from "./Components/Patient/ContactUs";
import LiveChat from "./Components/Patient/LiveChat";

//For doctors
import DoctorDashboard from "./Components/Doctors/DoctorDashboard";
import ViewAppointments from "./Components/Doctors/ViewAppointments";
import Test from "./Components/Doctors/layout/DashboardLayout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public / user routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected / patient routes */}
        <Route path="/PatientDashboard" element={<PatientDashboard />} />
        <Route path="/book" element={<AppointmentBooking />} />
        <Route path="/MyAppointments" element={<MyAppointments />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/LiveChat" element={<LiveChat />} />
        <Route path="/Services" element={<Services />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/HelpCenter" element={<HelpCenter />} />

        {/* Protected / Doctors routes */}
        <Route path="/DoctorDashboard" element={<DoctorDashboard />} />
        <Route path="/ViewAppointments" element={<ViewAppointments />} />

        {/* Catch‐all → redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
