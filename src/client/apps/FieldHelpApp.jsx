import React from "react";

export default function FieldHelpApp({ sysInfo, connection }) {
  return (
    <div style={{ maxWidth: 500 }}>
      <p className="bright" style={{ letterSpacing: 2 }}>FIELD MANUAL // FIELD TERMINAL</p>
      <hr className="hr" />
      <p className="dim">
        This device reads the household archive from the host node. Everything
        travels over your own wires or the host hotspot. The grid can stay
        dead; the archive does not care.
      </p>

      <div className="field-label">GETTING CONNECTED</div>
      <p className="dim" style={{ fontSize: 13 }}>
        1. Be on the same wire: ethernet into the same router or switch, a
        direct cable to the host PC, or the host's Windows Mobile hotspot.<br />
        2. UPLINK SEARCH finds the host automatically. If not, type the
        address shown in the host's UPLINK window.<br />
        3. The host grants your device clearance in DEVICES. Once granted,
        the vault opens here.
      </p>

      <div className="field-label">RETRIEVING FILES</div>
      <p className="dim" style={{ fontSize: 13 }}>
        RETRIEVE copies a file from the vault to Downloads/Doomsday Archive
        on this device. Access is read-only; nothing you do here can touch
        the host's storage.
      </p>

      <hr className="hr" />
      <p className="dim" style={{ fontSize: 12 }}>
        DEVICE: {sysInfo?.hostname} // LINKED TO: {connection?.hostName || "none"} // VERSION: {sysInfo?.version}
      </p>
      <p className="dim" style={{ fontSize: 12 }}>PROTECT // CONTAIN // SECURE</p>
    </div>
  );
}
