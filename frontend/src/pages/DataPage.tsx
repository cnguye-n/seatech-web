import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { DragEvent, ChangeEvent } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  Tooltip,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/pages/DataPage.css";

const API_BASE = import.meta.env.VITE_API_URL;
const { BaseLayer, Overlay } = LayersControl;

type PingRow = {
  sourceFile: string;
  uptimeMin: number;
  battV: number;
  battPct: number;
  fixType: number;
  siv: number;
  latitude: number | null;
  longitude: number | null;
  surfaceFix: number;
  hasGps: boolean;
  isDuplicate: boolean;
  selected: boolean;
  recordedAt: string | null;
};

type ParseResult = {
  rows: PingRow[];
  totalRows: number;
  gpsRows: number;
  noGpsRows: number;
  duplicateCount: number;
  alreadyProcessed: boolean;
  error: string | null;
  fileNames: string[];
};

type UploadRecord = {
  id: number;
  filename: string;
  ping_count: number;
  duplicate_count: number;
  uploaded_at: string | null;
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
};

// csv parser

const REQUIRED_COLUMNS = [
  "uptime_min", "batt_v", "batt_pct", "fixType",
  "siv", "lat_1e7", "lon_1e7", "surfaceFix",
];

function parseSingleCSV(text: string, fileName: string, uploadTimestamp: string): ParseResult {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { rows: [], totalRows: 0, gpsRows: 0, noGpsRows: 0, duplicateCount: 0, alreadyProcessed: false, error: `${fileName}: File is empty or has no data rows.`, fileNames: [fileName] };
  }

  const rawHeaders = lines[0].split(",").map((h) => h.trim());
  const lowerHeaders = rawHeaders.map((h) => h.toLowerCase());

  if (lowerHeaders.includes("seq_no") || (lowerHeaders.includes("table") && lowerHeaders.includes("row_count"))) {
    return { rows: [], totalRows: 0, gpsRows: 0, noGpsRows: 0, duplicateCount: 0, alreadyProcessed: true, error: null, fileNames: [fileName] };
  }

  const missing = REQUIRED_COLUMNS.filter((col) => !rawHeaders.includes(col));
  if (missing.length > 0) {
    return {
      rows: [], totalRows: 0, gpsRows: 0, noGpsRows: 0, duplicateCount: 0, alreadyProcessed: false,
      error: `${fileName}: Missing columns: ${missing.join(", ")}. Found: ${rawHeaders.join(", ")}`,
      fileNames: [fileName],
    };
  }

  const idx = Object.fromEntries(rawHeaders.map((h, i) => [h, i])) as Record<string, number>;
  const baseTime = new Date(uploadTimestamp).getTime();
  const seen = new Set<string>();
  const rows: PingRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim());

    const uptimeMin = parseFloat(cols[idx["uptime_min"]] ?? "0");
    const battV = parseFloat(cols[idx["batt_v"]] ?? "0");
    const battPct = parseInt(cols[idx["batt_pct"]] ?? "0", 10);
    const fixType = parseInt(cols[idx["fixType"]] ?? "-1", 10);
    const siv = parseInt(cols[idx["siv"]] ?? "-1", 10);
    const rawLat = cols[idx["lat_1e7"]] ?? "";
    const rawLon = cols[idx["lon_1e7"]] ?? "";
    const surfaceFix = parseInt(cols[idx["surfaceFix"]] ?? "0", 10);

    let latitude: number | null = null;
    let longitude: number | null = null;
    if (rawLat !== "" && rawLon !== "") {
      const latVal = parseFloat(rawLat);
      const lonVal = parseFloat(rawLon);
      if (!isNaN(latVal) && !isNaN(lonVal)) {
        latitude = Math.abs(latVal) > 1000 ? latVal / 1e7 : latVal;
        longitude = Math.abs(lonVal) > 1000 ? lonVal / 1e7 : lonVal;
      }
    }

    const hasGps = latitude !== null && longitude !== null && fixType >= 2;
    const recordedAt = new Date(baseTime + uptimeMin * 60 * 1000).toISOString();
    const fp = `${fileName}|${uptimeMin}|${latitude}|${longitude}`;
    const isDuplicate = seen.has(fp);
    seen.add(fp);

    rows.push({
      sourceFile: fileName, uptimeMin, battV, battPct: isNaN(battPct) ? 0 : battPct,
      fixType, siv, latitude, longitude, surfaceFix, hasGps, isDuplicate,
      selected: hasGps && !isDuplicate, recordedAt,
    });
  }

  return {
    rows, totalRows: rows.length,
    gpsRows: rows.filter((r) => r.hasGps).length,
    noGpsRows: rows.filter((r) => !r.hasGps).length,
    duplicateCount: rows.filter((r) => r.isDuplicate).length,
    alreadyProcessed: false, error: null, fileNames: [fileName],
  };
}

