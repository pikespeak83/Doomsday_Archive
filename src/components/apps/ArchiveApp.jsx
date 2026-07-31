import React, { useEffect, useState } from "react";
import ContextMenu from "../ContextMenu.jsx";
import { playSound } from "../../lib/sounds.js";

export function fmtSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

const VIEWABLE = ["image", "video", "audio", "text"];

/**
 * Host vault browser: full drives, Windows-style right-click menu,
 * copy/paste + drag moving, inline viewers, live feed broadcast.
 */
export default function ArchiveApp({ sources, onOpenSettings, onOpenMedia, onBroadcast, notify, initialPath }) {
  const [listing, setListing] = useState({ path: "", entries: [] });
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(null); // { x, y, entry|null }
  const [clipboard, setClipboard] = useState(null); // { rel, name }
  const [creating, setCreating] = useState(null); // { type: "dir"|"file", draft }
  const [dragOver, setDragOver] = useState("");

  async function load(rel) {
    const result = await window.archiveApi.browse(rel);
    if (result.error) setError(result.error);
    else {
      setError("");
      setListing(result);
    }
  }

  useEffect(() => {
    if (sources?.length) void load(listing.path || initialPath || "");
  }, [sources?.length]);

  const inFolder = Boolean(listing.path);
  const crumbs = listing.path ? listing.path.split("/") : [];
  const labelFor = (segment, index) => {
    if (index === 0) {
      const source = sources.find((s) => s.id === segment);
      if (source) return source.label || source.path;
    }
    return segment;
  };

  function relOf(entry) {
    return entry.type === "drive"
      ? entry.id
      : (listing.path ? `${listing.path}/` : "") + entry.name;
  }

  function openEntry(entry) {
    const rel = relOf(entry);
    if (entry.type !== "file") {
      playSound("click", 0.35);
      void load(rel);
      return;
    }
    const src = `vault://${rel.split("/").map(encodeURIComponent).join("/")}`;
    const ext = (entry.ext || "").toLowerCase();
    const kind = VIEWABLE.includes(entry.kind)
      ? entry.kind
      : ext === "pdf" || ext === "html" || ext === "htm"
        ? "pdf"
        : "binary";
    onOpenMedia({ kind, name: entry.name, src, rel });
  }

  async function doOp(promise, refresh = true) {
    const result = await promise;
    if (!result.ok) {
      playSound("error", 0.4);
      notify?.(`VAULT ERROR: ${result.error}`, true);
    } else if (refresh) {
      void load(listing.path);
    }
    return result.ok;
  }

  async function pasteInto(destRel) {
    if (!clipboard) return;
    const copied = await doOp(window.archiveApi.vaultCopy(clipboard.rel, destRel));
    if (copied) {
      notify?.(`COPIED: ${clipboard.name}`);
      setClipboard(null);
    }
  }

  function copyPath(rel) {
    const link = `/VAULT/${rel}`;
    navigator.clipboard.writeText(link).then(
      () => notify?.(`PATH COPIED: ${link}`),
      () => notify?.("CLIPBOARD UNAVAILABLE", true)
    );
  }

  function entryMenu(entry) {
    const rel = relOf(entry);
    const items = [];
    items.push({ label: entry.type === "file" ? "OPEN" : "EXPLORE", onClick: () => openEntry(entry) });
    if (entry.type === "file") {
      items.push({ label: "OPEN WITH SYSTEM APP", onClick: () => window.archiveApi.openFile(rel) });
    }
    if (entry.type === "file" && (entry.kind === "video" || entry.kind === "audio")) {
      items.push({ label: "BROADCAST LIVE FEED", onClick: () => onBroadcast(rel, entry.name) });
    }
    if (entry.type !== "drive") {
      items.push({ divider: true });
      items.push({
        label: "COPY",
        onClick: () => {
          setClipboard({ rel, name: entry.name });
          notify?.(`COPIED: ${entry.name} (paste in a folder)`);
        }
      });
      if (clipboard && entry.type === "dir") {
        items.push({ label: `PASTE INTO ${entry.name}`, onClick: () => pasteInto(rel) });
      }
    }
    items.push({ label: "COPY PATH", onClick: () => copyPath(rel) });
    return items;
  }

  function backgroundMenu() {
    return [
      {
        label: "NEW FOLDER",
        disabled: !inFolder,
        onClick: () => setCreating({ type: "dir", draft: "NEW FOLDER" })
      },
      {
        label: "NEW FILE",
        disabled: !inFolder,
        onClick: () => setCreating({ type: "file", draft: "notes.txt" })
      },
      { divider: true },
      {
        label: clipboard ? `PASTE HERE (${clipboard.name})` : "PASTE",
        disabled: !clipboard || !inFolder,
        onClick: () => pasteInto(listing.path)
      },
      { divider: true },
      { label: "REFRESH", onClick: () => load(listing.path) }
    ];
  }

  if (!sources?.length) {
    return (
      <div>
        <p className="warn">NO STORAGE DEVICE LINKED.</p>
        <p className="dim" style={{ margin: "8px 0" }}>
          Link a hard drive, SSD, or external storage in SETTINGS. Linked
          drives are served in full, top to bottom.
        </p>
        <button className="btn" onClick={onOpenSettings}>OPEN SETTINGS</button>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: 300 }}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY, entry: null });
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <button
          className="btn small ghost"
          style={{ marginRight: 10 }}
          disabled={!inFolder}
          onClick={() => {
            playSound("click", 0.35);
            void load(crumbs.slice(0, -1).join("/"));
          }}
        >
          {"<"} BACK
        </button>
        <a
          href="#"
          className="bright"
          onClick={(e) => { e.preventDefault(); playSound("click", 0.35); void load(""); }}
          style={{ textDecoration: "none" }}
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
              {labelFor(part, i)}
            </a>
          </React.Fragment>
        ))}
        {clipboard && (
          <span className="dim" style={{ marginLeft: 10, fontSize: 12 }}>
            [ COPY: {clipboard.name} ]
          </span>
        )}
      </div>
      {error && <p className="warn">{error}</p>}
      <table className="data-table">
        <thead>
          <tr><th style={{ width: 52 }}></th><th>NAME</th><th>TYPE</th><th>SIZE</th></tr>
        </thead>
        <tbody>
          {creating && (
            <tr>
              <td className="dim">{creating.type === "dir" ? "[DIR]" : "TXT"}</td>
              <td colSpan={3}>
                <input
                  className="text-input"
                  autoFocus
                  value={creating.draft}
                  onChange={(e) => setCreating({ ...creating, draft: e.target.value })}
                  onKeyDown={async (e) => {
                    if (e.key === "Escape") setCreating(null);
                    if (e.key === "Enter") {
                      const op = creating.type === "dir"
                        ? window.archiveApi.vaultMkdir(listing.path, creating.draft)
                        : window.archiveApi.vaultNewFile(listing.path, creating.draft);
                      const ok = await doOp(op);
                      if (ok) {
                        playSound("confirm", 0.4);
                        setCreating(null);
                      }
                    }
                  }}
                  onBlur={() => setCreating(null)}
                />
              </td>
            </tr>
          )}
          {listing.entries.map((entry) => {
            const rel = relOf(entry);
            const droppable = entry.type !== "file";
            return (
              <tr
                key={entry.id || entry.name}
                className={`click ${dragOver === rel ? "drop-target" : ""}`}
                draggable={entry.type !== "drive"}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/da-rel", rel);
                  e.dataTransfer.setData("text/plain", entry.name);
                }}
                onDragOver={(e) => {
                  if (droppable) {
                    e.preventDefault();
                    setDragOver(rel);
                  }
                }}
                onDragLeave={() => setDragOver((prev) => (prev === rel ? "" : prev))}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOver("");
                  const fromRel = e.dataTransfer.getData("text/da-rel");
                  if (!fromRel || fromRel === rel) return;
                  const ok = await doOp(window.archiveApi.vaultMove(fromRel, rel));
                  if (ok) notify?.(`MOVED INTO ${entry.name}`);
                }}
                onDoubleClick={() => openEntry(entry)}
                onClick={() => {
                  if (entry.type !== "file") {
                    playSound("click", 0.35);
                    void load(rel);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenu({ x: e.clientX, y: e.clientY, entry });
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
                <td className="dim">
                  {entry.type === "drive" ? "STORAGE" : entry.type === "dir" ? "FOLDER" : (entry.ext || "").toUpperCase()}
                </td>
                <td className="dim">{entry.type === "file" ? fmtSize(entry.size) : ""}</td>
              </tr>
            );
          })}
          {!listing.entries.length && !error && !creating && (
            <tr><td colSpan={4} className="dim">EMPTY SECTOR</td></tr>
          )}
        </tbody>
      </table>
      <p className="dim" style={{ marginTop: 10, fontSize: 12 }}>
        Right-click for file operations. Drag entries onto folders to move them.
      </p>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.entry ? entryMenu(menu.entry) : backgroundMenu()}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
