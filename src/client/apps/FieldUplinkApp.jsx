import React from "react";
import { playSound } from "../../lib/sounds.js";

export default function FieldUplinkApp({ connection, onDisconnect }) {
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <span className="badge live">LINKED TO HOST NODE</span>
      </div>
      <table className="data-table">
        <tbody>
          <tr><td className="dim">HOST</td><td className="bright">{connection.hostName}</td></tr>
          <tr><td className="dim">ADDRESS</td><td className="bright" style={{ userSelect: "text" }}>{connection.address}:{connection.port}</td></tr>
          <tr><td className="dim">MODE</td><td className="bright">READ-ONLY FIELD ACCESS</td></tr>
        </tbody>
      </table>
      <hr className="hr" />
      <p className="dim" style={{ fontSize: 13 }}>
        This link runs over the local wire or the host hotspot only. If the
        host takes the uplink offline or revokes clearance, the archive
        disappears until re-granted.
      </p>
      <button
        className="btn danger"
        style={{ marginTop: 12 }}
        onClick={() => {
          playSound("close", 0.4);
          onDisconnect();
        }}
      >
        SEVER LINK
      </button>
    </div>
  );
}
