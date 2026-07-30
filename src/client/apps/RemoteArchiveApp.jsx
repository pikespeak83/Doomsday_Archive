import React, { useEffect, useState } from "react";
import { playSound } from "../../lib/sounds.js";
import { baseUrl, listFiles, downloadUrl } from "../api.js";
import { fmtSize } from "../../components/apps/ArchiveApp.jsx";

/** Remote vault browser for field devices: browse everything, view media, retrieve files. */
export default function RemoteArchiveApp({ connection, config, onAuthLost, onOpenMedia }) {
  const [listing, setListing] = useState({ path: "", entries: [], allowDownloads: true });
  const [error, setError] = useState("");
  const base = baseUrl(connection.address, connection.port);

  const VIEWABLE = ["image", "video", "audio", "text"];

  async function load(rel) {
    try {
      const res = await listFiles(base, config.token, rel);
      if (res.status === 401) {
        onAuthLost();
        return;
      }
      if (!res.ok) {
        setError(res.json.error || "TRANSMISSION ERROR");
        return;
      }
      setError("");
      setListing(res.json);
    } catch {
      setError("HOST NODE UNREACHABLE");
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  const crumbs = listing.path ? listing.path.split("/") : [];

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <a
          href="#"
          className="bright"
          style={{ textDecoration: "none" }}
          onClick={(e) => { e.preventDefault(); playSound("click", 0.35); void load(""); }}
        >
          /VAULT
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
          <tr><th style={{ width: 52 }}></th><th>NAME</th><th>SIZE</th><th></th></tr>
        </thead>
        <tbody>
          {listing.entries.map((entry) => {
            const rel = entry.type === "drive"
              ? entry.id
              : (listing.path ? `${listing.path}/` : "") + entry.name;
            return (
              <tr
                key={entry.id || entry.name}
                className="click"
                onClick={() => {
                  if (entry.type !== "file") {
                    playSound("click", 0.35);
                    void load(rel);
                  } else {
                    playSound("select", 0.4);
                    const ext = (entry.ext || "").toLowerCase();
                    const kind = VIEWABLE.includes(entry.kind)
                      ? entry.kind
                      : ext === "pdf" || ext === "html" || ext === "htm"
                        ? "pdf"
                        : "binary";
                    onOpenMedia({
                      kind,
                      name: entry.name,
                      src: downloadUrl(base, config.token, rel, true)
                    });
                  }
                }}
              >
                <td className="dim">
                  {entry.type === "drive" ? "[DRV]" : entry.type === "dir" ? "[DIR]" : (entry.kind || "file").toUpperCase().slice(0, 3)}
                </td>
                <td>
                  {entry.name}
                  {entry.type === "drive" && entry.online === false && (
                    <span className="warn"> (OFFLINE)</span>
                  )}
                </td>
                <td className="dim">{entry.type === "file" ? fmtSize(entry.size) : ""}</td>
                <td style={{ width: 100 }}>
                  {entry.type === "file" && listing.allowDownloads && (
                    <button
                      className="btn small"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound("select", 0.45);
                        void window.fieldApi.download(downloadUrl(base, config.token, rel));
                      }}
                    >
                      RETRIEVE
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {!listing.entries.length && !error && (
            <tr><td colSpan={4} className="dim">EMPTY SECTOR</td></tr>
          )}
        </tbody>
      </table>
      <p className="dim" style={{ marginTop: 10, fontSize: 12 }}>
        Click media to view it here. RETRIEVE copies files to
        Downloads/Doomsday Archive on this device.
      </p>
    </div>
  );
}
