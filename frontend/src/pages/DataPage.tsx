// temporary page until i have access to the sensor page

import React, { useState, useRef, useCallback } from "react";
import type { DragEvent, ChangeEvent } from "react";
import "../styles/pages/DataPage.css";

const REQUIRED_COLUMNS = [
  "SeqNo",
  "Latitude",
  "Longitude",
  "Altitude",
  "Sats",
  "Speed",
  "Heading",
  "SNR",
  "Timestamp",
] as const;

type PingRow = {
  seqNo: string;
  latitude: number;
  longitude: number;
  altitude: number;
  sats: number;
  speed: number;
  heading: number;
  snr: number;
  timestamp: string;
  isDuplicate: boolean;
};

type ParseResult = {
  rows: PingRow[];
  totalRows: number;
  duplicateCount: number;
  alreadyProcessed: boolean;
  error: string | null;
};

// this is the CSV parser
function parseCSV(text: string): ParseResult {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { rows: [], totalRows: 0, duplicateCount: 0, alreadyProcessed: false, error: "File is empty or has no data rows." };
  }

  const rawHeaders = lines[0].split(",").map((h) => h.trim());

  // this is to check the files for duplicates
  const lowerHeaders = rawHeaders.map((h) => h.toLowerCase());
  const looksProcessed =
    lowerHeaders.includes("seq_no") ||
    lowerHeaders.includes("lat") ||
    (lowerHeaders.includes("table") && lowerHeaders.includes("row_count"));

  if (looksProcessed) {
    return {
      rows: [],
      totalRows: 0,
      duplicateCount: 0,
      alreadyProcessed: true,
      error: null,
    };
  }

  const missing = REQUIRED_COLUMNS.filter((col) => !rawHeaders.includes(col));
  if (missing.length > 0) {
    return {
      rows: [],
      totalRows: 0,
      duplicateCount: 0,
      alreadyProcessed: false,
      error: `Missing required columns: ${missing.join(", ")}. Found: ${rawHeaders.join(", ")}`,
    };
  }

  const idx = Object.fromEntries(rawHeaders.map((h, i) => [h, i])) as Record<string, number>;

  const seen = new Set<string>();
  const rows: PingRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.trim());

    const seqNo = cols[idx["SeqNo"]] ?? "";
    const latitude = parseFloat(cols[idx["Latitude"]] ?? "");
    const longitude = parseFloat(cols[idx["Longitude"]] ?? "");
    const altitude = parseFloat(cols[idx["Altitude"]] ?? "0");
    const sats = parseInt(cols[idx["Sats"]] ?? "0", 10);
    const speed = parseFloat(cols[idx["Speed"]] ?? "0");
    const heading = parseFloat(cols[idx["Heading"]] ?? "0");
    const snr = parseFloat(cols[idx["SNR"]] ?? "0");
    const timestamp = cols[idx["Timestamp"]] ?? "";

    if (isNaN(latitude) || isNaN(longitude)) continue;

    // another thing to check for duplicate but for different elements
    const fingerprint = `${seqNo}|${latitude}|${longitude}|${timestamp}`;
    const isDuplicate = seen.has(fingerprint);
    seen.add(fingerprint);

    rows.push({
      seqNo,
      latitude,
      longitude,
      altitude: isNaN(altitude) ? 0 : altitude,
      sats: isNaN(sats) ? 0 : sats,
      speed: isNaN(speed) ? 0 : speed,
      heading: isNaN(heading) ? 0 : heading,
      snr: isNaN(snr) ? 0 : snr,
      timestamp,
      isDuplicate,
    });
  }

  return {
    rows,
    totalRows: rows.length,
    duplicateCount: rows.filter((r) => r.isDuplicate).length,
    alreadyProcessed: false,
    error: null,
  };
}

