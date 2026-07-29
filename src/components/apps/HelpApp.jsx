import React from "react";

export default function HelpApp({ sysInfo }) {
  return (
    <div style={{ maxWidth: 520 }}>
      <p className="bright" style={{ letterSpacing: 2 }}>FIELD MANUAL // DOOMSDAY ARCHIVE</p>
      <hr className="hr" />
      <p className="dim">
        This node stores and serves the household archive with no internet
        connection. Everything travels over your own wires or the host
        hotspot. Nothing leaves the building.
      </p>

      <div className="field-label">HOST CHECKLIST</div>
      <p className="dim" style={{ fontSize: 13 }}>
        1. SETTINGS: link the drive or folder that holds the archive.<br />
        2. UPLINK: confirm the node is transmitting and note the address.<br />
        3. Other devices open that address in any browser.<br />
        4. DEVICES: grant or deny each request personally.
      </p>

      <div className="field-label">NO WIFI? NO PROBLEM</div>
      <p className="dim" style={{ fontSize: 13 }}>
        Use ethernet into the same router or switch (internet not required),
        or turn on the Windows Mobile hotspot on this PC and let devices join
        it, or run a single ethernet cable straight between two PCs.
      </p>

      <div className="field-label">RULES OF THE ARCHIVE</div>
      <p className="dim" style={{ fontSize: 13 }}>
        Field devices are read-only. Only the host touches the vault.
        Clearance can be revoked at any time in DEVICES.
      </p>

      <hr className="hr" />
      <p className="dim" style={{ fontSize: 12 }}>
        NODE: {sysInfo?.hostname} // OPERATOR: {sysInfo?.username} // VERSION: {sysInfo?.version}
      </p>
      <p className="dim" style={{ fontSize: 12 }}>
        PROTECT // CONTAIN // SECURE
      </p>
    </div>
  );
}
