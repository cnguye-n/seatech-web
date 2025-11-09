import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type Island = { id: string; name: string; image: string; description: string };

const islands: Island[] = [
  { id: "island-1", name: "Isla Menor Cayo Roncador", image: "/images/island1.jpg", 
    description: "Cayo Roncador is a remote coral atoll in Colombia’s western Caribbean, surrounded by rich reefs and shallow lagoons that serve as important feeding and resting grounds for green and hawksbill sea turtles. The cay’s seagrass meadows and coral formations provide vital foraging habitats, while its isolation helps protect marine life from heavy human disturbance." },
  { id: "island-2", name: "Isla Providencia y Santa Catalina", image: "/images/island2.jpg", 
  description: "The twin islands of Providencia and Santa Catalina are volcanic in origin and encircled by one of the most extensive barrier reefs in the Americas. This protected ecosystem hosts nesting and juvenile sea turtles that thrive among its coral gardens and seagrass beds. Local communities actively participate in marine conservation programs, making Providencia a model for sustainable coexistence with sea life." },
  { id: "island-3", name: "Isla Menor Cayo Serrana", image: "/images/island3.jpg", 
  description: "Cayo Serrana lies deep in the Caribbean, forming part of Colombia’s far-flung oceanic territory. Though uninhabited, it supports thriving coral reefs and sandy beaches used occasionally by sea turtles for nesting. Its remoteness and pristine waters make it a valuable natural refuge, crucial for monitoring turtle migration patterns and habitat health." },
  { id: "island-4", name: "Isla Menor Cayo Serranilla", image: "/images/island4.jpg", 
  description: "Cayo Serranilla, also known as the Serranilla Bank, is a low-lying reef system with scattered islets and shallow lagoons. It is an important waypoint for migrating turtles crossing the Caribbean Sea. The area’s coral communities, though fragile, sustain diverse marine species and highlight the need for regional cooperation in ocean conservation." },
  { id: "island-5", name: "Isla Menor Cayo Bolívar", image: "/images/island5.jpg", 
  description: "Located southwest of San Andrés, Cayo Bolívar is famous for its turquoise waters, white sands, and intact coral reefs. It serves as both a foraging and resting area for sea turtles traveling between the larger islands of the archipelago. Although small, its ecosystems play an outsized role in the connectivity of marine life across the Western Caribbean." },
  { id: "island-6", name: "Isla Menor Cayo Albuquerque", image: "/images/island6.jpg", 
  description: "The Cayos de Albuquerque are two small coral islets surrounded by shallow reefs teeming with marine life. Sea turtles frequent the area to graze on seagrass and find shelter among coral heads. Researchers and conservationists monitor these cays closely as indicators of ecosystem health within the larger Seaflower Biosphere Reserve." },
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
