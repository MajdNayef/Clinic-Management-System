// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// for Guests
import Signup from "./Components/loginSign/Signup";
import Login from "./Components/loginSign/Login";
import HomePage from "./Components/HomePage/HomePage";
import GuestContactUs from "./Components/HomePage/GuestContactUs";

// for patient
import PatientDashboard from "./Components/Patient/PatientDashboard";
import AppointmentBooking from "./Components/Patient/AppointmentBooking";
import Services from "./Components/Patient/Services";
import HelpCenter from "./Components/CommonPages/HelpCenter";
import PatientProfilePage from "./Components/Patient/PatientProfilePage";
import MyAppointments from "./Components/Patient/MyAppointments";
import ContactUs from "./Components/CommonPages/ContactUs";
import LiveChat from "./Components/Patient/LiveChat";
//For doctors
import DoctorDashboard from "./Components/Doctors/DoctorDashboard";
import ViewAppointments from "./Components/Doctors/ViewAppointments";
import Test from "./Components/Doctors/layout/DashboardLayout";
import DoctorProfilePage from "./Components/Doctors/DoctorProfilePage";


// import axios from 'axios';

// axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// axios.defaults.headers.common.Authorization =
//   `Bearer ${localStorage.getItem('token') || ''}`;


function App() {
  return (
    <Router>
      <Routes>
        {/* Public / Guests routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/GuestContactUs" element={<GuestContactUs />} />

        {/* Protected / patient routes */}
        <Route path="/PatientDashboard" element={<PatientDashboard />} />
        <Route path="/book" element={<AppointmentBooking />} />
        <Route path="/MyAppointments" element={<MyAppointments />} />
        <Route path="/PatientProfilePage" element={<PatientProfilePage />} />
        <Route path="/LiveChat" element={<LiveChat />} />
        <Route path="/Services" element={<Services />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/HelpCenter" element={<HelpCenter />} />

        {/* Protected / Doctors routes */}
        <Route path="/DoctorDashboard" element={<DoctorDashboard />} />
        <Route path="/ViewAppointments" element={<ViewAppointments />} />
        <Route path="/DoctorProfilePage" element={<DoctorProfilePage />} />

        {/* Catch‐all → redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
