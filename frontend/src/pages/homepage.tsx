import React, { useEffect } from "react";
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
  useEffect(() => {
    const titles = document.querySelectorAll<HTMLElement>(".fade-title");
    let lastY = window.scrollY;

    const io = new IntersectionObserver(
      (entries) => {
        const dir = window.scrollY > lastY ? "down" : "up";

        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            // entering viewport:
            // scrolling down  → fade up   (start from +12px)
            // scrolling up    → fade down (start from -12px)
            el.style.setProperty("--from", dir === "down" ? "12px" : "-12px");
            el.classList.add("in-view");
          } else {
            // leaving viewport:
            // set opposite so it fades out in the scroll direction
            el.style.setProperty("--from", dir === "down" ? "-12px" : "12px");
            el.classList.remove("in-view");
          }
        });

        lastY = window.scrollY;
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );

    titles.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

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

  {/* ===== 3) Islands section ===== */}
      <section className="section islands parallax-block">
        <div className="parallax-media" aria-hidden />
        <div className="container parallax-content">
          <div className="islands-sticky">
            <Reveal effect="fade-in">
              <div className="islands-header">
                <p className="heading2">Research Islands</p>
                <p className="bodytext dim">Six sites used as collection/observation areas.</p>
              </div>
            </Reveal>
          </div>

          <div className="islands-grid">
            {islands.map((island) => (
              <Link key={island.slug} to={`/islands#${island.slug}`} className="tile-link">
                <div className="island-tile">
                  <span className="island-label fade-title">{island.name}</span>
                </div>
              </Link>
            ))}
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
