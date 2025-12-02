import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import MapComponent from "../components/Map/MapComponent";
import IslandCard from "../components/IslandCard/IslandCard";
import Reveal from "../components/Reveal/Reveal";





type Island = {
  id: string;
  name: string;
  description: string;
  facts: { lat: number; lng: number; areaKm2?: number; elevationM?: number };
};

const islands: Island[] = [
  {
    id: "island-1",
    name: "Isla Menor Cayo Roncador",
    description:
      "Cayo Roncador is a remote coral atoll in Colombia’s western Caribbean, surrounded by rich reefs and shallow lagoons that serve as important feeding and resting grounds for green and hawksbill sea turtles.",
    facts: { lat: 13.5833, lng: -80.0833, areaKm2: 0.65, elevationM: 5 },
  },
  {
    id: "island-2",
    name: "Isla Providencia y Santa Catalina",
    description:
      "The twin islands are volcanic in origin and encircled by one of the most extensive barrier reefs in the Americas.",
    facts: { lat: 13.35, lng: -81.3667, areaKm2: 22.0, elevationM: 360 },
  },
  {
    id: "island-3",
    name: "Isla Menor Cayo Serrana",
    description:
      "Cayo Serrana lies deep in the Caribbean and provides a valuable natural refuge for monitoring turtle migration patterns.",
    facts: { lat: 14.2833, lng: -80.2833 },
  },
  {
    id: "island-4",
    name: "Isla Menor Cayo Serranilla",
    description:
      "A low-lying reef system with scattered islets and shallow lagoons; an important waypoint for migrating turtles.",
    facts: { lat: 15.8333, lng: -79.8333 },
  },
  {
    id: "island-5",
    name: "Isla Menor Cayo Bolívar",
    description:
      "Southwest of San Andrés; turquoise waters and intact reefs that serve as foraging and resting areas.",
    facts: { lat: 12.3833, lng: -81.3833 },
  },
  {
    id: "island-6",
    name: "Isla Menor Cayo Albuquerque",
    description:
      "Two small coral islets surrounded by shallow reefs teeming with marine life; frequent turtle grazing grounds.",
    facts: { lat: 12.0833, lng: -81.8333 },
  },
];

export default function IslandsPage() {
  const location = useLocation();

  useEffect(() => {
    const go = () => {
      const hash = location.hash;
      if (hash) {
        const el = document.getElementById(hash.slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    };
    go();
    const raf = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf);
  }, [location.pathname, location.hash]);

  return (
    <main className="section">
      <div className="container">
        <p className="heading1">Research Islands</p>
        <p className="bodytext">Tracking sea turtles across Colombia’s remote Caribbean islands.</p>

        <MapComponent />

        {/* 1 island card per island (inside container) */}
        {islands.map((it, idx) => (
           <Reveal
            key={it.id}
            effect="scale-in"
            delay={idx * 100}
            >
          <div key={it.id}>
            {idx === 0 && <div className="islands-top-spacer" aria-hidden />}
            <div id={it.id} className="anchor-target" />
            <IslandCard
              id={it.id}
              name={it.name}
              description={it.description}
              facts={it.facts}   // lat/lng + optional area & elevation
            />
          </div>
          </Reveal>
        ))}
      </div>
    </main>
  );
}
