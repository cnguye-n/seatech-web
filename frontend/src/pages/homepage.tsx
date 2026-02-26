import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/pages/homepage.css";
import "../styles/pages/infoSections.css";
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
            // scrolling down -> fade up (+12px)
            // scrolling up -> fade down (-12px)
            el.style.setProperty("--from", dir === "down" ? "12px" : "-12px");
            el.classList.add("in-view");
          } else {
            // leaving viewport:
            // opposite -> fades out in the scroll direction
            el.style.setProperty("--from", dir === "down" ? "-12px" : "12px");
            el.classList.remove("in-view");
          }
        });

        lastY = window.scrollY;
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );

    titles.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  // Adding fixes to current islands
  useEffect(() => {
  const grid = document.querySelector('.islands-grid');
  const sticky = document.querySelector('.islands-sticky');
  if (!grid || !sticky) return;
  
  const onScroll = () => {
    const stickyRect = sticky.getBoundingClientRect();
    const fadeZoneTop = stickyRect.bottom;
    const fadeDistance = 80;

    grid.querySelectorAll('.island-tile').forEach((tile) => {
      const tileRect = tile.getBoundingClientRect();
      const tileTop = tileRect.top;

      if (tileTop < fadeZoneTop) {
        const progress = Math.max(0, 1 - (fadeZoneTop - tileTop) / fadeDistance);
        (tile as HTMLElement).style.opacity = String(progress);
        (tile as HTMLElement).style.transform = `scale(${0.95 + progress * 0.05})`;
      } else {
        (tile as HTMLElement).style.opacity = '1';
        (tile as HTMLElement).style.transform = 'scale(1)';
      }
    });
  };

  window.addEventListener('scroll', onScroll, {passive: true});
  onScroll();
  return () => window.removeEventListener('scroll', onScroll);
}, []);

  return (
    <div className="homepage">
      {/* ===== hero ===== */}
      <section className="section hero-gallery">
        <div className="hero-gallery-wrapper">
          <FullBleedGallery
            images={galleryImages}
            aspectRatio="3/2"
            autoPlay={true}
            autoPlayMs={5000}
          />

          {/* overlay text */}
          <div className="hero-gallery-text">
            <p className="heading1">SEAtech</p>
            <p className="bodytext">Technology powering marine conservation</p>
          </div>
        </div>
      </section>

      <section className="vh-spacer info-band">
        <div className="container">
          <div className="info-stack">

            {/* turtles */}
            <Link to="/turtles" className="cta-row turtle">
              <div className="cta-icon turtle-icon" aria-hidden="true" />
              <div className="cta-text">
                <p className="cta-title">Turtle</p>
                <p className="cta-sub">
                  Our research focuses on tagging turtles in Colombia.
                </p>
              </div>
            </Link>

            {/* sensors */}
            <Link to="/sensor" className="cta-row sensor">
              <div className="cta-text">
                <p className="cta-title">Sensor</p>
                <p className="cta-sub">
                  Our sensor system provides real-time tracking and environmental monitoring
                  for turtle conservation.
                </p>
              </div>
              <div className="cta-icon sensor-icon" aria-hidden="true" />
            </Link>

          </div>
        </div>
      </section>


      {/* ===== islands ===== */}
      <section className="section islands parallax-block">
        <div className="parallax-media" aria-hidden />
        <div className="container parallax-content">
          <div className="islands-sticky">
            <Reveal effect="fade-in">
              <div className="islands-header">
                <p className="heading2">Research Islands</p>
                <p className="bodytext dim">6 sites used as Collection/Observation Areas</p>
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

      {/* ===== about us ===== */}
      <section className="vh-spacer about-band">
        <div className="container about-container">
          <h2 className="about-title">About Us</h2>

          <p className="about-text">
            At SEAtech, our mission is to advance marine conservation through innovative technology.
            Our team of dedicated researchers, engineers, and conservationists work together to
            monitor sea turtle migration and promote sustainable ocean practices.
          </p>

          <Link to="/about" className="about-btn">
            Learn More
          </Link>
        </div>
      </section>

    </div>
  );
}
