import React from 'react';
import './About.css';

export default function About() {  
  return (
    <main className="section">
      {/* hero */}
      <div className="container">
        <div className="hero-content">
          <p className="heading1">About Us</p>
          <p className="bodytext hero-text">
            SEAtech Research Initiative is a student-led interdisciplinary team developing low-cost, open-source tools for marine wildlife tracking. Formed from a university course and now operating as an interdisciplinary campus research club, we unite CS, GIS, and marine biology students 
            to build a complete sensor-to-map system for sea turtles in the San Andrés Archipelago. Our work focuses on expanding access to affordable telemetry 
            and advancing geospatial intelligence for conservation.
          </p>
        </div>
      </div>

      {/* mission / vision statement */}
      <div className="mission-section">
        <div className="container">
          {/*  group photo */}
          <div className="group-photo-container">
            <img 
              src="/images/Photos/group-kitten.png" 
              alt="Team Group Photo" 
              className="group-photo-image"
            />
          </div>

          <div className="mission-grid">
            <div className="card">
              <h2 className="heading2">Our Mission</h2>
              <p className="bodytext">
                Our mission is to build accessible, low-cost tracking sensors and mapping systems that support science, conservation, and interdisciplinary student research.
              </p>
            </div>
            <div className="card">
              <h2 className="heading2">Our Vision</h2>
              <p className="bodytext">
                Our vision is to foster a collaborative space where students of all disciplines grow, innovate, and work together to develop impactful solutions for marine conservation
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* values */}
      <div className="container values-section">
        <h2 className="heading2 text-center">Our Purpose</h2>
        <div className="values-grid">
          <div className="card value-card">
            <div className="value-icon">
              <span>🌊</span>
            </div>
            <h3 className="heading3">[Accessible Innovation]</h3>
            <p className="bodytext">
              We develop open, affordable, and easy-to-build tracking systems that make wildlife monitoring possible for organizations of all sizes.
            </p>
          </div>
          <div className="card value-card">
            <div className="value-icon">
              <span>🐢</span>
            </div>
            <h3 className="heading3">[Interdisciplinary Collaboration]</h3>
            <p className="bodytext">
              We work across computer science, GIS, marine biology, and international research partners to build tools grounded in real field needs.
            </p>
          </div>
          <div className="card value-card">
            <div className="value-icon">
              <span>☀️</span>
            </div>
            <h3 className="heading3">[Science for Conservation Impact]</h3>
            <p className="bodytext">
              Every sensor, map, and dataset we create is designed to support actionable decisions that protect endangered sea turtles and the ecosystems they depend on.
            </p>
          </div>
        </div>
      </div>


      {/* groups */}
      <div className="team-section">
        <div className="container">
          <h2 className="heading2 text-center">Meet the Team</h2>
          <p className="bodytext text-center team-intro">
            SEAtech Research Initiative
          </p>

          
          {/* Computer Science / Engineering Team */}
          <div className="team-group-card">
            <h3 className="heading3 text-center">Computer Science / Engineering Team</h3>
            <div className="team-grid">
              <div className="team-member">
                <img
                  className="team-photo"
                  src="/images/people/bella-felipe-avatar.jpg"
                  alt="Bella Felipe"
                />
                <h4 className="member-name">Bella Felipe</h4>
                <p className="member-role">[Full Stack Lead]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Julian Lozada</h4>
                <p className="member-role">[Backend Lead]</p>
              </div>

              <div className="team-member">
                <img
                  className="team-photo"
                  src="/images/people/christine-nguyen-avatar.jpg"
                  alt="Christine Nguyen"
                />
                <h4 className="member-name">Christine Nguyen</h4>
                <p className="member-role">[President]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Tyra Quiachon</h4>
                <p className="member-role">[Vice President]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Max Woodruff</h4>
                <p className="member-role">[Research Lead]</p>
              </div>
            </div>
          </div>


          {/* Marine Biology */}
          <div className="team-group-card">
            <h3 className="heading3 text-center">Marine Biology Team</h3>
            <div className="team-grid">
              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Mik Kosoy</h4>
                <p className="member-role">[Vice President]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Dianna Zamora</h4>
                <p className="member-role">[Social Media Coordinator]</p>
              </div>
            </div>
          </div>


          {/* GEO/GIS */}
          <div className="team-group-card">
            <h3 className="heading3 text-center">GEO/GIS Team</h3>
            <div className="team-grid">
              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Ashlee Campbell</h4>
                <p className="member-role">[Vice President]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Alex Cervantes</h4>
                <p className="member-role">[GIS Lead]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Marlon Flores</h4>
                <p className="member-role">[General Officer]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Jeslyn Martinez</h4>
                <p className="member-role">[Secretary]</p>
              </div>
              
              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Lorena Robles</h4>
                <p className="member-role">[General Officer]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Carina</h4>
                <p className="member-role">[General Officer]</p>
              </div>
            </div>
          </div>

          {/* Advisors */}
          <div className="team-group-card">
            <h3 className="heading3 text-center">Advisors</h3>
            <div className="team-grid">
              <div className="team-member">
                <img
                  className="team-photo"
                  src="/images/people/alex-modaressi-avatar.png"
                  alt="Alex Modaressi"
                />
                <h4 className="member-name">Alex Modaressi, Ph.D.</h4>
                <p className="member-role">[Department of Computer Science]</p>
              </div>

              <div className="team-member">
                <img
                  className="team-photo"
                  src="/images/people/mario-giraldo-avatar.jpg"
                  alt="Mario Giraldo"
                />
                <h4 className="member-name">Mario Giraldo, Ph.D.</h4>
                <p className="member-role">[Geography and Environmental Studies]</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      

      {/* stats (?) */}
      <div className="container stats-section">
        <div className="card stats-card">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">[4]</div>
              <p className="stat-label">[Sensors]</p>
            </div>
            <div className="stat-item">
              <div className="stat-number">[0]</div>
              <p className="stat-label">[Turtle]</p>
            </div>
          </div>
        </div>
      </div>


      {/* sponsors (lol) */}
      <div className="partners-section">
        <div className="container">
          <h2 className="heading2 text-center">Our Partners</h2>
          <p className="bodytext text-center">
            OKAY SPONSORS 🤏
          </p>
          
          <div className="card partners-card">
            <div className="partners-grid">
              <div className="partner-logo">
                <span>[SHEIN]</span>
              </div>
              <div className="partner-logo">
                <span>[ALIEXPRESS]</span>
              </div>
              <div className="partner-logo">
                <span>[TEMU]</span>
              </div>
              <div className="partner-logo">
                <span>[ALIBABA]</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* links/contact/etc.. */}
      <div className="container cta-section">
        <div className="card cta-card">
          <h2 className="heading2 text-center">Join Us on Our Journey</h2>
          <p className="bodytext text-center cta-text">
          </p>
          <div className="cta-buttons">
            <button className="btn btn-primary">[Primary CTA]</button>
            <button className="btn btn-secondary">[Secondary CTA]</button>
          </div>
        </div>
      </div>
    </main>
  );
}
