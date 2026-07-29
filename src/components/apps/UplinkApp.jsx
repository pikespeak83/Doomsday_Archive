import React, { useEffect, useState } from "react";
import { playSound } from "../../lib/sounds.js";

/** Uplink status: how other devices in the house reach this node without internet. */
export default function UplinkApp({ lanState }) {
  const [qr, setQr] = useState(null);
  const running = Boolean(lanState?.running);
  const port = lanState?.port || 8737;
  const interfaces = lanState?.interfaces || [];
  const primary = interfaces[0]?.address;
  const url = primary ? `http://${primary}:${port}` : null;

  useEffect(() => {
    let cancelled = false;
    setQr(null);
    if (url && running) {
      window.archiveApi.getPortalQr(url).then((data) => {
        if (!cancelled) setQr(data);
      });
    }
    return () => { cancelled = true; };
  }, [url, running]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <span className={`badge ${running ? "live" : "dead"}`}>
          {running ? "TRANSMITTING ON LOCAL NET" : "UPLINK OFFLINE"}
        </span>
        <button
          className="btn small"
          onClick={async () => {
            playSound("toggle", 0.45);
            await window.archiveApi.setSharing(!running);
          }}
        >
          {running ? "TAKE OFFLINE" : "BRING ONLINE"}
        </button>
      </div>

      <div className="field-label">FIELD TERMINAL ADDRESSES (OPEN IN ANY BROWSER)</div>
      {!interfaces.length && (
        <p className="warn">
          No local network adapters detected. Connect an ethernet cable or enable
          the mobile hotspot, then reopen this window.
        </p>
      )}
      <table className="data-table">
        <tbody>
          {interfaces.map((iface) => (
            <tr key={iface.name + iface.address}>
              <td className="dim">{iface.name}</td>
              <td className="bright" style={{ userSelect: "text" }}>
                http://{iface.address}:{port}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {qr && (
        <div className="qr-box">
          <img src={qr} alt="Portal QR" />
          <div className="dim" style={{ maxWidth: 260, fontSize: 12 }}>
            Scan with a phone that is on the same local network to open the
            field terminal.
          </div>
        </div>
      )}

      <hr className="hr" />
      <div className="field-label">CONNECTING WITHOUT WIFI OR INTERNET</div>
      <p className="dim" style={{ fontSize: 13 }}>
        1. ETHERNET: plug devices into the same router or a cheap network
        switch. No internet service is needed; the archive only uses the local
        wire.
        <br />
        2. HOTSPOT: on this PC open Windows Settings, then Network, then
        Mobile hotspot, and turn it on. Phones and laptops join that hotspot
        and browse to the address above. Zero internet involved.
        <br />
        3. DIRECT CABLE: a single ethernet cable between two PCs also works
        (Windows auto-assigns addresses).
      </p>
      <p className="dim" style={{ fontSize: 13, marginTop: 8 }}>
        Every new device must be granted clearance in DEVICES before it can
        see any files.
      </p>
    </div>
  );
}
