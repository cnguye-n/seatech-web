// MapComponent.tsx
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  LayersControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapComponent.css";

const { BaseLayer, Overlay } = LayersControl;

// Fix default Leaflet icon paths in bundlers (React/Vite)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export type Point = { name: string; coords: [number, number] };

const DEFAULT_POINTS: Point[] = [
  { name: "San Andrés", coords: [12.584, -81.700] },
  { name: "Providencia", coords: [13.351, -81.375] },
  { name: "Santa Catalina", coords: [13.383, -81.369] },
  { name: "Quita Sueño", coords: [13.675, -81.200] },
  { name: "Alburquerque Cays", coords: [12.155, -81.840] },
  { name: "Serrana Bank", coords: [14.286, -80.278] },
  { name: "Serranilla Bank", coords: [15.850, -79.850] },
];

// Watches zoom so we can fade labels in/out at a threshold
function ZoomWatcher({ onChange }: { onChange: (z: number) => void }) {
  useMapEvents({
    zoomend(e) {
      onChange(e.target.getZoom());
    },
  });
  return null;
}

// Auto-fit/center to the given points (runs on mount + when points change)
function FitToPoints({
  points,
  padding = 80,
  animate = true,
}: {
  points: Point[];
  padding?: number;
  animate?: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const bounds = L.latLngBounds(points.map((p) => p.coords));
    map.fitBounds(bounds, { padding: [padding, padding], animate });
  }, [map, points, padding, animate]);
  return null;
}

// recenter button control. this recenters the map to fit all the points of the markers
function RecenterControl({ points }: { points: Point[] }) {
  const map = useMap();

  useEffect(() => {
    const ctl = L.control({ position: "topleft" });
    ctl.onAdd = () => {
      const container = L.DomUtil.create("div", "leaflet-control leaflet-bar leaflet-control-recenter");
      const link = L.DomUtil.create("a", "", container);
      link.href = "#";
      link.title = "Recenter";
      link.innerHTML = "⟳"; // you can swap for an SVG icon
      // prevent map drag on click
      L.DomEvent.disableClickPropagation(link);
      L.DomEvent.on(link, "click", (e: any) => {
        L.DomEvent.preventDefault(e);
        const bounds = L.latLngBounds(points.map(p => p.coords));
        map.flyToBounds(bounds, { padding: [80, 80] });
      });
      return container;
    };
    ctl.addTo(map);
    return () => ctl.remove();
  }, [map, points]);

  return null;
}

export default function MapComponent({
  points = DEFAULT_POINTS,
  initialCenter = [13.4, -81.1] as [number, number],
  initialZoom = 6.7,
  labelZoom = 6.7, // labels visible at/above this zoom
  autoFit = true,
}: {
  points?: Point[];
  initialCenter?: [number, number];
  initialZoom?: number;
  labelZoom?: number;
  autoFit?: boolean;
}) {
  const [zoom, setZoom] = useState(initialZoom);

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      maxZoom={18}
      scrollWheelZoom
      className="leaflet-map"
    >
      {autoFit && <FitToPoints points={points} padding={80} animate={true} />}
      <ZoomWatcher onChange={setZoom} />
      <RecenterControl points={points} />

      <LayersControl position="topright">
        {/* === Basemaps (default: OpenStreetMap) === */}
        <BaseLayer name="Esri Ocean Basemap">
          <TileLayer
            attribution="Tiles © Esri — Ocean Basemap"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
          />
        </BaseLayer>

        <BaseLayer checked name="OpenStreetMap (World)">
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </BaseLayer>

        <BaseLayer name="Esri World Imagery (Satellite)">
          <TileLayer
            attribution="Tiles © Esri — World Imagery"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </BaseLayer>

        <BaseLayer name="OpenTopoMap (Terrain)">
          <TileLayer
            attribution="© OpenTopoMap (CC-BY-SA)"
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </BaseLayer>

        {/* === Overlays (default: Ocean Reference Labels on) === */}
        <Overlay checked name="Ocean Reference Labels">
          <TileLayer
            attribution="Labels © Esri — Ocean Reference"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}"
            opacity={0.9}
            zIndex={400}
          />
        </Overlay>

        <Overlay name="Boundaries & Places (country/city names)">
          <TileLayer
            attribution="© Esri — Boundaries & Places"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            opacity={0.9}
            zIndex={410}
          />
        </Overlay>
      </LayersControl>

      {/* Markers + labels */}
      {points.map((p) => (
        <Marker key={p.name} position={p.coords}>
          <Tooltip
            permanent
            direction="top"
            offset={[0, -12]}
            className={`island-label ${zoom >= labelZoom ? "visible" : ""}`}
          >
            {p.name}
          </Tooltip>
          <Popup>
            <strong>{p.name}</strong>
            <div>
              Lat: {p.coords[0].toFixed(3)} | Lon: {p.coords[1].toFixed(3)}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
