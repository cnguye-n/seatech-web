import React, { useState, useMemo, useEffect } from "react";
import "../styles/pages/sensors.css";

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
            card to see its details.
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

      {/* MOCK LIVE MAP SECTION */}
      <section className="section">
        <div className="container">
          <MockLiveMap sensors={filteredSensors} />
        </div>
      </section>

      {/* CUSTOM SENSOR BUILD SECTION */}
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

/* === MOCK LIVE MAP COMPONENT (zoomable mock, no external libs) === */

interface MockLiveMapProps {
  sensors: Sensor[];
}

const MockLiveMap: React.FC<MockLiveMapProps> = ({ sensors }) => {
  const [countdown, setCountdown] = useState(8);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 8 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (sensors.length === 0) {
    return (
      <div className="card map-card">
        <div className="map-header-row">
          <div>
            <p className="heading3 mb-2">Deployment Map (Mock)</p>
            <p className="bodytext map-subtitle">
              No sensors match the current filters.
            </p>
          </div>
          <div className="map-meta">
            <span className="map-badge">Mock live</span>
            <span className="map-timer">
              Next mock refresh in {countdown}s
            </span>
          </div>
        </div>
        <div className="map-area" />
      </div>
    );
  }

  // Simple lat/lng → [0,1] projection into our card, then padded visually.
  const lats = sensors.map((s) => s.lat);
  const lngs = sensors.map((s) => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const project = (lat: number, lng: number) => {
    const x =
      minLng === maxLng ? 0.5 : (lng - minLng) / (maxLng - minLng);
    const y =
      minLat === maxLat ? 0.5 : (lat - minLat) / (maxLat - minLat);
    // flip Y so north-ish is up; add padding inside the blue area
    return {
      left: `${10 + x * 80}%`,
      top: `${20 + (1 - y) * 65}%`,
    };
  };

  const zoomIn = () => setZoom((z) => Math.min(2.0, z + 0.2));
  const zoomOut = () => setZoom((z) => Math.max(0.7, z - 0.2));

  return (
    <div className="card map-card">
      <div className="map-header-row">
        <div>
          <p className="heading3 mb-2">Deployment Map (Mock)</p>
          <p className="bodytext map-subtitle">
            Approximate TURTLE sensor locations in the Colombian Caribbean.
            Positions and updates are illustrative only.
          </p>
        </div>
        <div className="map-meta">
          <span className="map-badge">Mock live</span>
          <span className="map-timer">
            Next mock refresh in {countdown}s
          </span>
        </div>
      </div>

      <div className="map-area">
        {/* subtle "islands" / landmasses */}
        <div className="map-island island-roncador" />
        <div className="map-island island-providencia" />
        <div className="map-island island-serrana" />

        {/* zoomable content wrapper */}
        <div
          className="map-inner-zoom"
          style={{ transform: `scale(${zoom})` }}
        >
          {sensors.map((sensor) => {
            const pos = project(sensor.lat, sensor.lng);
            const statusClass =
              sensor.status === "online"
                ? "marker-online"
                : sensor.status === "offline"
                ? "marker-offline"
                : "marker-warning";

            return (
              <div
                key={sensor.id}
                className={`map-marker ${statusClass}`}
                style={pos}
              >
                <div className="map-marker-dot" />
                <div className="map-marker-label">
                  <span className="map-marker-name">{sensor.name}</span>
                  <span className="map-marker-id">
                    {sensor.id} • {sensor.lat.toFixed(2)},{" "}
                    {sensor.lng.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* zoom controls */}
        <div className="map-zoom-controls">
          <button
            type="button"
            className="map-zoom-btn"
            onClick={zoomIn}
          >
            +
          </button>
          <button
            type="button"
            className="map-zoom-btn"
            onClick={zoomOut}
          >
            −
          </button>
        </div>
      </div>

      <div className="map-legend">
        <div className="map-legend-item">
          <span className="map-legend-dot online" />
          <span className="bodytext">Online</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot warning" />
          <span className="bodytext">Warning</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot offline" />
          <span className="bodytext">Offline</span>
        </div>
        <span className="map-legend-note bodytext">
          Map layout and telemetry are mock data for demonstration.
        </span>
      </div>
    </div>
  );
};


export default SensorPage;
