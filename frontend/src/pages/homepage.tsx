import React from "react";
import "../styles/pages/homepage.css";
import Reveal from "../components/Reveal/Reveal";
import Gallery, { type GalleryItem } from "../components/Gallery/Gallery";


export default function Homepage() {
      const galleryImages: GalleryItem[] = [
    {
      src: "/images/turtle1.jpg",
      alt: "Sea turtle swimming over coral reef",
      title: "Sea Turtle Swimming",
      caption: "A turtle exploring the coral reef.",
    },
    {
      src: "/images/turtle2.jpg",
      alt: "Sea turtle near the surface of shallow water",
      title: "Shallow Waters",
      caption: "Captured near San Andrés island.",
    },
    {
      src: "/images/turtle3.jpg",
      alt: "Sea turtle gliding above coral formations",
      title: "Reef Zone",
      caption: "Turtle gliding above coral formations.",
    },
    {
      src: "/images/turtle4goodbackground.jpg",
      alt: "Turtle resting on the seabed",
      title: "Resting Spot",
      caption: "A turtle resting on the sandy seabed.",
    },
    {
      src: "/images/turtle5goodbackground.jpeg",
      alt: "Sea turtle surfacing for air",
      title: "Surface Break",
      caption: "Sea turtle surfacing for air.",
    },
  ];


  return (
    <div className="homepage">
      {/* ===== 1) HERO ===== */}
      <section className="section hero">
        <div className="hero-overlay">
          <div className="container hero-content">
            <Reveal effect="fade-up">  {/* THE EFFECT ONLY HAPPENS ONCE IDK HOW TO MAKE IT REPEAT */}
            <p className="heading1">Homepage</p>
             </Reveal>
            <Reveal effect="fade-up">
            <p className="bodytext">
              This is our project.
            </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== 2) GALLERY ===== THIS NEEDS WORK*/}
      <section className="section gallery">
      <div className="container">
        <Reveal effect="fade-in">
          <p className="heading2 mb-4">Gallery</p>
        </Reveal>

        <Reveal effect="scale-in" delay={80}>
          <Gallery
            images={galleryImages}
            aspectRatio="16 / 9"
            autoPlay={false}
          />
        </Reveal>
      </div>
    </section>


      {/* ===== 3) ISLANDS (background image + 6 white squares) ===== */}
      <section className="section islands">
        <div className="islands-bg">
          <div className="container">
            <Reveal effect="fade-in">
              <div className="islands-header">
                <p className="heading2">Research Islands</p>
                <p className="bodytext dim">Six sites used as collection/observation areas.</p>
              </div>
            </Reveal>

            <div className="islands-grid">
              {["Island 1","Island 2","Island 3","Island 4","Island 5","Island 6"].map((name, i) => (
                <Reveal key={name} effect="scale-in" delay={i * 120}>
                  <div className="island-tile">
                    <div className="island-icon">🧭</div>
                    <span className="island-label">{name}</span>
                  </div>
                </Reveal>
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
