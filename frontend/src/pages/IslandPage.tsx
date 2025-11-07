import { useParams } from "react-router-dom";

const islandData: Record<string, { name: string; description: string; image: string }> = {
  "island-1": {
    name: "Isla Menor Cayo Roncador",
    description: "Known for its crystal-clear waters and turtle nesting sites.",
    image: "/images/island1.jpg",
  },
  "island-2": {
    name: "Isla Providencia y Santa Catalina",
    description: "Rich coral reefs and diverse marine life, part of turtle tagging zone 2.",
    image: "/images/island2.jpg",
  },
  "island-3": {
    name: "Isla Menor Cayo Serrana",
    description: "A small island connected by a bridge, important for turtle migration studies.",
    image: "/images/island3.jpg",
  },
  "island-4": {
    name: "Isla Menor Cayo Serranilla",
    description: "A small island connected by a bridge, important for turtle migration studies.",
    image: "/images/island4.jpg",
  },
  "island-5": {
    name: "Isla Menor Caya Bolivar",
    description: "A small island connected by a bridge, important for turtle migration studies.",
    image: "/images/island5.jpg",
  },
  "island-6": {
    name: "Isla Menor Cayo Albuquerque",
    description: "A small island connected by a bridge, important for turtle migration studies.",
    image: "/images/island6.jpg",
  },
};

export default function IslandPage() {
  const { slug } = useParams<{ slug: string }>();
  const island = slug ? islandData[slug] : null;
  
  if (!island) {
    return (
      <main className="section">
        <div className="container">
          <p className="heading1">Island not found</p>
          <p className="bodytext">The island you’re looking for doesn’t exist or hasn’t been added yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container">
      <img
          src={island.image}
          alt={island.name}
          style={{ width: "100%", borderRadius: "12px", marginBottom: "1rem" }}
        />
      <p className="heading1">{island.name}</p>
      <p className="bodytext">{island.description}</p>
      </div>
    </main>
  );
}
