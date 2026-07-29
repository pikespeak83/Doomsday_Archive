import React from "react";
import { playSound } from "../../lib/sounds.js";

/** Approve, deny, and revoke connected household devices. */
export default function DevicesApp({ lanState }) {
  const pending = lanState?.pending || [];
  const approved = lanState?.approved || [];

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <span className={`badge ${lanState?.running ? "live" : "dead"}`}>
          {lanState?.running ? "UPLINK ACTIVE" : "UPLINK OFFLINE"}
        </span>
      </div>

      <div className="field-label">INCOMING ACCESS REQUESTS</div>
      {!pending.length && <p className="dim">No devices awaiting clearance.</p>}
      {pending.map((request) => (
        <div className="pending-card" key={request.id}>
          <div>
            <div className="bright">{request.name}</div>
            <div className="dim" style={{ fontSize: 12 }}>
              {request.remote?.replace("::ffff:", "") || "unknown address"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn small"
              onClick={async () => {
                playSound("confirm", 0.5);
                await window.archiveApi.approveDevice(request.id);
              }}
            >
              GRANT
            </button>
            <button
              className="btn small danger"
              onClick={async () => {
                playSound("error", 0.4);
                await window.archiveApi.denyDevice(request.id);
              }}
            >
              DENY
            </button>
          </div>
        </div>
      ))}

      <hr className="hr" />
      <div className="field-label">CLEARED DEVICES</div>
      {!approved.length && <p className="dim">No devices cleared yet.</p>}
      {approved.length > 0 && (
        <table className="data-table">
          <thead>
            <tr><th>NAME</th><th>CLEARED</th><th>LAST SEEN</th><th></th></tr>
          </thead>
          <tbody>
            {approved.map((device) => (
              <tr key={device.id}>
                <td className="bright">{device.name}</td>
                <td className="dim">{device.approvedAt ? new Date(device.approvedAt).toLocaleDateString() : ""}</td>
                <td className="dim">
                  {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : "never"}
                </td>
                <td>
                  <button
                    className="btn small danger"
                    onClick={async () => {
                      playSound("error", 0.4);
                      await window.archiveApi.revokeDevice(device.id);
                    }}
                  >
                    REVOKE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
