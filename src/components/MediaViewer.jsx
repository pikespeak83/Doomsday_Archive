import React, { useEffect, useRef, useState } from "react";

function hexDump(buffer) {
  const bytes = new Uint8Array(buffer);
  const lines = [];
  for (let off = 0; off < bytes.length; off += 16) {
    const chunk = bytes.slice(off, off + 16);
    const hex = Array.from(chunk).map((b) => b.toString(16).padStart(2, "0")).join(" ");
    const ascii = Array.from(chunk).map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${off.toString(16).padStart(8, "0")}  ${hex.padEnd(47)}  ${ascii}`);
  }
  return lines.join("\n");
}

/**
 * In-OS media viewer: images, video, audio, text, pdf, and a hex/raw view
 * for everything else. `media` = { kind, src, name }.
 */
export default function MediaViewer({ media }) {
  const [text, setText] = useState(null);
  const [hex, setHex] = useState(null);
  const [size, setSize] = useState(null);
  const [error, setError] = useState("");
  const mediaRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (media.kind === "text") {
      fetch(media.src)
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`status ${r.status}`))))
        .then((body) => {
          if (!cancelled) setText(body.slice(0, 200_000));
        })
        .catch((err) => {
          if (!cancelled) setError(String(err.message || err));
        });
    } else if (media.kind === "binary") {
      fetch(media.src, { headers: { Range: "bytes=0-4095" } })
        .then(async (r) => {
          if (!r.ok && r.status !== 206) throw new Error(`status ${r.status}`);
          const cr = r.headers.get("content-range");
          const total = cr ? Number(cr.split("/")[1]) : Number(r.headers.get("content-length") || 0);
          const buf = await r.arrayBuffer();
          if (!cancelled) {
            setSize(total || buf.byteLength);
            setHex(hexDump(buf.slice(0, 4096)));
          }
        })
        .catch((err) => {
          if (!cancelled) setError(String(err.message || err));
        });
    }
    return () => {
      cancelled = true;
    };
  }, [media.src, media.kind]);

  if (error) return <p className="warn">TRANSMISSION ERROR: {error}</p>;

  switch (media.kind) {
    case "image":
      return (
        <div className="viewer-stage">
          <img src={media.src} alt={media.name} className="viewer-img" />
        </div>
      );
    case "video":
      return (
        <div className="viewer-stage dark">
          <video ref={mediaRef} src={media.src} controls autoPlay className="viewer-video" />
        </div>
      );
    case "audio":
      return (
        <div className="viewer-audio">
          <div className="bright" style={{ marginBottom: 10, wordBreak: "break-all" }}>
            {media.name}
          </div>
          <audio ref={mediaRef} src={media.src} controls autoPlay style={{ width: "100%" }} />
        </div>
      );
    case "text":
      return (
        <pre className="viewer-text">{text == null ? "DECRYPTING..." : text || "(empty file)"}</pre>
      );
    case "pdf":
      return (
        <iframe className="viewer-frame" src={media.src} title={media.name} />
      );
    case "binary":
      return (
        <div>
          <div className="dim" style={{ fontSize: 12, marginBottom: 6, wordBreak: "break-all" }}>
            {media.name} :: {size != null ? `${size.toLocaleString()} bytes` : "..."} :: RAW DUMP (FIRST 4 KB)
          </div>
          <pre className="viewer-text hex">{hex == null ? "READING SECTORS..." : hex || "(empty file)"}</pre>
          {media.rel && window.archiveApi && (
            <button className="btn small ghost" style={{ marginTop: 8 }}
              onClick={() => window.archiveApi.openFile(media.rel)}>
              OPEN WITH SYSTEM APP
            </button>
          )}
        </div>
      );
    default:
      return <p className="dim">No viewer for this file type.</p>;
  }
}
