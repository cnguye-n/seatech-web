import React, { useState, useMemo } from "react";
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
  },
  {
    id: "SENSOR-002",
    name: "TURTLE-2",
    type: "Motion",
    location: "Isla Providencia y Santa Catalina",
    status: "warning",
    lastReading: "12.3",
    lastUpdated: "5 min ago",
  },
  {
    id: "SENSOR-003",
    name: "TURTLE-3",
    type: "Pressure",
    location: "Isla Menor Cayo Serrana",
    status: "offline",
    lastReading: "-",
    lastUpdated: "1 hr ago",
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
          <p className="heading1 mb-4">Sensor</p>
          <p className="bodytext">
            Overview for all the sensors we currently have.  Click on a sensor for more information.
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
            {/* 1. Sensor overview */}
            <div className="card sensor-build-card">
              <p className="heading3">Sensor Overview</p>
              <div className="sensor-placeholder-image">
                Main sensor photo / CAD render
              </div>
              <p className="bodytext sensor-placeholder-text">
                Placeholder text
              </p>
            </div>

            {/* 2. Parts we chose */}
            <div className="card sensor-build-card">
              <p className="heading3">Key Components</p>
              <div className="sensor-placeholder-image small">
                PCB / components layout image
              </div>
              <ul className="bodytext sensor-parts-list">
                <li>
                  <strong>Microcontroller:</strong> Placeholder text
                </li>
                <li>
                  <strong>Sensors:</strong> Placeholder text
                </li>
                <li>
                  <strong>Power:</strong> Placeholder text
                </li>
                <li>
                  <strong>Connectivity:</strong> Placeholder text. I'm so tired.
                </li>
              </ul>
            </div>

            {/* 3. How we designed it */}
            <div className="card sensor-build-card">
              <p className="heading3">Design Rationale</p>
              <p className="bodytext sensor-placeholder-text">
                A lot of placeholder text
              </p>
              <p className="bodytext sensor-placeholder-text">
                Last placeholder text
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

export default SensorPage;
