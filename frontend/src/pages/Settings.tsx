import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/pages/Settings.css";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [role, setRole] = useState("researcher");

  const [notifications, setNotifications] = useState(true);
  const [turtleAlerts, setTurtleAlerts] = useState(true);

  const [favoriteIslands, setFavoriteIslands] = useState<string[]>([]);
  const [speciesInterest, setSpeciesInterest] = useState<string[]>([]);

  const islands = [
    "Isla Menor Cayo Roncador",
    "Isla Providencia y Santa Catalina",
    "Isla Menor Cayo Serrana",
    "Isla Menor Cayo Serranilla",
    "Isla Menor Cayo Bolivar",
    "Isla Menor Cayo Albuquerque"
  ];

  const species = [
    "Green Sea Turtle",
    "Hawksbill Turtle",
    "Loggerhead Turtle"
  ];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // !!need to implement save!!
    const settings = {
      profile: { displayName, bio, affiliation, role },
      notifications: { notifications, turtleAlerts },
      research: { favoriteIslands, speciesInterest }
    };
    console.log("Saving settings:", settings);
    alert("Settings saved successfully!");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      logout();
      navigate("/");
    }
  };

  const toggleIsland = (island: string) => {
    setFavoriteIslands(prev =>
      prev.includes(island)
        ? prev.filter(i => i !== island)
        : [...prev, island]
    );
  };

  const toggleSpecies = (sp: string) => {
    setSpeciesInterest(prev =>
      prev.includes(sp)
        ? prev.filter(s => s !== sp)
        : [...prev, sp]
    );
  };

  return (
    <div className="settings-page">
      <div className="settings-content">
        <h1 className="settings-title">User Settings</h1>
        <p className="settings-subtitle">Manage your account and research preferences</p>

        {/* profile info */}
        <div className="settings-card">
          <div className="card-header">
            <h2>👤 Information</h2>
          </div>
          <div className="card-body">
            <div className="profile-header">
              {user?.picture && (
                <div className="profile-picture-container">
                  <img src={user.picture} alt="Profile" className="profile-picture" />
                </div>
              )}
              <div className="profile-name-display">
                <h3>{displayName || user?.name || "User"}</h3>
                <p className="profile-email">{email}</p>
              </div>
            </div>
            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="form-input"
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  className="form-input"
                  disabled
                />
                <small className="form-hint">Cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="form-textarea"
                  placeholder="Tell us about your research interests..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="affiliation">Affiliation / Institution</label>
                <input
                  type="text"
                  id="affiliation"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="form-input"
                  placeholder="University, Organization, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-select"
                >
                  <option value="administrator">Administrator</option>
                  <option value="developer">Developer</option>
                  <option value="researcher">Researcher</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </form>
          </div>
        </div>

        {/* preferences */}
        <div className="settings-card">
          <div className="card-header">
            <h2>🔬 Research Preferences</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Favorite Islands</label>
              <p className="form-hint">Select Islands you wish to track</p>
              <div className="chip-container">
                {islands.map(island => (
                  <button
                    key={island}
                    type="button"
                    className={`chip ${favoriteIslands.includes(island) ? 'chip-active' : ''}`}
                    onClick={() => toggleIsland(island)}
                  >
                    {island}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Species of Interest</label>
              <p className="form-hint">Select turtle species you wish to follow</p>
              <div className="chip-container">
                {species.map(sp => (
                  <button
                    key={sp}
                    type="button"
                    className={`chip ${speciesInterest.includes(sp) ? 'chip-active' : ''}`}
                    onClick={() => toggleSpecies(sp)}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-card">
          <div className="card-header">
            <h2>🔔 Notification Preferences</h2>
          </div>
          <div className="card-body">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span>Enable push notifications</span>
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={turtleAlerts}
                  onChange={(e) => setTurtleAlerts(e.target.checked)}
                />
                <span>Get alerts for turtle sightings in favorite islands</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="save-button-container">
          <button onClick={handleSaveSettings} className="btn-primary btn-large">
            💾 Save All Settings
          </button>
        </div>

        <div className="bottom-buttons">
          <button onClick={() => navigate(-1)} className="btn-back">
            ← Back to Previous Page
          </button>
          
          <button onClick={handleDeleteAccount} className="btn-delete-simple">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}