function mergeResults(results: ParseResult[]): ParseResult {
  const errors = results.filter((r) => r.error).map((r) => r.error!);
  const processed = results.some((r) => r.alreadyProcessed);
  const allRows = results.flatMap((r) => r.rows);
  const allFiles = results.flatMap((r) => r.fileNames);
  return {
    rows: allRows, totalRows: allRows.length,
    gpsRows: allRows.filter((r) => r.hasGps).length,
    noGpsRows: allRows.filter((r) => !r.hasGps).length,
    duplicateCount: allRows.filter((r) => r.isDuplicate).length,
    alreadyProcessed: processed && allRows.length === 0,
    error: errors.length > 0 ? errors.join("\n") : null, fileNames: allFiles,
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function formatShortTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return iso; }
}

// battery gauge color!
function battColor(pct: number): string {
  if (pct >= 60) return "#2ecc71";
  if (pct >= 30) return "#f39c12";
  return "#e74c3c";
}

// Each upload_id (CSV file / sensor) gets its own color.
const TURTLE_COLORS = [
  { stroke: "#006d77", fill: "#83c5be", name: "Teal" },
  { stroke: "#e63946", fill: "#f4a3ab", name: "Red" },
  { stroke: "#457b9d", fill: "#a8dadc", name: "Blue" },
  { stroke: "#e9c46a", fill: "#f4e4a6", name: "Gold" },
  { stroke: "#2a9d8f", fill: "#6ec6b8", name: "Mint" },
  { stroke: "#7b2cbf", fill: "#c49bde", name: "Purple" },
  { stroke: "#f77f00", fill: "#f9b56a", name: "Orange" },
  { stroke: "#264653", fill: "#6b8f9e", name: "Slate" },
];

function getColorForIndex(i: number) {
  return TURTLE_COLORS[i % TURTLE_COLORS.length];
}

// build a stable color map: filename → color index
function buildColorMap(uploads: UploadRecord[]): Map<string, number> {
  const seen = new Map<string, number>();
  const sorted = [...uploads].sort((a, b) => a.id - b.id);
  let idx = 0;
  for (const u of sorted) {
    if (!seen.has(u.filename)) {
      seen.set(u.filename, idx);
      idx++;
    }
  }
  return seen;
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
  }, [map, coords]);
  return null;
}

