// src/components/IslandCard/IslandCard.tsx
import MapComponent from "../Map/MapComponent"; // use reusable map
import "./IslandCard.css";

export type IslandFacts = {
  lat: number;
  lng: number;
  areaKm2?: number;
  elevationM?: number;
};

type Props = {
  id: string;
  name: string;
  description: string;
  facts: IslandFacts;
  sanAndres?: { lat: number; lng: number };
};

// haversine distance (km)
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export default function IslandCard({
  id,
  name,
  description,
  facts,
  sanAndres = { lat: 12.5833, lng: -81.7 },
}: Props) {
  const { lat, lng, areaKm2, elevationM } = facts;
  const dist = distanceKm({ lat, lng }, sanAndres);

  return (
    <article id={id} className="islandcard">
      <header className="islandcard__header">
        <p className="heading2 islandcard__title">{name}</p>
        <span className="islandcard__rule" aria-hidden />
      </header>

      <p className="bodytext islandcard__subtitle">{description}</p>

      <div className="islandcard__body">
        <div className="islandcard__left">{/* optional narrative area */}</div>

        <aside className="islandcard__box card">
          <div className="islandcard__mapwrap">
            {/* Use MapComponent with a single point */}
            <MapComponent
              points={[{ name, coords: [lat, lng] }]}
              autoFit={false}                    
              initialCenter={[lat, lng]}
              initialZoom={9}
              labelZoom={9}
              defaultLayers={{ base: "satellite", overlays: { oceanLabels: true } }}
            />
          </div>

          <dl className="islandcard__facts">
            <div className="fact">
              <dt>Coordinates</dt>
              <dd>{lat.toFixed(4)}°, {lng.toFixed(4)}°</dd>
            </div>
            <div className="fact">
              <dt>Distance from San Andrés</dt>
              <dd>{dist.toFixed(1)} km</dd>
            </div>
            {typeof elevationM === "number" && (
              <div className="fact">
                <dt>Highest elevation</dt>
                <dd>{elevationM} m</dd>
              </div>
            )}
            {typeof areaKm2 === "number" && (
              <div className="fact">
                <dt>Area</dt>
                <dd>{areaKm2} km²</dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </article>
  );
}
