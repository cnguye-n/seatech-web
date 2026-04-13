import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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

function ZoomToSensor({ coords, trigger }: { coords: [number, number][]; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger === 0 || coords.length === 0) return;
    map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], animate: true });
  }, [trigger]);
  return null;
}

// ─── main ─────────────────────────────────────────────────────────────────────

const SensorPage: React.FC = () => {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [pings, setPings] = useState<StoredPing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openSensors, setOpenSensors] = useState<Set<string>>(new Set());
  const [zoomTarget, setZoomTarget] = useState<{ name: string; trigger: number } | null>(null);

  // export state
  const defaultDateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const defaultDateTo = new Date().toISOString().slice(0, 10);
  const [exportFrom, setExportFrom] = useState(defaultDateFrom);
  const [exportTo, setExportTo] = useState(defaultDateTo);
  const [exportSensors, setExportSensors] = useState<Set<string>>(new Set(["__all__"]));
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

  const handleExport = () => {
    const fromTs = new Date(exportFrom + "T00:00:00Z").getTime();
    const toTs = new Date(exportTo + "T23:59:59Z").getTime();
    const allSensors = exportSensors.has("__all__");

    const filtered = pings.filter((p) => {
      if (!p.recorded_at) return false;
      const ts = new Date(p.recorded_at).getTime();
      if (ts < fromTs || ts > toTs) return false;
      const upload = uploads.find((u) => u.id === p.upload_id);
      if (!upload) return false;
      if (!allSensors && !exportSensors.has(upload.filename)) return false;
      return true;
    });

    if (filtered.length === 0) {
      alert("No pings found for the selected filters.");
      return;
    }

    const headers = ["sensor","turtle_name","recorded_at","uptime_min","latitude","longitude","altitude_m","h_acc_m","speed_mps","batt_v","batt_pct","fix_type","siv","surface_fix"];
    const rows = filtered.map((p) => {
      const upload = uploads.find((u) => u.id === p.upload_id);
      const meta = upload ? metaByName.get(upload.filename) : null;
      const val = (v: number | null | undefined) => v != null ? v : "";
      return [
        upload?.filename ?? "",
        meta?.turtle_name ?? "",
        p.recorded_at ?? "",
        p.uptime_min,
        val(p.latitude),
        val(p.longitude),
        val(p.altitude_m),
        val(p.h_acc_m),
        val(p.speed_mps),
        p.batt_v,
        p.batt_pct,
        p.fix_type,
        p.siv,
        p.surface_fix,
      ].map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v));
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seatech_export_${exportFrom}_to_${exportTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExportSensor = (name: string) => {
    setExportSensors((prev) => {
      const next = new Set(prev);
      if (name === "__all__") return new Set(["__all__"]);
      next.delete("__all__");
      next.has(name) ? next.delete(name) : next.add(name);
      if (next.size === 0) return new Set(["__all__"]);
      return next;
    });
  };

  return (
    <>
      {/* HERO */}
      <main style={{ paddingTop: "2rem", paddingBottom: "1rem" }}>
        <div className="container">
          <p className="heading1" style={{ marginBottom: "0.5rem" }}>Turtle Tracking</p>
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
                              ].filter(Boolean).map((item) => { const [label, value] = item as [string, string]; return (
                                <div key={label as string} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", fontSize: "0.83rem", marginBottom: "0.2rem" }}>
                                  <span style={{ color: "#8aa8ab", fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 52, flexShrink: 0 }}>{label}</span>
                                  <span style={{ color: "#2d4a4d", fontWeight: 500 }}>{value}</span>
                                </div>
                              ); })}
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

                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleVisible(name); }}
                              style={{
                                padding: "0.35rem 0.85rem",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                borderRadius: "8px",
                                border: `1.5px solid ${isVisible ? color.stroke : "#ccc"}`,
                                background: isVisible ? color.stroke : "transparent",
                                color: isVisible ? "#fff" : "#999",
                                cursor: "pointer",
                                transition: "all 0.18s ease",
                              }}
                            >
                              {isVisible ? "Visible" : "Hidden"}
                            </button>
                            {isVisible && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const sensorPings = pings.filter((p) => {
                                    const u = uploads.find((u) => u.id === p.upload_id);
                                    return u?.filename === name && p.latitude != null && p.longitude != null;
                                  });
                                  if (sensorPings.length > 0) {
                                    setZoomTarget({ name, trigger: Date.now() });
                                  }
                                }}
                                style={{
                                  padding: "0.35rem 0.85rem",
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  borderRadius: "8px",
                                  border: `1.5px solid ${color.stroke}`,
                                  background: "transparent",
                                  color: color.stroke,
                                  cursor: "pointer",
                                  transition: "all 0.18s ease",
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = color.fill; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                              >
                                Zoom to path
                              </button>
                            )}
                          </div>
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
                    {zoomTarget && (() => {
                      const sensorCoords: [number, number][] = pings
                        .filter((p) => {
                          const u = uploads.find((u) => u.id === p.upload_id);
                          return u?.filename === zoomTarget.name && p.latitude != null && p.longitude != null;
                        })
                        .map((p) => [p.latitude!, p.longitude!]);
                      return <ZoomToSensor coords={sensorCoords} trigger={zoomTarget.trigger} />;
                    })()}
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
          {/* ── EXPORT ── */}
          {(() => {
            const fromTs = new Date(exportFrom + "T00:00:00Z").getTime();
            const toTs = new Date(exportTo + "T23:59:59Z").getTime();
            const allSensors = exportSensors.has("__all__");
            const previewPings = pings.filter((p) => {
              if (!p.recorded_at) return false;
              const ts = new Date(p.recorded_at).getTime();
              if (ts < fromTs || ts > toTs) return false;
              const upload = uploads.find((u) => u.id === p.upload_id);
              if (!upload) return false;
              if (!allSensors && !exportSensors.has(upload.filename)) return false;
              return true;
            }).sort((a, b) => new Date(a.recorded_at!).getTime() - new Date(b.recorded_at!).getTime());

            return (
              <section style={{ paddingTop: "1rem", paddingBottom: "1.5rem" }}>
                <div className="container">
                  <h3 className="upload-section-title">Export Data</h3>
                  <p className="bodytext" style={{ marginBottom: "1.25rem", color: "#666", fontSize: "0.9rem" }}>
                    Download ping data as a CSV. Filter by date range and sensor.
                  </p>

                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>

                    {/* ── LEFT: controls ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: "0 0 340px", minWidth: 260 }}>

                      {/* date range */}
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600, color: "#5a8a8f" }}>
                          From
                          <input
                            type="date"
                            value={exportFrom}
                            onChange={(e) => setExportFrom(e.target.value)}
                            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1.5px solid rgba(0,109,119,0.25)", fontSize: "0.88rem", color: "#2d4a4d", outline: "none" }}
                          />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600, color: "#5a8a8f" }}>
                          To
                          <input
                            type="date"
                            value={exportTo}
                            onChange={(e) => setExportTo(e.target.value)}
                            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1.5px solid rgba(0,109,119,0.25)", fontSize: "0.88rem", color: "#2d4a4d", outline: "none" }}
                          />
                        </label>
                      </div>

                      {/* sensor selector */}
                      <div>
                        <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#5a8a8f", marginBottom: "0.5rem" }}>Sensors</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          <button
                            onClick={() => setExportSensors(new Set(["__all__"]))}
                            style={{
                              padding: "0.35rem 0.85rem", fontSize: "0.78rem", fontWeight: 600,
                              borderRadius: 8, cursor: "pointer", transition: "all 0.15s ease",
                              border: `1.5px solid ${exportSensors.has("__all__") ? "#006d77" : "rgba(0,109,119,0.25)"}`,
                              background: exportSensors.has("__all__") ? "#006d77" : "transparent",
                              color: exportSensors.has("__all__") ? "#fff" : "#5a8a8f",
                            }}
                          >
                            All sensors
                          </button>
                          {sensorNames.map((name) => {
                            const meta = metaByName.get(name);
                            const label = meta?.turtle_name || name;
                            const cidx = colorMap.get(name) ?? 0;
                            const color = getColor(cidx);
                            const selected = exportSensors.has(name) && !exportSensors.has("__all__");
                            return (
                              <button
                                key={name}
                                onClick={() => toggleExportSensor(name)}
                                style={{
                                  padding: "0.35rem 0.85rem", fontSize: "0.78rem", fontWeight: 600,
                                  borderRadius: 8, cursor: "pointer", transition: "all 0.15s ease",
                                  border: `1.5px solid ${selected ? color.stroke : "rgba(0,109,119,0.2)"}`,
                                  background: selected ? color.stroke : "transparent",
                                  color: selected ? "#fff" : "#5a8a8f",
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* download button */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <button
                          onClick={handleExport}
                          style={{
                            padding: "0.6rem 1.5rem", fontSize: "0.88rem", fontWeight: 700,
                            borderRadius: 10, border: "none", background: "#006d77", color: "#fff",
                            cursor: "pointer", transition: "background 0.18s ease",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#005a63"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#006d77"; }}
                        >
                          Download CSV
                        </button>
                        <span style={{ fontSize: "0.78rem", color: "#8aa8ab" }}>
                          {previewPings.length} ping{previewPings.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                    </div>

                    {/* ── RIGHT: scrollable preview ── */}
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                        <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#5a8a8f", margin: 0 }}>Preview</p>
                        <span style={{ fontSize: "0.75rem", color: "#aac8cb" }}>{previewPings.length} rows</span>
                      </div>
                      <div style={{
                        border: "1.5px solid rgba(131,197,190,0.35)",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#fff",
                      }}>
                        {/* header row */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1.4fr 0.9fr 0.9fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr",
                          padding: "0.5rem 0.75rem",
                          background: "rgba(131,197,190,0.1)",
                          borderBottom: "1px solid rgba(131,197,190,0.3)",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "#5a8a8f",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          gap: "0.4rem",
                        }}>
                          <span>Sensor</span>
                          <span>Time</span>
                          <span>Lat</span>
                          <span>Lon</span>
                          <span>Batt</span>
                          <span>Fix</span>
                          <span>Alt (m)</span>
                          <span>H.Acc</span>
                          <span>Spd</span>
                        </div>
                        {/* scrollable rows */}
                        <div style={{ maxHeight: 320, overflowY: "auto" }}>
                          {previewPings.length === 0 ? (
                            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#aac8cb", fontSize: "0.85rem" }}>
                              No pings match the current filters
                            </div>
                          ) : (
                            previewPings.map((p, i) => {
                              const upload = uploads.find((u) => u.id === p.upload_id);
                              const meta = upload ? metaByName.get(upload.filename) : null;
                              const label = meta?.turtle_name || upload?.filename || "—";
                              const cidx = colorMap.get(upload?.filename ?? "") ?? 0;
                              const color = getColor(cidx);
                              return (
                                <div
                                  key={p.id}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1.4fr 0.9fr 0.9fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr",
                                    padding: "0.45rem 0.75rem",
                                    borderBottom: i < previewPings.length - 1 ? "1px solid rgba(131,197,190,0.15)" : "none",
                                    fontSize: "0.76rem",
                                    color: "#2d4a4d",
                                    background: i % 2 === 0 ? "#fff" : "rgba(131,197,190,0.03)",
                                    gap: "0.4rem",
                                    alignItems: "center",
                                  }}
                                >
                                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflow: "hidden" }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color.stroke, flexShrink: 0 }} />
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: color.stroke, fontWeight: 600 }}>{label}</span>
                                  </span>
                                  <span style={{ color: "#8aa8ab", fontSize: "0.72rem" }}>{formatShortTime(p.recorded_at)}</span>
                                  <span>{p.latitude != null ? p.latitude.toFixed(4) : "—"}</span>
                                  <span>{p.longitude != null ? p.longitude.toFixed(4) : "—"}</span>
                                  <span style={{ color: battColor(p.batt_pct), fontWeight: 600 }}>{p.batt_pct}%</span>
                                  <span>
                                    <span style={{
                                      display: "inline-block",
                                      padding: "0.1rem 0.35rem",
                                      borderRadius: 4,
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      background: p.fix_type >= 2 ? "rgba(46,204,113,0.12)" : "rgba(180,180,180,0.15)",
                                      color: p.fix_type >= 2 ? "#2ecc71" : "#aaa",
                                    }}>
                                      {p.fix_type >= 2 ? `${p.fix_type}D` : "—"}
                                    </span>
                                  </span>
                                  <span style={{ color: "#5a8a8f" }}>{p.altitude_m != null ? p.altitude_m.toFixed(1) : "—"}</span>
                                  <span style={{ color: "#5a8a8f" }}>{p.h_acc_m != null ? p.h_acc_m.toFixed(2) : "—"}</span>
                                  <span style={{ color: "#5a8a8f" }}>{p.speed_mps != null ? p.speed_mps.toFixed(2) : "—"}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </section>
            );
          })()}

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