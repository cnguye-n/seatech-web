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
            INTRO
          </p>
        </div>
      </div>

      {/* mission / vision statement */}
      <div className="mission-section">
        <div className="container">
          {/*  group photo */}
          <div className="group-photo-container">
            <img 
              src="/path-to-your-image.jpg" 
              alt="Team Group Photo" 
              className="group-photo-image"
            />
          </div>

          <div className="mission-grid">
            <div className="card">
              <h2 className="heading2">Our Mission</h2>
              <p className="bodytext">
                MISSION SATEMENT
              </p>
            </div>
            <div className="card">
              <h2 className="heading2">Our Vision</h2>
              <p className="bodytext">
                VISION STATEMENT
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
            <h3 className="heading3">[Value 1]</h3>
            <p className="bodytext">
              VALUES
            </p>
          </div>
          <div className="card value-card">
            <div className="value-icon">
              <span>🐢</span>
            </div>
            <h3 className="heading3">[Value 2]</h3>
            <p className="bodytext">
              VALUES
            </p>
          </div>
          <div className="card value-card">
            <div className="value-icon">
              <span>☀️</span>
            </div>
            <h3 className="heading3">[Value 3]</h3>
            <p className="bodytext">
              VALUES
            </p>
          </div>
        </div>
      </div>


      {/* groups */}
      <div className="team-section">
        <div className="container">
          <h2 className="heading2 text-center">Meet the Team</h2>
          <p className="bodytext text-center team-intro">
            CSUN CLUB...
          </p>

          
          {/* Computer Science / Engineering Team */}
          <div className="team-group-card">
            <h3 className="heading3 text-center">Computer Science / Engineering Team</h3>
            <div className="team-grid">
              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Bella Felipe</h4>
                <p className="member-role">[Title/Role]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Julian Lozada</h4>
                <p className="member-role">[Title/Role]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Christine Nguyen</h4>
                <p className="member-role">[Title/Role]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Tyra Quiachon</h4>
                <p className="member-role">[Title/Role]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Max Woodruff</h4>
                <p className="member-role">[Title/Role]</p>
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
                <p className="member-role">[Title/Role]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Dianna Zamora</h4>
                <p className="member-role">[Title/Role]</p>
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
                <p className="member-role">[Title/Role]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Alex Cervantes</h4>
                <p className="member-role">[Title/Role]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Marlon Flores</h4>
                <p className="member-role">[Title/Role]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Jeslyn Martinez</h4>
                <p className="member-role">[Title/Role]</p>
              </div>
              
              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Lorena Robles</h4>
                <p className="member-role">[Title/Role]</p>
              </div>

              <div className="team-member">
                <div className="team-photo"></div>
                <h4 className="member-name">Carina</h4>
                <p className="member-role">[Title/Role]</p>
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
              <div className="stat-number">[#]</div>
              <p className="stat-label">[Metric Label]</p>
            </div>
            <div className="stat-item">
              <div className="stat-number">[#]</div>
              <p className="stat-label">[Metric Label]</p>
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
                <span>[Logo]</span>
              </div>
              <div className="partner-logo">
                <span>[Logo]</span>
              </div>
              <div className="partner-logo">
                <span>[Logo]</span>
              </div>
              <div className="partner-logo">
                <span>[Logo]</span>
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