export function UploadDataSection() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [highlight, setHighlight] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const processFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setResult({
        rows: [],
        totalRows: 0,
        duplicateCount: 0,
        alreadyProcessed: false,
        error: "Invalid file type. Please upload a .csv file.",
      });
      setFile(null);
      return;
    }

    setFile(f);
    setSubmitted(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setResult(parsed);
    };
    reader.onerror = () => {
      setResult({
        rows: [],
        totalRows: 0,
        duplicateCount: 0,
        alreadyProcessed: false,
        error: "Failed to read file.",
      });
    };
    reader.readAsText(f);
  }, []);

  // this is to make it so files can be drag and dropped
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHighlight(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHighlight(true);
  };
  const onDragLeave = () => setHighlight(false);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  const onZoneClick = () => inputRef.current?.click();

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setSubmitted(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!result || result.rows.length === 0) return;

    // it'll log to console for now, im working on saving it to the backend
    const payload = result.rows
      .filter((r) => !r.isDuplicate)
      .map((r) => ({
        seq_no: r.seqNo,
        lat: r.latitude,
        lon: r.longitude,
        altitude: r.altitude,
        sats: r.sats,
        speed: r.speed,
        heading: r.heading,
        snr: r.snr,
        timestamp: r.timestamp,
      }));

    console.log("Submitting pings (duplicates excluded):", payload);
    setSubmitted(true);
  };

  const newPings = result ? result.rows.filter((r) => !r.isDuplicate) : [];
  const uniqueTimestamps = result
    ? new Set(result.rows.map((r) => r.timestamp.split(" ")[0] || r.timestamp.split("T")[0])).size
    : 0;

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={onFileChange}
      />
      <div
        className={`csv-drop-zone ${highlight ? "highlight" : ""}`}
        onClick={onZoneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onZoneClick();
          }
        }}
      >
        <div className="csv-drop-zone-icon">📂</div>
        {file ? (
          <>
            <div className="csv-drop-zone-main">File selected</div>
            <div className="csv-drop-zone-file">{file.name}</div>
            <div className="csv-drop-zone-sub">Click or drop again to replace</div>
          </>
        ) : (
          <>
            <div className="csv-drop-zone-main">
              Drag &amp; drop your tracker CSV file here
            </div>
            <div className="csv-drop-zone-sub">
              or click to browse — accepts .csv files from the SD card
            </div>
          </>
        )}
      </div>

      {result?.error && (
        <div className="upload-status-banner error">
          <span>✖</span> {result.error}
        </div>
      )}

      {result?.alreadyProcessed && (
        <div className="upload-status-banner warning">
          <span>⚠</span> This file appears to have already been processed (contains
          converted column names like <code>seq_no</code>, <code>lat</code>,{" "}
          <code>lon</code>). Please upload the original CSV from the tracker's SD
          card instead.
        </div>
      )}

      {result && !result.error && !result.alreadyProcessed && result.rows.length > 0 && (
        <>
          <div className="upload-status-banner success">
            <span>✔</span> Parsed {result.totalRows} ping{result.totalRows !== 1 ? "s" : ""} from{" "}
            <strong>{file?.name}</strong>
            {result.duplicateCount > 0 && (
              <> — {result.duplicateCount} duplicate{result.duplicateCount !== 1 ? "s" : ""} detected</>
            )}
          </div>

          <div className="upload-summary-grid">
            <div className="upload-summary-card">
              <div className="upload-summary-number">{result.totalRows}</div>
              <div className="upload-summary-label">Total Pings</div>
            </div>
            <div className="upload-summary-card">
              <div className="upload-summary-number">{newPings.length}</div>
              <div className="upload-summary-label">New Pings</div>
            </div>
            <div className="upload-summary-card">
              <div className="upload-summary-number">{result.duplicateCount}</div>
              <div className="upload-summary-label">Duplicates</div>
            </div>
            <div className="upload-summary-card">
              <div className="upload-summary-number">{uniqueTimestamps}</div>
              <div className="upload-summary-label">Unique Days</div>
            </div>
          </div>

          <h3 className="upload-section-title">Ping Data Preview</h3>

          <div className="upload-table-wrap">
            <div className="upload-table-scroll">
              <table className="upload-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Seq</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Altitude</th>
                    <th>Sats</th>
                    <th>Speed</th>
                    <th>Heading</th>
                    <th>SNR</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className={row.isDuplicate ? "duplicate-row" : ""}>
                      <td>{i + 1}</td>
                      <td>{row.seqNo}</td>
                      <td>{row.latitude.toFixed(6)}</td>
                      <td>{row.longitude.toFixed(6)}</td>
                      <td>{row.altitude.toFixed(1)}</td>
                      <td>{row.sats}</td>
                      <td>{row.speed.toFixed(1)}</td>
                      <td>{row.heading.toFixed(1)}</td>
                      <td>{row.snr.toFixed(1)}</td>
                      <td>{row.timestamp}</td>
                      <td>
                        {row.isDuplicate ? (
                          <span className="dup-badge">Duplicate</span>
                        ) : (
                          <span style={{ color: "#2ecc71", fontWeight: 600, fontSize: "0.8rem" }}>
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {submitted && (
            <div className="upload-status-banner info" style={{ marginTop: "var(--space-4)" }}>
              <span>📡</span> Data logged to console. Once the backend endpoint is
              connected, this will submit {newPings.length} new ping
              {newPings.length !== 1 ? "s" : ""} to the database.
            </div>
          )}

          <div className="upload-actions">
            <button className="upload-btn-clear" onClick={handleClear}>
              Clear
            </button>
            <button
              className="upload-btn-submit"
              onClick={handleSubmit}
              disabled={newPings.length === 0 || submitted}
            >
              {submitted
                ? "Submitted ✔"
                : `Submit ${newPings.length} Ping${newPings.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default function UploadDataPage() {
  return (
    <main className="upload-data-page">
      <div className="upload-hero">
        <h1 className="heading1">Upload Tracker Data</h1>
        <p className="bodytext">
          Import CSV files from your tracker's SD card to preview and submit
          ping data.
        </p>
      </div>

      <div className="container">
        <UploadDataSection />

        <div className="upload-dev-note">
          <strong>Dev note:</strong> This page is temporary. The{" "}
          <code>&lt;UploadDataSection /&gt;</code> component is exported
          separately so it can be dropped into the Sensor page once you have
          access. Just import it and place it inside a section.
        </div>
      </div>
    </main>
  );
}