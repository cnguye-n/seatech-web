import React, { useState, FormEvent } from "react";
import UploadFileBox from "../UploadFileBox/UploadFileBox";
import "./RegisterSensorForm.css";
import { useAuth } from "../../auth/AuthContext";


const speciesOptions = [
  "Unknown",
  "Hawksbill",
  "Green",
  "Loggerhead",
  "Leatherback",
  "Olive Ridley",
  "Kemp's Ridley",
  "Flatback",
  "Unknown"
];

const sexOptions = ["Unknown", "Male", "Female"];

const islandOptions = [
  "Unknown",
  "San Andrés",
  "Providencia",
  "Santa Catalina",
  "Johnny Cay",
  "Albuquerque Cay",
  "Bolívar Cay",
  "Unknown"
];

const RegisterSensorForm: React.FC = () => {
  const { user } = useAuth();
  
  const [turtleId, setTurtleId] = useState("");
  const [species, setSpecies] = useState("Unknown");
  const [sex, setSex] = useState("Unknown");
  const [island, setIsland] = useState("Unknown");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Register Sensor (UI only):", {
      turtleId,
      species,
      sex,
      island,
    });
  };

  return (
    <form className="sensor-form card" onSubmit={handleSubmit}>
      {/* User data section */}
      <div className="sensor-banner">
        <p className="heading3">User Data</p>
        <p className="user-group-text">
          User Group: <strong>SEAtech Research Initiative</strong>
        </p>
        <p className="user-group-text">
            Email: {user?.email || "unknown"}
        </p>
      </div>

      <p className="heading3" style={{ marginTop: "1rem" }}>
        Register Sensor
      </p>    

      {/* Turtle ID */}
      <div className="sensor-form-row">
        <label className="sensor-label">
          Sea turtle ID (RAK ID on card)
          <input
            className="sensor-input"
            type="text"
            value={turtleId}
            onChange={(e) => setTurtleId(e.target.value)}
            placeholder="Ex: RAK-0012"
          />
        </label>
      </div>

      {/* Species + Sex */}
      <div className="sensor-form-row sensor-form-row-two">
        <label className="sensor-label">
          Species
          <select
            className="sensor-input"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          >
            {speciesOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="sensor-label">
          Sex
          <select
            className="sensor-input"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
          >
            {sexOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Island affiliation */}
      <div className="sensor-form-row">
        <label className="sensor-label">
          Island affiliation
          <select
            className="sensor-input"
            value={island}
            onChange={(e) => setIsland(e.target.value)}
          >
            {islandOptions.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Upload file */}
      <div className="sensor-form-row upload-section">
        <p className="heading3">Upload Sensor Data</p>
        <UploadFileBox
          accept=".csv"
          label="Upload sensor data"
          helperText="Drag & drop a CSV from your SD card, or click to browse."
          onUpload={(file) => console.log("Selected file:", file)}
        />
      </div>

      <div className="sensor-form-actions">
        <button type="submit" className="btn register-btn">
          Register Sensor
        </button>
      </div>
    </form>
  );
};

export default RegisterSensorForm;

