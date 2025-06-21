import React from "react";
import LiveChatTemplate from "../CommonPages/LiveChat";
import DashboardLayout from "./layout/DashboardLayout";

const PatientLiveChat = ({ doctorId, patientId }) => {
    return (
        <DashboardLayout>
            <LiveChatTemplate
                userType="patient"
                chatWith="doctor"
                doctorId={doctorId}
                patientId={patientId}
            />
        </DashboardLayout>
    );
};

export default PatientLiveChat;
