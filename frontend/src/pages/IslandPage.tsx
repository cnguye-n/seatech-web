import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type Island = { id: string; name: string; image: string; description: string };

const islands: Island[] = [
  { id: "island-1", name: "Isla Menor Cayo Roncador", image: "/images/island1.jpg", description: "Known for crystal-clear waters and turtle nesting sites." },
  { id: "island-2", name: "Isla Providencia y Santa Catalina", image: "/images/island2.jpg", description: "Rich coral reefs and diverse marine life." },
  { id: "island-3", name: "Isla Menor Cayo Serrana", image: "/images/island3.jpg", description: "Important area for migration studies." },
  { id: "island-4", name: "Isla Menor Cayo Serranilla", image: "/images/island4.jpg", description: "Shallow lagoons and seagrass meadows." },
  { id: "island-5", name: "Isla Menor Cayo Bolívar", image: "/images/island5.jpg", description: "Tagging zone with frequent sightings." },
  { id: "island-6", name: "Isla Menor Cayo Albuquerque", image: "/images/island6.jpg", description: "Offshore currents, juvenile corridors." },
];

export default function IslandsPage() {
  const location = useLocation();

  // Scroll to the hash target on mount / hash change
  useEffect(() => {
    const go = () => {
      const hash = location.hash;
      if (hash) {
        const el = document.getElementById(hash.slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // No hash: always start at top to avoid “auto” mid-page landing
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    };

    // run now and next frame (helps after images/layout paint)
    go();
    const raf = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf);
  }, [location.pathname, location.hash]);

  return (
    <main className="section">
      <div className="container">
        <p className="heading1">Research Islands</p>
        <p className="bodytext">All islands in one place.</p>

        {islands.map((island, idx) => (
          <div key={island.id}>
            {/* spacer only before the first island anchor */}
            {idx === 0 && <div className="islands-top-spacer" aria-hidden />}

            {/* anchor OUTSIDE the padded section */}
            <div id={island.id} className="anchor-target" />

            <section className="section">
              <img
                src={island.image}
                alt={island.name}
                style={{ width: "100%", borderRadius: 12, marginBottom: "1rem" }}
              />
                  <p id={island.id} className="heading2 island-title">{island.name}</p>
              <p className="bodytext">{island.description}</p>
            </section>
          </div>
        ))}

      </div>
    </main>
  );
}
