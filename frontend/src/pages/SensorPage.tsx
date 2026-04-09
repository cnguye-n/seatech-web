import React, { useState, useMemo, useEffect, useCallback } from "react";
import "../styles/pages/sensors.css";
import "../styles/pages/DataPage.css";
import {
  MapContainer, TileLayer, CircleMarker, Polyline,
  Popup, Tooltip, LayersControl, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = import.meta.env.VITE_API_URL;
const { BaseLayer, Overlay } = LayersControl;

// ─── types ────────────────────────────────────────────────────────────────────

type UploadRecord = {
  id: number;
  filename: string;
  ping_count: number;
  duplicate_count: number;
  uploaded_at: string | null;
  turtle_name: string | null;
  species: string | null;
  sex: string | null;
  island_origin: string | null;
  notes: string | null;
};

type StoredPing = {
  id: number;
  upload_id: number;
  uptime_min: number;
  batt_v: number;
  batt_pct: number;
  fix_type: number;
  siv: number;
  latitude: number | null;
  longitude: number | null;
  surface_fix: number;
  recorded_at: string | null;
  altitude_m: number | null;
  h_acc_m: number | null;
  speed_mps: number | null;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const TURTLE_COLORS = [
  { stroke: "#006d77", fill: "#83c5be" },
  { stroke: "#e63946", fill: "#f4a3ab" },
  { stroke: "#457b9d", fill: "#a8dadc" },
  { stroke: "#e9c46a", fill: "#f4e4a6" },
  { stroke: "#2a9d8f", fill: "#6ec6b8" },
  { stroke: "#7b2cbf", fill: "#c49bde" },
  { stroke: "#f77f00", fill: "#f9b56a" },
  { stroke: "#264653", fill: "#6b8f9e" },
];

function getColor(i: number) { return TURTLE_COLORS[i % TURTLE_COLORS.length]; }

function battColor(pct: number) {
  if (pct >= 60) return "#2ecc71";
  if (pct >= 30) return "#f39c12";
  return "#e74c3c";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
}

function formatShortTime(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch { return iso; }
}

function buildColorMap(uploads: UploadRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  let i = 0;
  for (const u of [...uploads].sort((a, b) => a.id - b.id)) {
    if (!map.has(u.filename)) { map.set(u.filename, i); i++; }
  }
  return map;
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    map.fitBounds(L.latLngBounds(coords), { padding: [50, 50], animate: true });
  }, [map, coords]);
  return null;
}

// ─── main ─────────────────────────────────────────────────────────────────────

