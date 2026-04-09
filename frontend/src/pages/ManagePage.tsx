import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import "../styles/pages/DataPage.css";
import "../components/RegisterSensorForm/RegisterSensorForm.css";

const API_BASE = import.meta.env.VITE_API_URL;

// ─── constants ────────────────────────────────────────────────────────────────

const SPECIES_OPTIONS = ["Unknown", "Hawksbill", "Green", "Loggerhead", "Leatherback", "Olive Ridley", "Kemp's Ridley", "Flatback"];
const SEX_OPTIONS = ["Unknown", "Male", "Female"];
const ISLAND_OPTIONS = ["Unknown", "San Andrés", "Providencia", "Santa Catalina", "Johnny Cay", "Albuquerque Cay", "Bolívar Cay", "Cayo Serrana", "Cayo Serranilla", "Cayo Roncador", "Cayo Bolívar"];

// ─── CSV parser (new utc_iso format + legacy lat_1e7 format) ─────────────────

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
  altitudeM: number | null;
  hAccM: number | null;
  speedMps: number | null;
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

  const isNewFormat = lowerHeaders.includes("utc_iso");
  const seen = new Set<string>();
  const rows: PingRow[] = [];

  if (isNewFormat) {
    const required = ["utc_iso", "uptime_min", "batt_v", "batt_pct"];
    const missing = required.filter((c) => !lowerHeaders.includes(c));
    if (missing.length > 0) {
      return { rows: [], totalRows: 0, gpsRows: 0, noGpsRows: 0, duplicateCount: 0, alreadyProcessed: false, error: `${fileName}: Missing columns: ${missing.join(", ")}`, fileNames: [fileName] };
    }
    const idx = Object.fromEntries(lowerHeaders.map((h, i) => [h, i])) as Record<string, number>;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(",").map((c) => c.trim());
      const utcIso = cols[idx["utc_iso"]] ?? "";
      const latStr = cols[idx["latitude"]] ?? "";
      const lonStr = cols[idx["longitude"]] ?? "";
      const uptimeMin = parseFloat(cols[idx["uptime_min"]] ?? "0") || 0;
      const battV = parseFloat(cols[idx["batt_v"]] ?? "0") || 0;
      const battPct = parseInt(cols[idx["batt_pct"]] ?? "0", 10) || 0;
      const fixType = parseInt(cols[idx["fixtype"]] ?? "-1", 10);
      const siv = parseInt(cols[idx["siv"]] ?? "-1", 10);
      const surfaceFix = parseInt(cols[idx["surfacefix"]] ?? "0", 10) || 0;
      const altStr = cols[idx["altitude_m"]] ?? "";
      const hAccStr = cols[idx["hacc_m"]] ?? "";
      const speedStr = cols[idx["speed_mps"]] ?? "";
      const altitudeM = altStr !== "" && !isNaN(parseFloat(altStr)) ? parseFloat(altStr) : null;
      const hAccM = hAccStr !== "" && !isNaN(parseFloat(hAccStr)) ? parseFloat(hAccStr) : null;
      const speedMps = speedStr !== "" && !isNaN(parseFloat(speedStr)) ? parseFloat(speedStr) : null;

      let latitude: number | null = null;
      let longitude: number | null = null;
      if (latStr !== "" && lonStr !== "") {
        const lv = parseFloat(latStr);
        const lnv = parseFloat(lonStr);
        if (!isNaN(lv) && !isNaN(lnv) && !(lv === 0 && lnv === 0)) { latitude = lv; longitude = lnv; }
      }

      const recordedAt = utcIso ? (utcIso.endsWith("Z") ? utcIso : utcIso + "Z")
        : new Date(new Date(uploadTimestamp).getTime() + uptimeMin * 60 * 1000).toISOString();
      const hasGps = latitude !== null && longitude !== null;
      const fp = `${fileName}|${uptimeMin}|${latitude}|${longitude}`;
      const isDuplicate = seen.has(fp);
      seen.add(fp);
      rows.push({ sourceFile: fileName, uptimeMin, battV, battPct: isNaN(battPct) ? 0 : battPct, fixType: isNaN(fixType) ? -1 : fixType, siv: isNaN(siv) ? -1 : siv, latitude, longitude, surfaceFix, altitudeM, hAccM, speedMps, hasGps, isDuplicate, selected: hasGps && !isDuplicate, recordedAt });
    }
  } else {
    const required = ["uptime_min", "batt_v", "batt_pct", "fixType", "siv", "lat_1e7", "lon_1e7", "surfaceFix"];
    const missing = required.filter((c) => !rawHeaders.includes(c));
    if (missing.length > 0) {
      return { rows: [], totalRows: 0, gpsRows: 0, noGpsRows: 0, duplicateCount: 0, alreadyProcessed: false, error: `${fileName}: Missing columns: ${missing.join(", ")}. Found: ${rawHeaders.join(", ")}`, fileNames: [fileName] };
    }
    const idx = Object.fromEntries(rawHeaders.map((h, i) => [h, i])) as Record<string, number>;
    const baseTime = new Date(uploadTimestamp).getTime();

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
        const lv = parseFloat(rawLat); const lnv = parseFloat(rawLon);
        if (!isNaN(lv) && !isNaN(lnv)) { latitude = Math.abs(lv) > 1000 ? lv / 1e7 : lv; longitude = Math.abs(lnv) > 1000 ? lnv / 1e7 : lnv; }
      }
      const tsCol = rawHeaders.includes("Timestamp") ? cols[idx["Timestamp"]] ?? "" : "";
      const recordedAt = tsCol ? (tsCol.endsWith("Z") ? tsCol : tsCol + "Z") : new Date(baseTime + uptimeMin * 60 * 1000).toISOString();
      const hasGps = latitude !== null && longitude !== null && fixType >= 2;
      const fp = `${fileName}|${uptimeMin}|${latitude}|${longitude}`;
      const isDuplicate = seen.has(fp);
      seen.add(fp);
      rows.push({ sourceFile: fileName, uptimeMin, battV, battPct: isNaN(battPct) ? 0 : battPct, fixType, siv, latitude, longitude, surfaceFix, altitudeM: null, hAccM: null, speedMps: null, hasGps, isDuplicate, selected: hasGps && !isDuplicate, recordedAt });
    }
  }

  return { rows, totalRows: rows.length, gpsRows: rows.filter((r) => r.hasGps).length, noGpsRows: rows.filter((r) => !r.hasGps).length, duplicateCount: rows.filter((r) => r.isDuplicate).length, alreadyProcessed: false, error: null, fileNames: [fileName] };
}

