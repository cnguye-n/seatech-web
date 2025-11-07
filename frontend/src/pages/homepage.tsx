// src/pages/homepage.tsx
import React from 'react';
import '../styles/pages/homepage.css'; // page-specific styles

export default function Homepage() {
  return (
    <div className="homepage">
      {/* ===== HERO SECTION ===== */}
      <section className="section hero">
        <div className="container hero-content">
          <p className="heading1">Sign In</p>
          <p className="bodytext">
            We prioritize tagging sea turtles to gather vital data for conservation.
          </p>
        </div>
      </section>

      {/* ===== GALLERY SECTION ===== */}
      <section className="section gallery">
        <div className="container">
          <p className="heading2 mb-4">Gallery</p>
          <div className="card">
            <img
              src="/images/turtle-gallery.jpg"
              alt="Sea turtle swimming in coral reef"
              className="gallery-image"
            />
            <p className="bodytext">Join us in our mission to protect sea turtles in Colombia.</p>
          </div>
        </div>
      </section>

      {/* ===== ISLAND GRID SECTION ===== */}
      <section className="section islands">
        <div className="container">
          <p className="heading2 mb-6">Research Islands</p>
          <div className="island-grid">
            <div className="card">Island 1</div>
            <div className="card">Island 2</div>
            <div className="card">Island 3</div>
            <div className="card">Island 4</div>
            <div className="card">Island 5</div>
            <div className="card">Island 6</div>
          </div>
        </div>
      </section>

      {/* ===== INFO SECTION ===== */}
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

      {/* ===== CONTACT SECTION ===== */}
      <section className="section contact">
        <div className="container contact-form">
          <p className="heading2">Contact Us</p>
          <form className="card">
            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
            <textarea placeholder="Message" rows={4}></textarea>
            <button className="btn" type="submit">Send Message</button>
          </form>
        </div>
      </section>
    </div>
  );
}
