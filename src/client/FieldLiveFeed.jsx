import React, { useEffect, useRef } from "react";

/**
 * Synced live feed player. Seeks to the host clock position on load and
 * corrects drift so every terminal in the house watches the same moment.
 */
export default function FieldLiveFeed({ src, kind, name, startedAt, clockOffset }) {
  const mediaRef = useRef(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const targetTime = () => Math.max(0, (Date.now() + clockOffset - startedAt) / 1000);

    const onLoaded = () => {
      media.currentTime = targetTime();
      void media.play().catch(() => {});
    };
    media.addEventListener("loadedmetadata", onLoaded);

    const sync = setInterval(() => {
      if (media.readyState < 2 || media.seeking) return;
      const drift = Math.abs(media.currentTime - targetTime());
      if (drift > 1.8) {
        media.currentTime = targetTime();
        void media.play().catch(() => {});
      }
    }, 5000);

    return () => {
      media.removeEventListener("loadedmetadata", onLoaded);
      clearInterval(sync);
    };
  }, [src, startedAt, clockOffset]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <span className="badge live">LIVE FEED</span>
        <span className="dim" style={{ fontSize: 12, wordBreak: "break-all" }}>{name}</span>
      </div>
      {kind === "audio" ? (
        <audio ref={mediaRef} src={src} controls style={{ width: "100%" }} />
      ) : (
        <div className="viewer-stage dark">
          <video ref={mediaRef} src={src} controls className="viewer-video" />
        </div>
      )}
      <p className="dim" style={{ marginTop: 8, fontSize: 12 }}>
        Synced to the host clock. Seeking rejoins the live position after a
        few seconds.
      </p>
    </div>
  );
}