function mergeResults(results: ParseResult[]): ParseResult {
  const errors = results.filter((r) => r.error).map((r) => r.error!);
  const allRows = results.flatMap((r) => r.rows);
  const allFiles = results.flatMap((r) => r.fileNames);
  return { rows: allRows, totalRows: allRows.length, gpsRows: allRows.filter((r) => r.hasGps).length, noGpsRows: allRows.filter((r) => !r.hasGps).length, duplicateCount: allRows.filter((r) => r.isDuplicate).length, alreadyProcessed: results.some((r) => r.alreadyProcessed) && allRows.length === 0, error: errors.length > 0 ? errors.join("\n") : null, fileNames: allFiles };
}

function formatShortTime(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch { return iso; }
}
function formatDate(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
}
function battColor(pct: number) {
  if (pct >= 60) return "#2ecc71";
  if (pct >= 30) return "#f39c12";
  return "#e74c3c";
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ManagePage() {
  const { user } = useAuth();

  // turtle metadata
  const [turtleName, setTurtleName] = useState("");
  const [species, setSpecies] = useState("Unknown");
  const [sex, setSex] = useState("Unknown");
  const [islandOrigin, setIslandOrigin] = useState("Unknown");
  const [notes, setNotes] = useState("");

  // csv upload state
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [highlight, setHighlight] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ saved: number; duplicates_skipped: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [uploadTimestamp, setUploadTimestamp] = useState<string>(new Date().toISOString().slice(0, 16));
  const inputRef = useRef<HTMLInputElement | null>(null);

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
          surface_fix: r.surfaceFix, altitude_m: r.altitudeM, h_acc_m: r.hAccM,
          speed_mps: r.speedMps, recorded_at: r.recordedAt,
        }));
        const res = await fetch(`${API_BASE}/api/pings/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: fileName,
            pings: payload,
            // turtle metadata — attached to every upload batch for this session
            turtle_name: turtleName || null,
            species: species !== "Unknown" ? species : null,
            sex: sex !== "Unknown" ? sex : null,
            island_origin: islandOrigin !== "Unknown" ? islandOrigin : null,
            notes: notes || null,
          }),
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
    } catch (err: any) {
      setSubmitError(err.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = result?.rows.filter((r) => r.selected).length ?? 0;

  return (
    <main className="upload-data-page">
      <div className="section">
        <div className="container">
          <p className="heading1" style={{ marginBottom: "0.5rem" }}>Manage Data</p>
          <p className="bodytext" style={{ color: "#5a8a8f", marginBottom: 0 }}>
            Register a turtle and upload its tracker CSV. Metadata will appear on the Sensor page alongside the GPS track.
          </p>
        </div>
      </div>

      <div className="container">

        {/* ── Turtle metadata form ── */}
        <div className="card sensor-form" style={{ marginBottom: "2rem" }}>
          <div className="sensor-banner">
            <p className="heading3">Turtle Information</p>
            <p className="user-group-text">Signed in as <strong>{user?.email || "unknown"}</strong></p>
          </div>

          <div className="sensor-form-row">
            <label className="sensor-label">
              Turtle name / tag ID
              <input
                className="sensor-input"
                type="text"
                value={turtleName}
                onChange={(e) => setTurtleName(e.target.value)}
                placeholder="e.g. RAK-0042 or Raphael"
              />
            </label>
          </div>

          <div className="sensor-form-row sensor-form-row-two">
            <label className="sensor-label">
              Species
              <select className="sensor-input" value={species} onChange={(e) => setSpecies(e.target.value)}>
                {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="sensor-label">
              Sex
              <select className="sensor-input" value={sex} onChange={(e) => setSex(e.target.value)}>
                {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div className="sensor-form-row">
            <label className="sensor-label">
              Island of origin
              <select className="sensor-input" value={islandOrigin} onChange={(e) => setIslandOrigin(e.target.value)}>
                {ISLAND_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
          </div>

          <div className="sensor-form-row">
            <label className="sensor-label">
              Notes (optional)
              <textarea
                className="sensor-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional observations…"
                rows={3}
                style={{ resize: "vertical" }}
              />
            </label>
          </div>
        </div>

        {/* ── CSV upload section ── */}
        <div className="upload-timestamp-row">
          <label className="upload-timestamp-label">
            Upload start time
            <span className="upload-timestamp-hint">(base time for ping timestamps)</span>
          </label>
          <input type="datetime-local" className="upload-timestamp-input" value={uploadTimestamp} onChange={(e) => setUploadTimestamp(e.target.value)} />
        </div>

        <input type="file" accept=".csv" multiple ref={inputRef} style={{ display: "none" }} onChange={onFileChange} />
        <div
          className={`csv-drop-zone ${highlight ? "highlight" : ""}`}
          onClick={onZoneClick}
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onZoneClick(); } }}
        >
          {files.length > 0 ? (
            <>
              <div className="csv-drop-zone-main">{files.length} file{files.length !== 1 ? "s" : ""} selected</div>
              <div className="csv-drop-zone-file">{files.map((f) => f.name).join(", ")}</div>
              <div className="csv-drop-zone-sub">Click or drop again to replace</div>
            </>
          ) : (
            <>
              <div className="csv-drop-zone-main">Drag &amp; drop tracker CSV files here</div>
              <div className="csv-drop-zone-sub">or click to browse — supports new (utc_iso) and legacy (lat_1e7) formats</div>
            </>
          )}
        </div>

        {result?.error && <div className="upload-status-banner error"><span>✖</span> {result.error}</div>}
        {result?.alreadyProcessed && <div className="upload-status-banner warning"><span>⚠</span> File appears already processed.</div>}

        {result && !result.error && !result.alreadyProcessed && result.rows.length > 0 && (
          <>
            <div className="upload-status-banner success">
              Parsed <strong>{result.totalRows}</strong> rows — {result.gpsRows} with GPS, {result.noGpsRows} without
              {result.duplicateCount > 0 && <> — {result.duplicateCount} duplicates</>}
            </div>

            <div className="upload-summary-grid">
              <div className="upload-summary-card"><div className="upload-summary-number">{result.totalRows}</div><div className="upload-summary-label">Total Rows</div></div>
              <div className="upload-summary-card"><div className="upload-summary-number">{result.gpsRows}</div><div className="upload-summary-label">GPS Fixed</div></div>
              <div className="upload-summary-card"><div className="upload-summary-number">{result.noGpsRows}</div><div className="upload-summary-label">No GPS</div></div>
              <div className="upload-summary-card"><div className="upload-summary-number">{selectedCount}</div><div className="upload-summary-label">Selected</div></div>
            </div>

            <div className="upload-table-controls">
              <h3 className="upload-section-title" style={{ margin: 0 }}>CSV Preview</h3>
              <div className="upload-select-btns">
                <button className="upload-btn-sm" onClick={selectAll}>Select All</button>
                <button className="upload-btn-sm" onClick={deselectAll}>Deselect All</button>
              </div>
            </div>

            <div className="upload-table-wrap">
              <div className="upload-table-scroll">
                <table className="upload-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>✓</th><th>#</th>
                      {result.fileNames.length > 1 && <th>Source</th>}
                      <th>Uptime (min)</th><th>Fix</th><th>SIV</th>
                      <th>Latitude</th><th>Longitude</th><th>Surface</th>
                      <th>Alt (m)</th><th>H.Acc (m)</th><th>Spd (m/s)</th>
                      <th>Time</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <React.Fragment key={i}>
                        <tr
                          className={`${row.isDuplicate ? "duplicate-row" : ""} ${!row.hasGps ? "no-gps-row" : ""} upload-row-clickable`}
                          onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        >
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
                          <td>{row.altitudeM !== null ? row.altitudeM.toFixed(1) : "—"}</td>
                          <td>{row.hAccM !== null ? row.hAccM.toFixed(2) : "—"}</td>
                          <td>{row.speedMps !== null ? row.speedMps.toFixed(3) : "—"}</td>
                          <td>{formatShortTime(row.recordedAt)}</td>
                          <td>
                            {row.isDuplicate ? <span className="dup-badge">Duplicate</span>
                              : row.hasGps ? <span style={{ color: "#2ecc71", fontWeight: 600, fontSize: "0.8rem" }}>GPS ✔</span>
                              : <span style={{ color: "#f39c12", fontWeight: 600, fontSize: "0.8rem" }}>No GPS</span>}
                          </td>
                        </tr>
                        {expandedRow === i && (
                          <tr className="upload-detail-row">
                            <td colSpan={result.fileNames.length > 1 ? 12 : 11}>
                              <div className="upload-detail-grid">
                                <div className="upload-detail-item"><span className="upload-detail-label">Full Timestamp</span><span className="upload-detail-value">{formatDate(row.recordedAt)}</span></div>
                                <div className="upload-detail-item"><span className="upload-detail-label">Battery Voltage</span><span className="upload-detail-value">{row.battV.toFixed(3)} V</span></div>
                                <div className="upload-detail-item"><span className="upload-detail-label">Battery %</span><span className="upload-detail-value" style={{ color: battColor(row.battPct) }}>{row.battPct}%</span></div>
                                <div className="upload-detail-item"><span className="upload-detail-label">Fix Type</span><span className="upload-detail-value">{row.fixType >= 0 ? `${row.fixType}D` : "—"}</span></div>
                                <div className="upload-detail-item"><span className="upload-detail-label">Satellites (SIV)</span><span className="upload-detail-value">{row.siv >= 0 ? row.siv : "—"}</span></div>
                                <div className="upload-detail-item"><span className="upload-detail-label">Surface Fix</span><span className="upload-detail-value">{row.surfaceFix ? "Yes" : "No"}</span></div>
                                {row.altitudeM !== null && <div className="upload-detail-item"><span className="upload-detail-label">Altitude</span><span className="upload-detail-value">{row.altitudeM.toFixed(2)} m</span></div>}
                                {row.hAccM !== null && <div className="upload-detail-item"><span className="upload-detail-label">H. Accuracy</span><span className="upload-detail-value">{row.hAccM.toFixed(2)} m</span></div>}
                                {row.speedMps !== null && <div className="upload-detail-item"><span className="upload-detail-label">Speed</span><span className="upload-detail-value">{row.speedMps.toFixed(3)} m/s</span></div>}
                                {row.latitude !== null && <div className="upload-detail-item"><span className="upload-detail-label">Latitude</span><span className="upload-detail-value">{row.latitude.toFixed(7)}</span></div>}
                                {row.longitude !== null && <div className="upload-detail-item"><span className="upload-detail-label">Longitude</span><span className="upload-detail-value">{row.longitude.toFixed(7)}</span></div>}
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

      </div>
    </main>
  );
}