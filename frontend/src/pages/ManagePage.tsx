import React from "react";
import RegisterSensorForm from "../components/RegisterSensorForm/RegisterSensorForm";

export default function ManagePage() {
  return (
    <div className="section">
      <div className="container">
        <p className="heading1">Manage Dashboard</p>
        <p className="bodytext">Manage your sensors and data when logged in.</p>

        <div style={{ marginTop: "2rem" }}>
          <RegisterSensorForm />
        </div>
      </div>
    </div>
  );
}

