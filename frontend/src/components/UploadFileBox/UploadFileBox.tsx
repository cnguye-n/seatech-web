import React, {
  useState,
  useRef,
  DragEvent,
  ChangeEvent,
} from "react";
import "./UploadFileBox.css";

export type UploadFileBoxProps = {
  onUpload?: (file: File) => void;
  accept?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
};

const UploadFileBox: React.FC<UploadFileBoxProps> = ({
  onUpload,
  accept = ".csv",
  label = "Upload sensor data",
  helperText = "Drag & drop a CSV file here, or click to browse.",
  disabled = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [highlight, setHighlight] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateCSV = (f: File): boolean => {
    const lower = f.name.toLowerCase();
    const isExtensionCsv = lower.endsWith(".csv");

    const isMimeCsv =
      f.type === "text/csv" ||
      f.type === "application/vnd.ms-excel" ||
      f.type === ""; // some browsers leave type empty

    return isExtensionCsv && isMimeCsv;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selected = files[0];

    if (!validateCSV(selected)) {
      setError("Invalid file type. Please upload a CSV file.");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setHighlight(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setHighlight(true);
  };

  const handleDragLeave = () => {
    if (disabled) return;
    setHighlight(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleZoneClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleUploadClick = () => {
    if (!file || !onUpload || disabled) return;
    onUpload(file);
    // you can clear after upload or keep it; for now we keep it selected
  };

  return (
    <div className="upload-file-box">

      <input
        type="file"
        accept={accept}
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleChange}
        disabled={disabled}
      />

      <div
        className={`drop-zone ${highlight ? "highlight" : ""} ${
          disabled ? "drop-zone-disabled" : ""
        }`}
        onClick={handleZoneClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            handleZoneClick();
          }
        }}
      >
        <div className="drop-zone-text-main">
          {file ? file.name : helperText}
        </div>
        <div className="drop-zone-text-sub">
          Accepted format: CSV only
        </div>
      </div>

      {error && <p className="upload-error">{error}</p>}

      <button
        className="upload-btn"
        onClick={handleUploadClick}
        disabled={!file || !!error || disabled}
      >
        Upload
      </button>
    </div>
  );
};

export default UploadFileBox;
