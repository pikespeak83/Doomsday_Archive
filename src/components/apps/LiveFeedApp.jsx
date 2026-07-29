import React from "react";
import MediaViewer from "../MediaViewer.jsx";
import { playSound } from "../../lib/sounds.js";

/** Host live feed controls: preview what everyone sees, stop the feed. */
export default function LiveFeedApp({ lanState }) {
  const broadcast = lanState?.broadcast;

  if (!broadcast?.active) {
    return (
      <div>
        <div style={{ marginBottom: 10 }}>
          <span className="badge dead">NO LIVE FEED</span>
        </div>
        <p className="dim" style={{ fontSize: 13 }}>
          Right-click a video or audio file in ARCHIVE and choose
          BROADCAST LIVE FEED. Every cleared device gets the stream in
          sync, over the wire only.
        </p>
      </div>
    );
  }

  const src = `vault://${broadcast.path.split("/").map(encodeURIComponent).join("/")}`;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <span className="badge live">TRANSMITTING LIVE</span>
        <span className="dim" style={{ fontSize: 12, wordBreak: "break-all" }}>{broadcast.name}</span>
        <button
          className="btn small danger"
          onClick={async () => {
            playSound("close", 0.45);
            await window.archiveApi.stopFeed();
          }}
        >
          END FEED
        </button>
      </div>
      <MediaViewer media={{ kind: broadcast.kind, src, name: broadcast.name }} />
      <p className="dim" style={{ marginTop: 8, fontSize: 12 }}>
        Field terminals and the browser portal auto-join this feed and stay
        synced to the host clock.
      </p>
    </div>
  );
}
