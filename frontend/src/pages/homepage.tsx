import React from "react";
import { Link } from "react-router-dom";
import "../styles/pages/homepage.css";
import Reveal from "../components/Reveal/Reveal";
import FullBleedGallery, { type GalleryItem } from "../components/PhotoGallery";

export default function Homepage() {
  const islands = [
    { name: "Isla Menor Cayo Roncador", slug: "island-1" },
    { name: "Isla Providencia y Santa Catalina", slug: "island-2" },
    { name: "Isla Menor Cayo Serrana", slug: "island-3" },
    { name: "Isla Menor Cayo Serranilla", slug: "island-4" },
    { name: "Isla Menor Cayo Bolívar", slug: "island-5" },
    { name: "Isla Menor Cayo Albuquerque", slug: "island-6" },
  ];
  const galleryImages: GalleryItem[] = [
   /* {
      src: "/images/turtle1.jpg",
      alt: "Sea turtle swimming over coral reef",
    },*/
    {
      src: "/images/turtle2.jpg",
      alt: "Sea turtle near the surface of shallow water",
    },
    {
      src: "/images/turtle3.jpg",
      alt: "Sea turtle gliding above coral formations",
    },
    {
      src: "/images/turtle4goodbackground.jpg",
      alt: "Turtle resting on the seabed",
    },
    {
      src: "/images/turtle5goodbackground.jpeg",
      alt: "Sea turtle surfacing for air",
    },
  ];


  return (
    <div className="homepage">
      {/* ===== 1) HERO ===== */}
      <section className="section hero-gallery">
        <div className="hero-gallery-wrapper">
          <FullBleedGallery
            images={galleryImages}
            aspectRatio="3/2"      // adjust to make it taller/shorter
            autoPlay={true}
            autoPlayMs={5000}
          />

          {/* Overlay text */}
          <div className="hero-gallery-text">
            <p className="heading1">SEAtech</p>
            <p className="bodytext">This is our project.</p>
          </div>
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
              {islands.map((island, i) => (
                <Reveal key={island.slug} effect="scale-in" delay={i * 120}>
                  <Link to={`/islands#${island.slug}`} className="tile-link">

                    <div className="island-tile clickable">
                      <div className="island-icon">🧭</div>
                      <span className="island-label">{island.name}</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4) INFO CARDS (optional, like Nicepage) ===== */}
      <section className="section info">
        <div className="container info-grid">
          <Link to="/turtles" className="tile-link">
            <div className="card">
              <p className="heading3">Turtle</p>
              <p className="bodytext">Our research focuses on tagging turtles in Colombia.</p>
            </div>
          </Link>

          <Link to="/about" className="tile-link">
            <div className="card">
              <p className="heading3">About Us</p>
              <p className="bodytext">A team dedicated to marine tracking and conservation.</p>
            </div>
          </Link>
          <Link to="/islands#island-1" className="tile-link">
            <div className="card">
              <p className="heading3">Island 1</p>
              <p className="bodytext">Tagging turtles in coastal sites of Colombia.</p>
            </div>
          </Link>
          <Link to="/islands#island-2" className="tile-link">
            <div className="card">
              <p className="heading3">Island 2</p>
              <p className="bodytext">Navigation and exploration of sea turtle habitats.</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
