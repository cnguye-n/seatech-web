import React, { useEffect, useRef } from "react";
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

  // ── fade-title scroll animation ───────────────────────────────────────────
  useEffect(() => {
    const titles = document.querySelectorAll<HTMLElement>(".fade-title");
    let lastY = window.scrollY;

    const io = new IntersectionObserver(
      (entries) => {
        const dir = window.scrollY > lastY ? "down" : "up";
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.style.setProperty("--from", dir === "down" ? "12px" : "-12px");
            el.classList.add("in-view");
          } else {
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

  // ── island grid scroll-driven top fade ───────────────────────────────────
  // The sticky header (.islands-sticky) sits at:
  //   top: calc(--nav-h + 100px) = 80 + 100 = 180px from viewport top
  // The header block itself is ~130px tall, so its bottom edge ≈ 310px.
  // FADE_ZONE is the viewport-y where items should be fully transparent —
  // i.e. the bottom of the sticky header. Items start fading as they scroll
  // up into that zone, and are fully visible when below it.
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Read the actual sticky header bottom at runtime so it's always accurate
    function getStickyBottom(): number {
      const sticky = document.querySelector<HTMLElement>(".islands-sticky");
      if (sticky) {
        const r = sticky.getBoundingClientRect();
        return r.bottom;
      }
      // fallback: nav-h(80) + 100 offset + ~130px header height
      return 310;
    }

    function updateMask() {
      if (!grid) return;
      const gridTop = grid.getBoundingClientRect().top;
      const fadeZone = getStickyBottom();

      if (gridTop >= fadeZone) {
        // Grid top is still below the header — fully visible, no mask
        grid.style.webkitMaskImage = "";
        grid.style.maskImage = "";
        return;
      }

      // Items are scrolling up behind the header
      // overlap = how far above fadeZone the grid top currently is
      const overlap = fadeZone - gridTop;
      // fade completes 80px below the overlap point
      const fadeEnd = overlap + 80;

      const mask = `linear-gradient(to bottom, transparent 0px, transparent ${overlap}px, black ${fadeEnd}px, black 100%)`;
      grid.style.webkitMaskImage = mask;
      grid.style.maskImage = mask;
    }

    window.addEventListener("scroll", updateMask, { passive: true });
    // Also run on resize since the sticky header height can change
    window.addEventListener("resize", updateMask, { passive: true });
    updateMask();
    return () => {
      window.removeEventListener("scroll", updateMask);
      window.removeEventListener("resize", updateMask);
    };
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

          <div className="islands-grid" ref={gridRef}>
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