const SensorPage: React.FC = () => {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [pings, setPings] = useState<StoredPing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openSensors, setOpenSensors] = useState<Set<string>>(new Set());
  const [visibleSensors, setVisibleSensors] = useState<Set<string>>(new Set());

  // deletion state
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingPing, setDeletingPing] = useState<number | null>(null);
  const [expandedTurtle, setExpandedTurtle] = useState<string | null>(null);
  const [expandedUploadId, setExpandedUploadId] = useState<number | null>(null);
  const [uploadPingsCache, setUploadPingsCache] = useState<Map<number, StoredPing[]>>(new Map());

  const sensorNames = useMemo(() => Array.from(new Set(uploads.map((u) => u.filename))), [uploads]);
  const colorMap = useMemo(() => buildColorMap(uploads), [uploads]);

  const batterySummary = useMemo(() => {
    const map = new Map<string, StoredPing>();
    for (const p of pings) {
      const upload = uploads.find((u) => u.id === p.upload_id);
      if (!upload) continue;
      const existing = map.get(upload.filename);
      if (!existing || p.uptime_min > existing.uptime_min) {
        map.set(upload.filename, p);
      }
    }
    return map;
  }, [pings, uploads]);

  const pingCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of uploads) map.set(u.filename, (map.get(u.filename) ?? 0) + u.ping_count);
    return map;
  }, [uploads]);

  const metaByName = useMemo(() => {
    const map = new Map<string, UploadRecord>();
    for (const u of [...uploads].sort((a, b) => b.id - a.id)) {
      const existing = map.get(u.filename);
      const hasMeta = u.turtle_name || u.species || u.sex || u.island_origin || u.notes;
      if (!existing || hasMeta) map.set(u.filename, u);
    }
    return map;
  }, [uploads]);

  const uploadsByTurtle = useMemo(() => {
    const map = new Map<string, UploadRecord[]>();
    for (const u of uploads) {
      if (!map.has(u.filename)) map.set(u.filename, []);
      map.get(u.filename)!.push(u);
    }
    return Array.from(map.entries());
  }, [uploads]);

  const mapPings = useMemo(() => pings.filter((p) => {
    if (p.latitude == null || p.longitude == null) return false;
    const upload = uploads.find((u) => u.id === p.upload_id);
    return upload && visibleSensors.has(upload.filename);
  }), [pings, uploads, visibleSensors]);

  const filteredSensors = useMemo(() => {
    const t = search.toLowerCase();
    return sensorNames.filter((n) => n.toLowerCase().includes(t));
  }, [sensorNames, search]);

  const fetchUploads = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/uploads`);
      if (r.ok) {
        const data: UploadRecord[] = await r.json();
        setUploads(data);
        setVisibleSensors(new Set(data.map((u) => u.filename)));
      }
    } catch {}
  }, []);

  const fetchPings = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/tracker-pings`);
      if (r.ok) setPings(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchUploads(), fetchPings()]);
      setLoading(false);
    };
    load();
  }, [fetchUploads, fetchPings]);

  const toggleVisible = (name: string) => {
    setVisibleSensors((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const fetchUploadPings = async (uploadId: number) => {
    try {
      const r = await fetch(`${API_BASE}/api/uploads/${uploadId}/pings`);
      if (r.ok) {
        const data = await r.json();
        setUploadPingsCache((prev) => new Map(prev).set(uploadId, data));
      }
    } catch {}
  };

  const toggleExpandUpload = (uploadId: number) => {
    if (expandedUploadId === uploadId) {
      setExpandedUploadId(null);
    } else {
      setExpandedUploadId(uploadId);
      if (!uploadPingsCache.has(uploadId)) fetchUploadPings(uploadId);
    }
  };

  const handleDeleteUpload = async (uploadId: number) => {
    if (!window.confirm("Delete this entire upload session and all its pings?")) return;
    setDeleting(uploadId);
    try {
      const r = await fetch(`${API_BASE}/api/uploads/${uploadId}`, { method: "DELETE" });
      if (r.ok) { await fetchUploads(); await fetchPings(); setExpandedUploadId(null); }
    } catch {} finally { setDeleting(null); }
  };

  const handleDeletePing = async (pingId: number) => {
    if (!window.confirm("Delete this single ping?")) return;
    setDeletingPing(pingId);
    try {
      const r = await fetch(`${API_BASE}/api/tracker-pings/${pingId}`, { method: "DELETE" });
      if (r.ok) {
        const data = await r.json();
        if (data.upload_id) fetchUploadPings(data.upload_id);
        await fetchUploads();
        await fetchPings();
      }
    } catch {} finally { setDeletingPing(null); }
  };

  const mapGroups = useMemo(() => {
    const groups = new Map<string, StoredPing[]>();
    for (const p of mapPings) {
      const upload = uploads.find((u) => u.id === p.upload_id);
      if (!upload) continue;
      if (!groups.has(upload.filename)) groups.set(upload.filename, []);
      groups.get(upload.filename)!.push(p);
    }
    return Array.from(groups.entries()).map(([name, pingList]) => ({
      name, pings: pingList, color: getColor(colorMap.get(name) ?? 0),
    }));
  }, [mapPings, uploads, colorMap]);

  const mapCoords: [number, number][] = mapPings
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => [p.latitude!, p.longitude!]);

  return (
    <>
      {/* HERO */}
      <main style={{ paddingTop: "2rem", paddingBottom: "1rem" }}>
        <div className="container">
          <p className="heading1" style={{ marginBottom: "0.5rem" }}>Sensor Data</p>
          <p className="bodytext" style={{ color: "#5a8a8f", marginBottom: 0 }}>
            Real-time GPS tracking data from deployed RAK sensors. Click a sensor card to expand its details, or use the map to explore migration paths.
          </p>
        </div>
      </main>

      {loading ? (
        <section className="section">
          <div className="container"><p className="bodytext">Loading sensor data…</p></div>
        </section>
      ) : sensorNames.length === 0 ? (
        <section className="section">
          <div className="container">
            <div className="upload-status-banner info">
              No sensor data uploaded yet. Go to <strong>Manage</strong> to upload tracker CSV files.
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <section style={{ paddingTop: "1.5rem", paddingBottom: "1rem" }}>
            <div className="container">
              <div className="summary-grid mb-6">
                {[
                  { label: "Total Sensors", value: sensorNames.length },
                  { label: "Total Pings", value: pings.length },
                  { label: "GPS Fixes", value: pings.filter((p) => p.latitude != null).length },
                  { label: "Upload Sessions", value: uploads.length },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#fff", border: "1px solid rgba(0,109,119,0.15)", borderRadius: 14, padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem", transition: "box-shadow 0.2s, transform 0.2s" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a8a8f" }}>{label}</span>
                    <span style={{ fontSize: "2rem", fontWeight: 700, color: "#006d77", lineHeight: 1 }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="filters-row mb-6" style={{ justifyContent: "flex-start" }}>
                <input type="text" placeholder="Search sensors…" value={search} onChange={(e) => setSearch(e.target.value)} className="filters-field" style={{ maxWidth: 320 }} />
              </div>

              {/* SENSOR CARDS */}
              <div className="sensor-grid">
                {filteredSensors.map((name) => {
                  const cidx = colorMap.get(name) ?? 0;
                  const color = getColor(cidx);
                  const batt = batterySummary.get(name);
                  const pingCount = pingCounts.get(name) ?? 0;
                  const isActive = openSensors.has(name);
                  const isVisible = visibleSensors.has(name);
                  const meta = metaByName.get(name);
                  const displayName = meta?.turtle_name || name;

                  return (
                    <div
                      key={name}
                      className={`card sensor-card ${isActive ? "is-open" : ""}`}
                      onClick={() => setOpenSensors((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; })}
                      style={{ borderColor: isVisible ? color.stroke : "#ccc" }}
                    >
                      <div className="sensor-card-header">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="sensor-title" style={{ color: color.stroke }}>{displayName}</p>
                          <p className="sensor-id">{name !== displayName ? `${name} · ` : ""}{pingCount} ping{pingCount !== 1 ? "s" : ""}</p>
                        </div>
                        <span style={{ fontSize: "0.7rem", color: color.stroke, transition: "transform 0.3s ease", transform: isActive ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", flexShrink: 0, marginTop: 2 }}>▼</span>
                      </div>

                      <div className={`sensor-card-body-wrapper ${isActive ? "open" : ""}`}>
                        <div className="sensor-card-body">
                          {/* turtle metadata */}
                          {meta && (meta.turtle_name || meta.species || meta.sex || meta.island_origin || meta.notes) && (
                            <div style={{ marginBottom: "0.6rem", paddingBottom: "0.6rem", borderBottom: "1px dashed rgba(131,197,190,0.4)" }}>
                              {[
                                meta.turtle_name && ["Name", meta.turtle_name],
                                meta.species && meta.species !== "Unknown" && ["Species", meta.species],
                                meta.sex && meta.sex !== "Unknown" && ["Sex", meta.sex],
                                meta.island_origin && meta.island_origin !== "Unknown" && ["Island", meta.island_origin],
                                meta.notes && ["Notes", meta.notes],
                              ].filter(Boolean).map(([label, value]) => (
                                <div key={label as string} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", fontSize: "0.83rem", marginBottom: "0.2rem" }}>
                                  <span style={{ color: "#8aa8ab", fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 52, flexShrink: 0 }}>{label}</span>
                                  <span style={{ color: "#2d4a4d", fontWeight: 500 }}>{value}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* latest ping stats */}
                          {batt ? (
                            <>
                              <div className="battery-gauge-wrap" style={{ marginBottom: "0.5rem" }}>
                                <div className="battery-gauge-track">
                                  <div className="battery-gauge-fill" style={{ width: `${Math.min(batt.batt_pct, 100)}%`, background: battColor(batt.batt_pct) }} />
                                </div>
                                <span className="battery-gauge-label" style={{ color: battColor(batt.batt_pct) }}>{batt.batt_pct}%</span>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "0.3rem 1rem", marginTop: "0.5rem", alignItems: "baseline" }}>
                                <span className="bodytext" style={{ color: "#888", fontSize: "0.82rem" }}>Last seen</span>
                                <span className="bodytext">{formatDate(batt.recorded_at)}</span>
                                <span className="bodytext" style={{ color: "#888", fontSize: "0.82rem" }}>Battery</span>
                                <span className="bodytext">{batt.batt_v.toFixed(3)} V · {batt.batt_pct}%</span>
                                <span className="bodytext" style={{ color: "#888", fontSize: "0.82rem" }}>Fix type</span>
                                <span className="bodytext">{batt.fix_type >= 0 ? `${batt.fix_type}D` : "—"}</span>
                                <span className="bodytext" style={{ color: "#888", fontSize: "0.82rem" }}>Satellites</span>
                                <span className="bodytext">{batt.siv >= 0 ? batt.siv : "—"}</span>
                                <span className="bodytext" style={{ color: "#888", fontSize: "0.82rem" }}>Surface fix</span>
                                <span className="bodytext">{batt.surface_fix ? "Yes" : "No"}</span>
                                {batt.altitude_m != null && <><span className="bodytext" style={{ color: "#888", fontSize: "0.82rem" }}>Altitude</span><span className="bodytext">{batt.altitude_m.toFixed(1)} m</span></>}
                                {batt.h_acc_m != null && <><span className="bodytext" style={{ color: "#888", fontSize: "0.82rem" }}>H. accuracy</span><span className="bodytext">{batt.h_acc_m.toFixed(2)} m</span></>}
                                {batt.speed_mps != null && <><span className="bodytext" style={{ color: "#888", fontSize: "0.82rem" }}>Speed</span><span className="bodytext">{batt.speed_mps.toFixed(3)} m/s</span></>}
                              </div>
                            </>
                          ) : (
                            <p className="bodytext" style={{ color: "#999" }}>No ping data yet</p>
                          )}

                          <button className={`sensor-map-toggle${isVisible ? " active" : ""}`} onClick={(e) => { e.stopPropagation(); toggleVisible(name); }}>
                            {isVisible ? "Visible on map" : "Show on map"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* MAP */}
          <section style={{ paddingTop: "1rem", paddingBottom: "1.5rem" }}>
            <div className="container">
              <div style={{ marginBottom: "0.75rem" }}>
                <p className="heading2" style={{ margin: 0, color: "#006d77" }}>Migration Paths</p>
                <p className="bodytext" style={{ margin: "0.25rem 0 0", color: "#5a8a8f", fontSize: "0.9rem" }}>
                  GPS tracks plotted from uploaded sensor data. Each color represents a different turtle.
                </p>
              </div>
              <div className="upload-map-wrap">
                {mapCoords.length === 0 ? (
                  <div className="upload-map-empty">
                    <p>No GPS pings to display.</p>
                    <p className="upload-map-empty-sub">Toggle sensors visible above, or upload data with GPS fixes.</p>
                  </div>
                ) : (
                  <MapContainer center={mapCoords[0]} zoom={8} maxZoom={18} scrollWheelZoom className="leaflet-map" style={{ width: "100%", height: "100%" }}>
                    <FitBounds coords={mapCoords} />
                    <LayersControl position="topright">
                      <BaseLayer checked name="Esri Ocean Basemap">
                        <TileLayer attribution="Tiles &copy; Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}" />
                      </BaseLayer>
                      <BaseLayer name="OpenStreetMap">
                        <TileLayer attribution="&copy; OSM" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      </BaseLayer>
                      <BaseLayer name="Satellite">
                        <TileLayer attribution="Tiles &copy; Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                      </BaseLayer>
                      <Overlay checked name="Ocean Labels">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}" opacity={0.9} zIndex={400} />
                      </Overlay>
                    </LayersControl>

                    {mapGroups.map((group) => {
                      const gc: [number, number][] = group.pings.map((p) => [p.latitude!, p.longitude!]);
                      const meta = metaByName.get(group.name);
                      const label = meta?.turtle_name || group.name;
                      return (
                        <React.Fragment key={group.name}>
                          <Polyline positions={gc} pathOptions={{ color: group.color.stroke, weight: 3, opacity: 0.8 }} />
                          {group.pings.map((p, i) => (
                            <CircleMarker key={p.id} center={[p.latitude!, p.longitude!]} radius={6}
                              pathOptions={{ color: group.color.stroke, fillColor: group.color.fill, fillOpacity: 0.9, weight: 2 }}>
                              <Tooltip direction="top" offset={[0, -8]}>
                                <span style={{ fontWeight: 600 }}>{label}</span><br />
                                Ping #{i + 1}<br />
                                {p.latitude!.toFixed(6)}, {p.longitude!.toFixed(6)}<br />
                                {formatShortTime(p.recorded_at)}
                              </Tooltip>
                              <Popup>
                                <strong>{label}</strong> — Ping #{i + 1}<br />
                                Lat: {p.latitude!.toFixed(6)}<br />Lon: {p.longitude!.toFixed(6)}<br />
                                Time: {formatDate(p.recorded_at)}<br />Battery: {p.batt_pct}%
                                {p.altitude_m != null && <><br />Altitude: {p.altitude_m.toFixed(1)} m</>}
                                {p.speed_mps != null && <><br />Speed: {p.speed_mps.toFixed(2)} m/s</>}
                              </Popup>
                            </CircleMarker>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </MapContainer>
                )}
                {mapGroups.length > 0 && (
                  <div className="upload-map-legend">
                    {mapGroups.map((g) => {
                      const meta = metaByName.get(g.name);
                      return (
                        <div className="upload-legend-item" key={g.name}>
                          <span className="upload-legend-dot" style={{ background: g.color.fill, borderColor: g.color.stroke }} />
                          {meta?.turtle_name || g.name}
                        </div>
                      );
                    })}
                    <div className="upload-legend-item"><span className="upload-legend-line" /> Path</div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* BATTERY STATUS */}
          {batterySummary.size > 0 && (
            <section className="section">
              <div className="container">
                <h3 className="upload-section-title">Sensor Battery Status</h3>
                <div className="battery-summary-grid">
                  {Array.from(batterySummary.entries()).map(([name, b]) => {
                    const meta = metaByName.get(name);
                    return (
                      <div className="battery-card" key={name}>
                        <div className="battery-card-name">{meta?.turtle_name || name}</div>
                        <div className="battery-gauge-wrap">
                          <div className="battery-gauge-track">
                            <div className="battery-gauge-fill" style={{ width: `${Math.min(b.batt_pct, 100)}%`, background: battColor(b.batt_pct) }} />
                          </div>
                          <span className="battery-gauge-label" style={{ color: battColor(b.batt_pct) }}>{b.batt_pct}%</span>
                        </div>
                        <div className="battery-card-detail">{b.batt_v.toFixed(3)} V · last seen {formatDate(b.recorded_at)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── UPLOAD HISTORY + DELETION ── */}
          <section className="section">
            <div className="container">
              <h3 className="upload-section-title">Upload History &amp; Data Management</h3>
              <p className="bodytext" style={{ marginBottom: "1.5rem", color: "#666" }}>
                Expand a sensor to see its upload sessions. You can delete individual pings or entire sessions.
              </p>

              <div className="upload-history-grouped">
                {uploadsByTurtle.map(([filename, turtleUploads]) => {
                  const cidx = colorMap.get(filename) ?? 0;
                  const color = getColor(cidx);
                  const isExpanded = expandedTurtle === filename;
                  const totalPings = turtleUploads.reduce((s, u) => s + u.ping_count, 0);
                  const meta = metaByName.get(filename);
                  const displayName = meta?.turtle_name || filename;

                  return (
                    <div className="upload-history-turtle" key={filename}>
                      <div className="upload-history-turtle-header" onClick={() => setExpandedTurtle(isExpanded ? null : filename)}>
                        <span className="upload-history-turtle-dot" style={{ background: color.fill, borderColor: color.stroke }} />
                        <span className="upload-history-turtle-name">{displayName}</span>
                        {displayName !== filename && <span className="upload-history-turtle-meta" style={{ color: "#999", fontSize: "0.8rem" }}>{filename}</span>}
                        <span className="upload-history-turtle-meta">{turtleUploads.length} session{turtleUploads.length !== 1 ? "s" : ""} · {totalPings} pings</span>
                        <span className={`upload-history-chevron ${isExpanded ? "open" : ""}`}>▸</span>
                      </div>

                      {isExpanded && (
                        <div className="upload-history-turtle-entries">
                          {turtleUploads.map((u) => {
                            const isUploadExpanded = expandedUploadId === u.id;
                            const pingsForUpload = uploadPingsCache.get(u.id) || [];
                            return (
                              <div key={u.id}>
                                <div className="upload-history-entry">
                                  <div className="upload-history-entry-info" onClick={() => toggleExpandUpload(u.id)} style={{ cursor: "pointer", flex: 1 }}>
                                    <span className={`upload-history-entry-chevron ${isUploadExpanded ? "open" : ""}`}>▸</span>
                                    <span className="upload-history-entry-id">#{u.id}</span>
                                    <span>{u.ping_count} pings</span>
                                    {u.duplicate_count > 0 && <span className="upload-history-entry-dupes">{u.duplicate_count} dupes skipped</span>}
                                    <span className="upload-history-entry-date">{formatDate(u.uploaded_at)}</span>
                                  </div>
                                  <button
                                    className="upload-btn-delete"
                                    onClick={() => handleDeleteUpload(u.id)}
                                    disabled={deleting === u.id}
                                    title="Delete entire upload session and all its pings"
                                  >
                                    {deleting === u.id ? "…" : "Delete All"}
                                  </button>
                                </div>

                                {isUploadExpanded && (
                                  <div className="upload-history-pings">
                                    {pingsForUpload.length === 0 ? (
                                      <div className="upload-history-ping-row" style={{ color: "#999", fontStyle: "italic" }}>Loading pings…</div>
                                    ) : (
                                      pingsForUpload.map((p, pi) => (
                                        <div className="upload-history-ping-row" key={p.id} style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.4rem", padding: "0.6rem 0.75rem" }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                            <span className="upload-history-ping-num" style={{ fontWeight: 700 }}>#{pi + 1} &nbsp;<span style={{ color: "#999", fontWeight: 400, fontSize: "0.8rem" }}>{formatDate(p.recorded_at)}</span></span>
                                            <button
                                              className="upload-btn-delete-sm"
                                              onClick={() => handleDeletePing(p.id)}
                                              disabled={deletingPing === p.id}
                                              title="Delete this single ping"
                                            >
                                              {deletingPing === p.id ? "…" : "✕"}
                                            </button>
                                          </div>
                                          <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr max-content 1fr", gap: "0.2rem 1.2rem", fontSize: "0.82rem", width: "100%" }}>
                                            <span style={{ color: "#888" }}>Position</span>
                                            <span>{p.latitude != null ? `${p.latitude.toFixed(6)}, ${p.longitude!.toFixed(6)}` : "No GPS"}</span>
                                            <span style={{ color: "#888" }}>Battery</span>
                                            <span>{p.batt_v.toFixed(3)} V · {p.batt_pct}%</span>
                                            <span style={{ color: "#888" }}>Fix type</span>
                                            <span>{p.fix_type >= 0 ? `${p.fix_type}D` : "—"}</span>
                                            <span style={{ color: "#888" }}>Satellites</span>
                                            <span>{p.siv >= 0 ? p.siv : "—"}</span>
                                            <span style={{ color: "#888" }}>Surface fix</span>
                                            <span>{p.surface_fix ? "Yes" : "No"}</span>
                                            <span style={{ color: "#888" }}>Uptime</span>
                                            <span>{p.uptime_min.toFixed(2)} min</span>
                                            {p.altitude_m != null && <><span style={{ color: "#888" }}>Altitude</span><span>{p.altitude_m.toFixed(1)} m</span></>}
                                            {p.h_acc_m != null && <><span style={{ color: "#888" }}>H. accuracy</span><span>{p.h_acc_m.toFixed(2)} m</span></>}
                                            {p.speed_mps != null && <><span style={{ color: "#888" }}>Speed</span><span>{p.speed_mps.toFixed(3)} m/s</span></>}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {/* SENSOR BUILD */}
      <section className="section">
        <div className="container">
          <p className="heading2 mb-4">Our Custom Sensor Build</p>
          <p className="bodytext mb-4">A snapshot of the sensor we built and the components we selected.</p>
          <div className="sensor-build-grid">
            <div className="card sensor-build-card">
              <p className="heading3">Sensor Overview</p>
              <div className="sensor-placeholder-image">Main sensor photo / CAD render</div>
              <p className="bodytext sensor-placeholder-text">Placeholder: enclosure, waterproofing, mounting strategy, dimensions.</p>
            </div>
            <div className="card sensor-build-card">
              <p className="heading3">Key Components</p>
              <div className="sensor-placeholder-image small">PCB / components layout image</div>
              <ul className="bodytext sensor-parts-list">
                <li><strong>Microcontroller:</strong> Low-power MCU for remote deployments.</li>
                <li><strong>Sensors:</strong> Temperature / motion / pressure modules.</li>
                <li><strong>Power:</strong> Battery / solar design and expected runtime.</li>
                <li><strong>Connectivity:</strong> LoRa / LTE / satellite coverage rationale.</li>
              </ul>
            </div>
            <div className="card sensor-build-card">
              <p className="heading3">Design Rationale</p>
              <p className="bodytext sensor-placeholder-text">Trade-offs between accuracy, durability, cost, and serviceability in island/marine environments.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SensorPage;