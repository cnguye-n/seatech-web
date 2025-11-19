// src/pages/SensorPage.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import "../styles/pages/sensors.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type SensorStatus = "online" | "offline" | "warning";

interface Sensor {
  id: string;
  name: string;
  type: string;
  location: string;
  status: SensorStatus;
  lastReading: string;
  lastUpdated: string;
  lat: number;
  lng: number;
}

const mockSensors: Sensor[] = [
  {
    id: "SENSOR-001",
    name: "TURTLE-1",
    type: "Temperature",
    location: "Isla Menor Cayo Roncador",
    status: "online",
    lastReading: "22.4 °C",
    lastUpdated: "2 min ago",
    lat: 13.5833,
    lng: -81.2,
  },
  {
    id: "SENSOR-002",
    name: "TURTLE-2",
    type: "Motion",
    location: "Isla Providencia y Santa Catalina",
    status: "warning",
    lastReading: "12.3",
    lastUpdated: "5 min ago",
    lat: 13.35,
    lng: -81.37,
  },
  {
    id: "SENSOR-003",
    name: "TURTLE-3",
    type: "Pressure",
    location: "Isla Menor Cayo Serrana",
    status: "offline",
    lastReading: "-",
    lastUpdated: "1 hr ago",
    lat: 14.2833,
    lng: -80.2833,
  },
];

// History + predicted tracks for each turtle.
// NOTE: the LAST point in `history` is exactly the sensor's current lat/lng.
type Track = {
  history: [number, number][];
  predicted: [number, number][];
};

const mockTracks: Record<string, Track> = {
  "SENSOR-001": {
    history: [
      [13.20, -81.55],
      [13.40, -81.35],
      [13.5833, -81.2],
    ],
    predicted: [
      [13.70, -81.05],
      [13.82, -80.90],
    ],
  },
  "SENSOR-002": {
    history: [
      [13.05, -81.70],
      [13.22, -81.55],
      [13.35, -81.37],
    ],
    predicted: [
      [13.48, -81.18],
      [13.60, -81.00],
    ],
  },
  "SENSOR-003": {
    history: [
      [13.90, -80.80],
      [14.10, -80.55],
      [14.2833, -80.2833],
    ],
    predicted: [
      [14.45, -80.00],
      [14.55, -79.70],
    ],
  },
};

const SensorPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SensorStatus>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensorTypes = useMemo(
    () => ["all", ...Array.from(new Set(mockSensors.map((s) => s.type)))],
    []
  );

  const filteredSensors = useMemo(() => {
    const term = search.toLowerCase();

    return mockSensors.filter((sensor) => {
      const matchesSearch =
        sensor.name.toLowerCase().includes(term) ||
        sensor.id.toLowerCase().includes(term) ||
        sensor.location.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ? true : sensor.status === statusFilter;

      const matchesType =
        typeFilter === "all" ? true : sensor.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, typeFilter]);

  const total = filteredSensors.length;
  const online = filteredSensors.filter((s) => s.status === "online").length;
  const offline = filteredSensors.filter((s) => s.status === "offline").length;
  const warning = filteredSensors.filter((s) => s.status === "warning").length;

  const activeIndex = filteredSensors.findIndex((s) => s.id === activeId);
  const activeSensor =
    filteredSensors.find((s) => s.id === activeId) ?? null;

  const gridClassName = [
    "sensor-grid",
    activeIndex === 0 ? "active-index-0" : "",
    activeIndex === 1 ? "active-index-1" : "",
    activeIndex === 2 ? "active-index-2" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* HERO */}
      <section className="section">
        <div className="container">
          <p className="heading1 mb-4">Sensors</p>
          <p className="bodytext">
            Centralized view of all deployed SEAtech sensors. Click a sensor
            card to see its details and visualize its recent path.
          </p>
        </div>
      </section>

      {/* METRICS + FILTERS + SENSOR GRID */}
      <section className="section">
        <div className="container">
          {/* Summary cards */}
          <div className="summary-grid mb-6">
            <div className="card">
              <p className="heading3">Total Sensors</p>
              <p className="heading2">{total}</p>
            </div>
            <div className="card">
              <p className="heading3">Online</p>
              <p className="heading2">{online}</p>
            </div>
            <div className="card">
              <p className="heading3">Offline</p>
              <p className="heading2">{offline}</p>
            </div>
            <div className="card">
              <p className="heading3">Warnings</p>
              <p className="heading2">{warning}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-row mb-6">
            <div className="filters-inputs">
              <input
                type="text"
                placeholder="Search by name, ID, or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="filters-field"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | SensorStatus)
                }
                className="filters-field"
              >
                <option value="all">All statuses</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="warning">Warning</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filters-field"
              >
                {sensorTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All types" : type}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn">+ Add sensor</button>
          </div>

          {/* SENSOR CARDS */}
          <div className={gridClassName}>
            {filteredSensors.map((sensor) => {
              const isActive = sensor.id === activeId;
              return (
                <SensorCard
                  key={sensor.id}
                  sensor={sensor}
                  isActive={isActive}
                  onToggle={() =>
                    setActiveId((prev) =>
                      prev === sensor.id ? null : sensor.id
                    )
                  }
                />
              );
            })}
            {filteredSensors.length === 0 && (
              <p className="bodytext sensors-empty">
                No sensors match your filters.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* LEAFLET PATH MAP SECTION */}
      <section className="section">
        <div className="container">
          <LeafletPathMap activeSensor={activeSensor} />
        </div>
      </section>

      {/* CUSTOM SENSOR BUILD SECTION (unchanged) */}
      <section className="section">
        <div className="container">
          <p className="heading2 mb-4">Our Custom Sensor Build</p>
          <p className="bodytext mb-4">
            A snapshot of the sensor we built, the components we selected, and
            how each choice supports reliable, low-impact monitoring. Replace
            these placeholders with final photos and copy.
          </p>

          <div className="sensor-build-grid">
            <div className="card sensor-build-card">
              <p className="heading3">Sensor Overview</p>
              <div className="sensor-placeholder-image">
                Main sensor photo / CAD render
              </div>
              <p className="bodytext sensor-placeholder-text">
                Placeholder: high-level description of the device (enclosure,
                waterproofing, mounting strategy, dimensions, deployment
                environment).
              </p>
            </div>

            <div className="card sensor-build-card">
              <p className="heading3">Key Components</p>
              <div className="sensor-placeholder-image small">
                PCB / components layout image
              </div>
              <ul className="bodytext sensor-parts-list">
                <li>
                  <strong>Microcontroller:</strong> Placeholder for MCU model
                  and why it fits low-power, remote deployments.
                </li>
                <li>
                  <strong>Sensors:</strong> Placeholder for temperature/motion/
                  pressure modules and selection criteria.
                </li>
                <li>
                  <strong>Power:</strong> Placeholder for battery / solar design
                  and expected runtime.
                </li>
                <li>
                  <strong>Connectivity:</strong> Placeholder for LoRa / LTE /
                  satellite choice and coverage rationale.
                </li>
              </ul>
            </div>

            <div className="card sensor-build-card">
              <p className="heading3">Design Rationale</p>
              <p className="bodytext sensor-placeholder-text">
                Placeholder: describe trade-offs between accuracy, durability,
                cost, and serviceability in island/marine environments.
              </p>
              <p className="bodytext sensor-placeholder-text">
                Placeholder: explain how field tests and partner feedback shaped
                enclosure design, mounting, and sampling strategy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

interface SensorCardProps {
  sensor: Sensor;
  isActive: boolean;
  onToggle: () => void;
}

const SensorCard: React.FC<SensorCardProps> = ({
  sensor,
  isActive,
  onToggle,
}) => {
  const statusClass =
    sensor.status === "online"
      ? "status-pill status-online"
      : sensor.status === "offline"
      ? "status-pill status-offline"
      : "status-pill status-warning";

  return (
    <div
      className={`card sensor-card ${isActive ? "is-open" : ""}`}
      onClick={onToggle}
    >
      <div className="sensor-card-header">
        <p className="sensor-title">{sensor.name}</p>
        <p className="sensor-id">{sensor.id}</p>
      </div>

      <div className={`sensor-card-body-wrapper ${isActive ? "open" : ""}`}>
        <div className="sensor-card-body">
          <p className="bodytext">
            <strong>Type:</strong> {sensor.type}
          </p>
          <p className="bodytext">
            <strong>Location:</strong> {sensor.location}
          </p>
          <p className="bodytext">
            <strong>Status:</strong>{" "}
            <span className={statusClass}>{sensor.status}</span>
          </p>
          <p className="bodytext">
            <strong>Last reading:</strong> {sensor.lastReading}
          </p>
          <p className="bodytext sensors-subtext">
            Updated {sensor.lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
};

/* === LEAFLET MAP SHOWING HISTORY + PREDICTION === */

interface LeafletPathMapProps {
  activeSensor: Sensor | null;
}

const LeafletPathMap: React.FC<LeafletPathMapProps> = ({ activeSensor }) => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [countdown, setCountdown] = useState(8);

  // Mock "refresh" countdown
  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 8 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Initialise Leaflet map once
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [13.8, -81.0],
      zoom: 6,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);
  }, []);

  // Update tracks whenever the active sensor changes
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (!activeSensor) {
      // Nothing selected → leave base map only.
      return;
    }

    const track = mockTracks[activeSensor.id];
    if (!track) return;

    const historyLatLngs = track.history.map(
      ([lat, lng]) => L.latLng(lat, lng)
    );
    const predictedLatLngs = track.predicted.map(
      ([lat, lng]) => L.latLng(lat, lng)
    );

    // History line
    const historyLine = L.polyline(historyLatLngs, {
      color: "#2ecc71",
      weight: 3,
    }).addTo(layerGroup);

    // Predicted line (dashed)
    const predictedLine = L.polyline(predictedLatLngs, {
      color: "#f1c40f",
      weight: 3,
      dashArray: "8 6",
    }).addTo(layerGroup);

    // Latest position marker at END of history
    const lastPoint = historyLatLngs[historyLatLngs.length - 1];
    const marker = L.circleMarker(lastPoint, {
      radius: 6,
      color: "#2ecc71",
      fillColor: "#2ecc71",
      fillOpacity: 1,
    }).addTo(layerGroup);

    marker.bindPopup(
      `<strong>${activeSensor.name}</strong><br/>${activeSensor.id}<br/>${lastPoint.lat.toFixed(
        2
      )}, ${lastPoint.lng.toFixed(2)}`
    );

    // Fit map to show both history + predicted
    const allPoints = [...historyLatLngs, ...predictedLatLngs];
    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [activeSensor]);

  return (
    <div className="card map-card">
      <div className="map-header-row">
        <div>
          <p className="heading3 mb-2">Deployment Map (Mock)</p>
          <p className="bodytext map-subtitle">
            {activeSensor
              ? `Path of ${activeSensor.name} based on last surfaced locations, plus a simple predicted heading.`
              : "Click on a TURTLE sensor above to visualize its recent path and predicted heading."}
          </p>
        </div>
        <div className="map-meta">
          <span className="map-badge">Mock live</span>
          <span className="map-timer">
            Next mock refresh in {countdown}s
          </span>
        </div>
      </div>

      <div className="map-leaflet-wrapper" ref={mapDivRef} />

      <div className="map-legend">
        <div className="map-legend-item">
          <span className="map-legend-dot online" />
          <span className="bodytext">Latest position</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot online" />
          <span className="bodytext">History (solid)</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot warning" />
          <span className="bodytext">Predicted (dashed)</span>
        </div>
        <span className="map-legend-note bodytext">
          Paths and predictions use mock data for demonstration.
        </span>
      </div>
    </div>
  );
};

export default SensorPage;
