import React from "react";
import LiveChatTemplate from "../CommonPages/LiveChatTemplate";
import DashboardLayout from "./layout/DashboardLayout";

const DoctorLiveChat = ({ doctorId, patientId }) => {
    return (
        <DashboardLayout>
            <LiveChatTemplate
                userType="doctor"
                chatWith="Patient"
                doctorId={doctorId}
                patientId={patientId}
            />
        </DashboardLayout>
    );
};

export default DoctorLiveChat;
