import React, { useEffect, useRef, useState } from "react";

/**
 * In-OS media viewer: images, video, audio, and text files.
 * `media` = { kind, src, name }. Video/audio keep playing while minimized.
 */
export default function MediaViewer({ media }) {
  const [text, setText] = useState(null);
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
    default:
      return <p className="dim">No viewer for this file type.</p>;
  }
}