function PingMap({ pings, uploads, visibleUploadIds }: {
  pings: StoredPing[];
  uploads: UploadRecord[];
  visibleUploadIds: Set<number>;
}) {
  const colorMap = useMemo(() => buildColorMap(uploads), [uploads]);

  const filteredPings = pings.filter(
    (p) => p.latitude != null && p.longitude != null && visibleUploadIds.has(p.upload_id)
  );
  const coords: [number, number][] = filteredPings.map((p) => [p.latitude!, p.longitude!]);

  // group by upload_id
  const groups = useMemo(() => {
    const map = new Map<number, StoredPing[]>();
    for (const p of filteredPings) {
      if (!map.has(p.upload_id)) map.set(p.upload_id, []);
      map.get(p.upload_id)!.push(p);
    }
    return Array.from(map.entries()).map(([uid, pings]) => {
      const upload = uploads.find((u) => u.id === uid);
      const fname = upload?.filename ?? `Sensor #${uid}`;
      const cidx = colorMap.get(fname) ?? 0;
      const color = getColorForIndex(cidx);
      return { uploadId: uid, pings, color, label: fname };
    });
  }, [filteredPings, uploads, colorMap]);

  if (coords.length === 0) {
    return (
      <div className="upload-map-empty">
        <p>No GPS-fixed pings to display on map.</p>
        <p className="upload-map-empty-sub">Upload a CSV with valid GPS coordinates, or adjust filters.</p>
      </div>
    );
  }

  return (
    <div className="upload-map-wrap">
      <MapContainer center={coords[0]} zoom={10} maxZoom={18} scrollWheelZoom className="leaflet-map" style={{ width: "100%", height: "100%" }}>
        <FitBounds coords={coords} />
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

        {groups.map((group) => {
          const gc: [number, number][] = group.pings.map((p) => [p.latitude!, p.longitude!]);
          return (
            <React.Fragment key={group.uploadId}>
              <Polyline positions={gc} pathOptions={{ color: group.color.stroke, weight: 3, opacity: 0.8 }} />
              {group.pings.map((p, i) => (
                <CircleMarker key={p.id} center={[p.latitude!, p.longitude!]} radius={6}
                  pathOptions={{ color: group.color.stroke, fillColor: group.color.fill, fillOpacity: 0.9, weight: 2 }}>
                  <Tooltip direction="top" offset={[0, -8]}>
                    <span style={{ fontWeight: 600 }}>{group.label}</span><br />
                    Ping #{i + 1}<br />
                    {p.latitude!.toFixed(6)}, {p.longitude!.toFixed(6)}<br />
                    {formatShortTime(p.recorded_at)}
                  </Tooltip>
                  <Popup>
                    <strong>{group.label}</strong> — Ping #{i + 1}<br />
                    Lat: {p.latitude!.toFixed(6)}<br />Lon: {p.longitude!.toFixed(6)}<br />
                    Time: {formatDate(p.recorded_at)}
                    <br />Battery: {p.batt_pct}%
                  </Popup>
                </CircleMarker>
              ))}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* legend showing each turtle/sensor color */}
      {groups.length > 0 && (
        <div className="upload-map-legend">
          {groups.map((g) => (
            <div className="upload-legend-item" key={g.uploadId}>
              <span className="upload-legend-dot" style={{ background: g.color.fill, borderColor: g.color.stroke }} />
              {g.label}
            </div>
          ))}
          <div className="upload-legend-item"><span className="upload-legend-line" /> Path</div>
        </div>
      )}
    </div>
  );
}

// section going over data uploading

export function UploadDataSection() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [highlight, setHighlight] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ saved: number; duplicates_skipped: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedStoredRow, setExpandedStoredRow] = useState<number | null>(null);
  const [uploadTimestamp, setUploadTimestamp] = useState<string>(new Date().toISOString().slice(0, 16));
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [storedPings, setStoredPings] = useState<StoredPing[]>([]);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [visibleUploadIds, setVisibleUploadIds] = useState<Set<number>>(new Set());
  const [expandedTurtle, setExpandedTurtle] = useState<string | null>(null);
  const [expandedUploadId, setExpandedUploadId] = useState<number | null>(null);
  const [uploadPingsCache, setUploadPingsCache] = useState<Map<number, StoredPing[]>>(new Map());
  const [deletingPing, setDeletingPing] = useState<number | null>(null);

  const fetchUploads = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/uploads`);
      if (r.ok) {
        const data: UploadRecord[] = await r.json();
        setUploads(data);
        // auto-show all uploads on map
        setVisibleUploadIds(new Set(data.map((u) => u.id)));
      }
    } catch {}
  }, []);

  const fetchStoredPings = useCallback(async () => {
    try {
      let url = `${API_BASE}/api/tracker-pings`;
      const p = new URLSearchParams();
      if (dateStart) p.set("start", dateStart);
      if (dateEnd) p.set("end", dateEnd);
      if (p.toString()) url += `?${p}`;
      const r = await fetch(url);
      if (r.ok) setStoredPings(await r.json());
    } catch {}
  }, [dateStart, dateEnd]);

  useEffect(() => { fetchUploads(); }, [fetchUploads]);
  useEffect(() => { fetchStoredPings(); }, [fetchStoredPings]);

  const mapPings = useMemo(() => {
    const withGps = storedPings.filter((p) => p.latitude != null && p.longitude != null);
    if (!dateStart && !dateEnd) return withGps.slice(-100);
    return withGps;
  }, [storedPings, dateStart, dateEnd]);

  // group uploads by filename (turtle name)
  const uploadsByTurtle = useMemo(() => {
    const map = new Map<string, UploadRecord[]>();
    for (const u of uploads) {
      if (!map.has(u.filename)) map.set(u.filename, []);
      map.get(u.filename)!.push(u);
    }
    return Array.from(map.entries());
  }, [uploads]);

  const colorMap = useMemo(() => buildColorMap(uploads), [uploads]);

  // shows a summary of the battery
  const batterySummary = useMemo(() => {
    const byFilename = new Map<string, { battPct: number; battV: number; uptimeMin: number; uploadIds: number[] }>();
    for (const p of storedPings) {
      const upload = uploads.find((u) => u.id === p.upload_id);
      const fname = upload?.filename ?? `Upload #${p.upload_id}`;
      const existing = byFilename.get(fname);
      if (!existing || p.uptime_min > existing.uptimeMin) {
        byFilename.set(fname, {
          battPct: p.batt_pct, battV: p.batt_v, uptimeMin: p.uptime_min,
          uploadIds: existing ? [...existing.uploadIds, p.upload_id] : [p.upload_id],
        });
      } else if (!existing.uploadIds.includes(p.upload_id)) {
        existing.uploadIds.push(p.upload_id);
      }
    }
    return Array.from(byFilename.entries()).map(([filename, data]) => ({ filename, ...data }));
  }, [storedPings, uploads]);

  // toggle a specific upload_id on the map
  const toggleUploadVisibility = (uploadId: number) => {
    setVisibleUploadIds((prev) => {
      const next = new Set(prev);
      if (next.has(uploadId)) next.delete(uploadId);
      else next.add(uploadId);
      return next;
    });
  };

  // toggle all uploads for a turtle (by filename)
  const toggleTurtleVisibility = (filename: string) => {
    const turtleUploads = uploads.filter((u) => u.filename === filename);
    const ids = turtleUploads.map((u) => u.id);
    const allVisible = ids.every((id) => visibleUploadIds.has(id));
    setVisibleUploadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => allVisible ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const showAll = () => setVisibleUploadIds(new Set(uploads.map((u) => u.id)));
  const hideAll = () => setVisibleUploadIds(new Set());

  // accepts multiple csv files
  const processFiles = useCallback((fileList: File[]) => {
    const csvFiles = fileList.filter((f) => f.name.toLowerCase().endsWith(".csv"));
    if (csvFiles.length === 0) {
      setResult({ rows: [], totalRows: 0, gpsRows: 0, noGpsRows: 0, duplicateCount: 0, alreadyProcessed: false, error: "No valid .csv files found.", fileNames: [] });
      setFiles([]);
      return;
    }
    setFiles(csvFiles);
    setSubmitted(false);
    setSubmitResult(null);
    setSubmitError(null);
    setExpandedRow(null);

    let loaded = 0;
    const results: ParseResult[] = [];
    csvFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        results.push(parseSingleCSV(e.target?.result as string, f.name, uploadTimestamp));
        loaded++;
        if (loaded === csvFiles.length) setResult(mergeResults(results));
      };
      reader.onerror = () => {
        results.push({ rows: [], totalRows: 0, gpsRows: 0, noGpsRows: 0, duplicateCount: 0, alreadyProcessed: false, error: `Failed to read ${f.name}`, fileNames: [f.name] });
        loaded++;
        if (loaded === csvFiles.length) setResult(mergeResults(results));
      };
      reader.readAsText(f);
    });
  }, [uploadTimestamp]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setHighlight(false); processFiles(Array.from(e.dataTransfer.files)); };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setHighlight(true); };
  const onDragLeave = () => setHighlight(false);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) processFiles(Array.from(e.target.files)); };
  const onZoneClick = () => inputRef.current?.click();

  const toggleRow = (i: number) => {
    if (!result) return;
    const updated = [...result.rows];
    updated[i] = { ...updated[i], selected: !updated[i].selected };
    setResult({ ...result, rows: updated });
  };
  const selectAll = () => { if (!result) return; setResult({ ...result, rows: result.rows.map((r) => ({ ...r, selected: !r.isDuplicate })) }); };
  const deselectAll = () => { if (!result) return; setResult({ ...result, rows: result.rows.map((r) => ({ ...r, selected: false })) }); };

  const handleClear = () => {
    setFiles([]); setResult(null); setSubmitted(false); setSubmitResult(null); setSubmitError(null); setExpandedRow(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!result) return;
    const selected = result.rows.filter((r) => r.selected);
    if (selected.length === 0) return;

    const byFile = new Map<string, PingRow[]>();
    for (const r of selected) {
      const arr = byFile.get(r.sourceFile) || [];
      arr.push(r);
      byFile.set(r.sourceFile, arr);
    }

    setSubmitting(true);
    setSubmitError(null);
    let totalSaved = 0, totalDupes = 0;

    try {
      for (const [fileName, rows] of byFile) {
        const payload = rows.map((r) => ({
          uptime_min: r.uptimeMin, batt_v: r.battV, batt_pct: r.battPct,
          fix_type: r.fixType, siv: r.siv, latitude: r.latitude, longitude: r.longitude,
          surface_fix: r.surfaceFix, recorded_at: r.recordedAt,
        }));
        const res = await fetch(`${API_BASE}/api/pings/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: fileName, pings: payload }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Server returned ${res.status} for ${fileName}`);
        }
        const data = await res.json();
        totalSaved += data.saved;
        totalDupes += data.duplicates_skipped;
      }
      setSubmitResult({ saved: totalSaved, duplicates_skipped: totalDupes });
      setSubmitted(true);
      fetchUploads();
      fetchStoredPings();
    } catch (err: any) {
      setSubmitError(err.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUpload = async (uploadId: number) => {
    if (!window.confirm("Delete this entire upload session and all its pings?")) return;
    setDeleting(uploadId);
    try {
      const r = await fetch(`${API_BASE}/api/uploads/${uploadId}`, { method: "DELETE" });
      if (r.ok) { fetchUploads(); fetchStoredPings(); setExpandedUploadId(null); }
    } catch {} finally { setDeleting(null); }
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

  const handleDeletePing = async (pingId: number) => {
    if (!window.confirm("Delete this single ping?")) return;
    setDeletingPing(pingId);
    try {
      const r = await fetch(`${API_BASE}/api/tracker-pings/${pingId}`, { method: "DELETE" });
      if (r.ok) {
        const data = await r.json();
        // refresh the pings for that upload
        if (data.upload_id) fetchUploadPings(data.upload_id);
        fetchUploads();
        fetchStoredPings();
      }
    } catch {} finally { setDeletingPing(null); }
  };

  const selectedCount = result?.rows.filter((r) => r.selected).length ?? 0;

  return (
    <>
      {/* timestamps */}
      <div className="upload-timestamp-row">
        <label className="upload-timestamp-label">
          Upload start time
          <span className="upload-timestamp-hint">(base time for calculating ping timestamps)</span>
        </label>
        <input type="datetime-local" className="upload-timestamp-input" value={uploadTimestamp} onChange={(e) => setUploadTimestamp(e.target.value)} />
      </div>

      {/* accepts multiple csv files */}
      <input type="file" accept=".csv" multiple ref={inputRef} style={{ display: "none" }} onChange={onFileChange} />
      <div className={`csv-drop-zone ${highlight ? "highlight" : ""}`} onClick={onZoneClick}
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onZoneClick(); } }}>
        {files.length > 0 ? (
          <>
            <div className="csv-drop-zone-main">{files.length} file{files.length !== 1 ? "s" : ""} selected</div>
            <div className="csv-drop-zone-file">{files.map((f) => f.name).join(", ")}</div>
            <div className="csv-drop-zone-sub">Click or drop again to replace</div>
          </>
        ) : (
          <>
            <div className="csv-drop-zone-main">Drag &amp; drop tracker CSV files here</div>
            <div className="csv-drop-zone-sub">or click to browse — select one or multiple .csv files</div>
          </>
        )}
      </div>

      {/* banners */}
      {result?.error && <div className="upload-status-banner error"><span>✖</span> {result.error}</div>}
      {result?.alreadyProcessed && (
        <div className="upload-status-banner warning"><span>⚠</span> File appears already processed. Upload the original CSV from the tracker.</div>
      )}

      {result && !result.error && !result.alreadyProcessed && result.rows.length > 0 && (
        <>
          <div className="upload-status-banner success">
            Parsed <strong>{result.totalRows}</strong> rows from <strong>{result.fileNames.length} file{result.fileNames.length !== 1 ? "s" : ""}</strong>
            {" "}— {result.gpsRows} with GPS, {result.noGpsRows} without
            {result.duplicateCount > 0 && <> — {result.duplicateCount} duplicate{result.duplicateCount !== 1 ? "s" : ""}</>}
          </div>

          {/* summary cards */}
          <div className="upload-summary-grid">
            <div className="upload-summary-card"><div className="upload-summary-number">{result.totalRows}</div><div className="upload-summary-label">Total Rows</div></div>
            <div className="upload-summary-card"><div className="upload-summary-number">{result.gpsRows}</div><div className="upload-summary-label">GPS Fixed</div></div>
            <div className="upload-summary-card"><div className="upload-summary-number">{result.noGpsRows}</div><div className="upload-summary-label">No GPS</div></div>
            <div className="upload-summary-card"><div className="upload-summary-number">{selectedCount}</div><div className="upload-summary-label">Selected</div></div>
          </div>

          {/* table controls */}
          <div className="upload-table-controls">
            <h3 className="upload-section-title" style={{ margin: 0 }}>CSV Data Preview</h3>
            <div className="upload-select-btns">
              <button className="upload-btn-sm" onClick={selectAll}>Select All</button>
              <button className="upload-btn-sm" onClick={deselectAll}>Deselect All</button>
            </div>
          </div>

          {/* removed Batt V and Batt % columns, added Source, click-to-expand */}
          <div className="upload-table-wrap">
            <div className="upload-table-scroll">
              <table className="upload-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>✓</th>
                    <th>#</th>
                    {result.fileNames.length > 1 && <th>Source</th>}
                    <th>Uptime (min)</th>
                    <th>Fix</th>
                    <th>SIV</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Surface</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <React.Fragment key={i}>
                      <tr className={`${row.isDuplicate ? "duplicate-row" : ""} ${!row.hasGps ? "no-gps-row" : ""} upload-row-clickable`}
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)} disabled={row.isDuplicate} />
                        </td>
                        <td>{i + 1}</td>
                        {result.fileNames.length > 1 && <td className="upload-source-cell">{row.sourceFile}</td>}
                        <td>{row.uptimeMin.toFixed(2)}</td>
                        <td><span className={`fix-badge fix-${row.fixType >= 2 ? "ok" : "none"}`}>{row.fixType >= 2 ? `${row.fixType}D` : "No fix"}</span></td>
                        <td>{row.siv >= 0 ? row.siv : "—"}</td>
                        <td>{row.latitude !== null ? row.latitude.toFixed(6) : "—"}</td>
                        <td>{row.longitude !== null ? row.longitude.toFixed(6) : "—"}</td>
                        <td>{row.surfaceFix ? "Yes" : "No"}</td>
                        <td>{formatShortTime(row.recordedAt)}</td>
                        <td>
                          {row.isDuplicate ? <span className="dup-badge">Duplicate</span>
                            : row.hasGps ? <span style={{ color: "#2ecc71", fontWeight: 600, fontSize: "0.8rem" }}>GPS ✔</span>
                            : <span style={{ color: "#f39c12", fontWeight: 600, fontSize: "0.8rem" }}>No GPS</span>}
                        </td>
                      </tr>
                      {/* expandable detail row */}
                      {expandedRow === i && (
                        <tr className="upload-detail-row">
                          <td colSpan={result.fileNames.length > 1 ? 12 : 11}>
                            <div className="upload-detail-grid">
                              <div className="upload-detail-item"><span className="upload-detail-label">Battery Voltage</span><span className="upload-detail-value">{row.battV.toFixed(3)} V</span></div>
                              <div className="upload-detail-item"><span className="upload-detail-label">Battery</span><span className="upload-detail-value" style={{ color: battColor(row.battPct) }}>{row.battPct}%</span></div>
                              <div className="upload-detail-item"><span className="upload-detail-label">Full Timestamp</span><span className="upload-detail-value">{formatDate(row.recordedAt)}</span></div>
                              <div className="upload-detail-item"><span className="upload-detail-label">Source File</span><span className="upload-detail-value">{row.sourceFile}</span></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {submitError && <div className="upload-status-banner error" style={{ marginTop: "1rem" }}><span>✖</span> {submitError}</div>}
          {submitted && submitResult && (
            <div className="upload-status-banner success" style={{ marginTop: "1rem" }}>
              <span>📡</span> Saved <strong>{submitResult.saved}</strong> ping{submitResult.saved !== 1 ? "s" : ""}
              {submitResult.duplicates_skipped > 0 && <> — {submitResult.duplicates_skipped} already existed</>}
            </div>
          )}

          <div className="upload-actions">
            <button className="upload-btn-clear" onClick={handleClear}>Clear</button>
            <button className="upload-btn-submit" onClick={handleSubmit} disabled={selectedCount === 0 || submitted || submitting}>
              {submitting ? "Uploading…" : submitted ? "Submitted ✔" : `Submit ${selectedCount} Row${selectedCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </>
      )}

      {/* shows a summary of the battery */}
      {batterySummary.length > 0 && (
        <>
          <h3 className="upload-section-title">Sensor Battery Status</h3>
          <div className="battery-summary-grid">
            {batterySummary.map((b, i) => (
              <div className="battery-card" key={i}>
                <div className="battery-card-name">{b.filename}</div>
                <div className="battery-gauge-wrap">
                  <div className="battery-gauge-track">
                    <div className="battery-gauge-fill" style={{ width: `${Math.min(b.battPct, 100)}%`, background: battColor(b.battPct) }} />
                  </div>
                  <span className="battery-gauge-label" style={{ color: battColor(b.battPct) }}>{b.battPct}%</span>
                </div>
                <div className="battery-card-detail">{b.battV.toFixed(3)} V at {b.uptimeMin.toFixed(0)} min uptime</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* shows the map and the a selectable date range */}
      <h3 className="upload-section-title">Ping Map</h3>

      <div className="upload-date-range">
        <label className="upload-date-label">From <input type="date" className="upload-date-input" value={dateStart} onChange={(e) => setDateStart(e.target.value)} /></label>
        <label className="upload-date-label">To <input type="date" className="upload-date-input" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} /></label>
        {(dateStart || dateEnd) && <button className="upload-btn-sm" onClick={() => { setDateStart(""); setDateEnd(""); }}>Clear dates</button>}
        <span className="upload-date-hint">{!dateStart && !dateEnd ? "Showing most recent pings" : `Showing ${mapPings.length} ping${mapPings.length !== 1 ? "s" : ""} in range`}</span>
      </div>

      {/* turtle/sensor selector for map visibility */}
      {uploads.length > 0 && (
        <div className="upload-turtle-selector">
          <span className="upload-turtle-selector-label">Show on map:</span>
          <div className="upload-turtle-selector-btns">
            <button className="upload-btn-sm" onClick={showAll}>All</button>
            <button className="upload-btn-sm" onClick={hideAll}>None</button>
          </div>
          <div className="upload-turtle-chips">
            {uploadsByTurtle.map(([filename, turtleUploads]) => {
              const allVisible = turtleUploads.every((u) => visibleUploadIds.has(u.id));
              const someVisible = turtleUploads.some((u) => visibleUploadIds.has(u.id));
              const cidx = colorMap.get(filename) ?? 0;
              const color = getColorForIndex(cidx);
              return (
                <button
                  key={filename}
                  className={`upload-turtle-chip ${allVisible ? "active" : someVisible ? "partial" : ""}`}
                  style={{ borderColor: color.stroke, ...(allVisible ? { background: color.fill, color: color.stroke } : {}) }}
                  onClick={() => toggleTurtleVisibility(filename)}
                >
                  <span className="upload-turtle-chip-dot" style={{ background: allVisible ? color.stroke : "#ccc" }} />
                  {filename}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <PingMap pings={mapPings} uploads={uploads} visibleUploadIds={visibleUploadIds} />

      {/* makes each ping expandable for more info */}
      <h3 className="upload-section-title">Stored Pings</h3>
      {mapPings.filter((p) => visibleUploadIds.has(p.upload_id)).length === 0 ? (
        <div className="upload-status-banner info">No stored GPS pings{dateStart || dateEnd ? " in this date range" : " yet"}.</div>
      ) : (
        <div className="upload-table-wrap">
          <div className="upload-table-scroll">
            <table className="upload-table">
              <thead><tr><th>#</th><th>Source</th><th>Latitude</th><th>Longitude</th><th>Fix</th><th>SIV</th><th>Uptime</th><th>Recorded At</th></tr></thead>
              <tbody>
                {mapPings.filter((p) => visibleUploadIds.has(p.upload_id)).map((p, i) => {
                  const upload = uploads.find((u) => u.id === p.upload_id);
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="upload-row-clickable" onClick={() => setExpandedStoredRow(expandedStoredRow === i ? null : i)}>
                        <td>{i + 1}</td>
                        <td className="upload-source-cell">{upload?.filename ?? "—"}</td>
                        <td>{p.latitude?.toFixed(6) ?? "—"}</td>
                        <td>{p.longitude?.toFixed(6) ?? "—"}</td>
                        <td>{p.fix_type >= 2 ? `${p.fix_type}D` : "No fix"}</td>
                        <td>{p.siv >= 0 ? p.siv : "—"}</td>
                        <td>{p.uptime_min.toFixed(2)} min</td>
                        <td>{formatDate(p.recorded_at)}</td>
                      </tr>
                      {expandedStoredRow === i && (
                        <tr className="upload-detail-row">
                          <td colSpan={8}>
                            <div className="upload-detail-grid">
                              <div className="upload-detail-item"><span className="upload-detail-label">Battery Voltage</span><span className="upload-detail-value">{p.batt_v.toFixed(3)} V</span></div>
                              <div className="upload-detail-item"><span className="upload-detail-label">Battery</span><span className="upload-detail-value" style={{ color: battColor(p.batt_pct) }}>{p.batt_pct}%</span></div>
                              <div className="upload-detail-item"><span className="upload-detail-label">Surface Fix</span><span className="upload-detail-value">{p.surface_fix ? "Yes" : "No"}</span></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPLOAD HISTORY — grouped by turtle, expandable, per-entry delete */}
      <h3 className="upload-section-title">Upload History</h3>
      {uploads.length === 0 ? (
        <div className="upload-status-banner info">No uploads yet.</div>
      ) : (
        <div className="upload-history-grouped">
          {uploadsByTurtle.map(([filename, turtleUploads]) => {
            const cidx = colorMap.get(filename) ?? 0;
            const color = getColorForIndex(cidx);
            const isExpanded = expandedTurtle === filename;
            const totalPings = turtleUploads.reduce((s, u) => s + u.ping_count, 0);
            return (
              <div className="upload-history-turtle" key={filename}>
                <div className="upload-history-turtle-header" onClick={() => setExpandedTurtle(isExpanded ? null : filename)}>
                  <span className="upload-history-turtle-dot" style={{ background: color.fill, borderColor: color.stroke }} />
                  <span className="upload-history-turtle-name">{filename}</span>
                  <span className="upload-history-turtle-meta">{turtleUploads.length} upload{turtleUploads.length !== 1 ? "s" : ""} · {totalPings} pings</span>
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
                            <button className="upload-btn-delete" onClick={() => handleDeleteUpload(u.id)} disabled={deleting === u.id}
                              title="Delete entire upload session">
                              {deleting === u.id ? "…" : "Delete All"}
                            </button>
                          </div>
                          {isUploadExpanded && (
                            <div className="upload-history-pings">
                              {pingsForUpload.length === 0 ? (
                                <div className="upload-history-ping-row" style={{ color: "#999", fontStyle: "italic" }}>Loading pings…</div>
                              ) : (
                                pingsForUpload.map((p, pi) => (
                                  <div className="upload-history-ping-row" key={p.id}>
                                    <span className="upload-history-ping-num">#{pi + 1}</span>
                                    <span>{p.latitude != null ? `${p.latitude.toFixed(5)}, ${p.longitude!.toFixed(5)}` : "No GPS"}</span>
                                    <span>{p.batt_pct}%</span>
                                    <span className="upload-history-entry-date">{formatDate(p.recorded_at)}</span>
                                    <button className="upload-btn-delete-sm" onClick={() => handleDeletePing(p.id)} disabled={deletingPing === p.id}>
                                      {deletingPing === p.id ? "…" : "✕"}
                                    </button>
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
      )}
    </>
  );
}

export default function DataPage() {
  return (
    <main className="upload-data-page">
      <div className="upload-hero">
        <h1 className="heading1">Upload Tracker Data</h1>
        <p className="bodytext">Import CSV files from your tracker's SD card to preview, map, and submit ping data.</p>
      </div>
      <div className="container">
        <UploadDataSection />
        <div className="upload-dev-note">
          <strong>Dev note:</strong> This page is temporary. <code>&lt;UploadDataSection /&gt;</code> can be moved to the Sensor page later.
        </div>
      </div>
    </main>
  );
}