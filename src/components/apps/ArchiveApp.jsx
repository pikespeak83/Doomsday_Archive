import React, { useEffect, useState } from "react";
import { playSound } from "../../lib/sounds.js";

function fmtSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/** Host-side browser for the linked storage device. */
export default function ArchiveApp({ config, onOpenSettings }) {
  const [listing, setListing] = useState({ path: "", entries: [] });
  const [error, setError] = useState("");

  async function load(rel) {
    const result = await window.archiveApi.browse(rel);
    if (result.error) setError(result.error);
    else {
      setError("");
      setListing(result);
    }
  }

  useEffect(() => {
    if (config.archiveRoot) void load("");
  }, [config.archiveRoot]);

  if (!config.archiveRoot) {
    return (
      <div>
        <p className="warn">NO STORAGE DEVICE LINKED.</p>
        <p className="dim" style={{ margin: "8px 0" }}>
          Link a hard drive, SSD, or external storage in SETTINGS. The archive
          serves every file under the linked root.
        </p>
        <button className="btn" onClick={onOpenSettings}>OPEN SETTINGS</button>
      </div>
    );
  }

  const crumbs = listing.path ? listing.path.split("/") : [];

  return (
    <div>
      <div className="dim" style={{ marginBottom: 8, wordBreak: "break-all" }}>
        ROOT: {config.archiveRoot}
      </div>
      <div style={{ marginBottom: 10 }}>
        <a
          href="#"
          className="bright"
          onClick={(e) => { e.preventDefault(); playSound("click", 0.35); void load(""); }}
          style={{ textDecoration: "none" }}
        >
          /ARCHIVE
        </a>
        {crumbs.map((part, i) => (
          <React.Fragment key={`${part}-${i}`}>
            <span className="dim"> / </span>
            <a
              href="#"
              className="bright"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                playSound("click", 0.35);
                void load(crumbs.slice(0, i + 1).join("/"));
              }}
            >
              {part}
            </a>
          </React.Fragment>
        ))}
      </div>
      {error && <p className="warn">{error}</p>}
      <table className="data-table">
        <thead>
          <tr><th style={{ width: 46 }}></th><th>NAME</th><th>TYPE</th><th>SIZE</th></tr>
        </thead>
        <tbody>
          {listing.entries.map((entry) => {
            const rel = (listing.path ? `${listing.path}/` : "") + entry.name;
            return (
              <tr
                key={entry.name}
                className="click"
                onDoubleClick={() => {
                  playSound("select", 0.4);
                  if (entry.type === "dir") void load(rel);
                  else void window.archiveApi.openFile(rel);
                }}
                onClick={() => {
                  if (entry.type === "dir") {
                    playSound("click", 0.35);
                    void load(rel);
                  }
                }}
              >
                <td className="dim">{entry.type === "dir" ? "[DIR]" : (entry.kind || "file").toUpperCase().slice(0, 3)}</td>
                <td>{entry.name}</td>
                <td className="dim">{entry.type === "dir" ? "FOLDER" : (entry.ext || "").toUpperCase()}</td>
                <td className="dim">{entry.type === "dir" ? "" : fmtSize(entry.size)}</td>
              </tr>
            );
          })}
          {!listing.entries.length && !error && (
            <tr><td colSpan={4} className="dim">EMPTY SECTOR</td></tr>
          )}
        </tbody>
      </table>
      <p className="dim" style={{ marginTop: 10, fontSize: 12 }}>
        Double-click a file to open it with the system default app.
      </p>
    </div>
  );
}
