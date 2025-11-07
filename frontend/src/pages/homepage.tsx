import React from "react";
import "../styles/pages/homepage.css";

export default function Homepage() {
  return (
    <div className="homepage">
      {/* ===== 1) HERO ===== */}
      <section className="section hero">
        <div className="hero-overlay">
          <div className="container hero-content">
            <p className="heading1">Sign In</p>
            <p className="bodytext">
              We prioritize tagging sea turtles to gather vital data for conservation.
            </p>
          </div>
        </div>
      </section>

      {/* ===== 2) GALLERY ===== THIS NEEDS WORK*/}
      <section className="section gallery">
        <div className="container">
          <p className="heading2 mb-4">Gallery</p>
          {/* <Gallery images={...} />  ← plug in when you’re ready */}
          <div className="card demo-card">
            <p className="bodytext">[Gallery goes here]</p>
          </div>
        </div>
      </section>

      {/* ===== 3) ISLANDS (background image + 6 white squares) ===== */}
      <section className="section islands">
        <div className="islands-bg">
          <div className="container">
            <div className="islands-header">
              <p className="heading2">Research Islands</p>
              <p className="bodytext dim">
                Six sites used as collection/observation areas.
              </p>
            </div>

            <div className="islands-grid">
              {["Island 1","Island 2","Island 3","Island 4","Island 5","Island 6"].map(name => (
                <div key={name} className="island-tile">
                  <div className="island-icon">🧭</div>
                  <span className="island-label">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4) INFO CARDS (optional, like Nicepage) ===== */}
      <section className="section info">
        <div className="container info-grid">
          <div className="card">
            <p className="heading3">Turtle</p>
            <p className="bodytext">Our research focuses on tagging turtles in Colombia.</p>
          </div>
          <div className="card">
            <p className="heading3">About Us</p>
            <p className="bodytext">A team dedicated to marine tracking and conservation.</p>
          </div>
          <div className="card">
            <p className="heading3">Island 1</p>
            <p className="bodytext">Tagging turtles in coastal sites of Colombia.</p>
          </div>
          <div className="card">
            <p className="heading3">Island 2</p>
            <p className="bodytext">Navigation and exploration of sea turtle habitats.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
