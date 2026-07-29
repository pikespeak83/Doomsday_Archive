import React, { useEffect, useState } from "react";
import { playSound, setSoundsEnabled } from "../../lib/sounds.js";

function fmtSize(bytes) {
  if (!bytes) return "?";
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

/** Link storage, tune uplink, toggle boot animation and sounds. */
export default function SettingsApp({ config, onConfigChange, lanState }) {
  const [drives, setDrives] = useState([]);
  const [portDraft, setPortDraft] = useState(String(config.port || 8737));

  useEffect(() => {
    window.archiveApi.listDrives().then(setDrives);
  }, []);

  async function save(partial) {
    const next = await window.archiveApi.saveConfig(partial);
    onConfigChange(next);
    return next;
  }

  async function linkDrive(letter) {
    playSound("confirm", 0.5);
    await save({ archiveRoot: `${letter}:\\` });
    await window.archiveApi.restartLan();
  }

  async function linkFolder() {
    const folder = await window.archiveApi.pickFolder();
    if (!folder) return;
    playSound("confirm", 0.5);
    await save({ archiveRoot: folder });
    await window.archiveApi.restartLan();
  }

  return (
    <div>
      <div className="field-label">LINKED STORAGE (THE VAULT)</div>
      <p style={{ wordBreak: "break-all" }} className={config.archiveRoot ? "bright" : "warn"}>
        {config.archiveRoot || "NO DEVICE LINKED"}
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button className="btn" onClick={linkFolder}>LINK FOLDER...</button>
        {config.archiveRoot && (
          <button
            className="btn danger"
            onClick={async () => {
              playSound("error", 0.4);
              await save({ archiveRoot: "" });
            }}
          >
            UNLINK
          </button>
        )}
      </div>

      <div className="field-label">DETECTED DRIVES (CLICK TO LINK WHOLE DRIVE)</div>
      <table className="data-table">
        <tbody>
          {drives.map((drive) => (
            <tr key={drive.letter} className="click" onClick={() => linkDrive(drive.letter)}>
              <td className="bright">{drive.letter}:</td>
              <td>{drive.label || <span className="dim">unlabeled</span>}</td>
              <td className="dim">{drive.type}</td>
              <td className="dim">
                {drive.totalBytes ? `${fmtSize(drive.freeBytes)} free / ${fmtSize(drive.totalBytes)}` : ""}
              </td>
            </tr>
          ))}
          {!drives.length && <tr><td className="dim">scanning...</td></tr>}
        </tbody>
      </table>

      <hr className="hr" />
      <div className="field-label">UPLINK PORT</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="text-input"
          style={{ width: 120 }}
          value={portDraft}
          onChange={(e) => setPortDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
        />
        <button
          className="btn"
          onClick={async () => {
            const port = Math.max(1024, Math.min(65535, Number(portDraft) || 8737));
            setPortDraft(String(port));
            playSound("confirm", 0.5);
            await save({ port });
            await window.archiveApi.restartLan();
          }}
        >
          APPLY + RESTART UPLINK
        </button>
      </div>

      <hr className="hr" />
      <Toggle
        label="UPLINK AUTO-START"
        checked={config.sharingEnabled !== false}
        onChange={async (value) => {
          await save({ sharingEnabled: value });
          await window.archiveApi.setSharing(value);
        }}
      />
      <Toggle
        label="ALLOW FIELD DOWNLOADS"
        checked={config.allowDownloads !== false}
        onChange={(value) => save({ allowDownloads: value })}
      />
      <Toggle
        label="BOOT SEQUENCE ANIMATION"
        checked={config.bootAnimationEnabled !== false}
        onChange={(value) => save({ bootAnimationEnabled: value })}
      />
      <Toggle
        label="INTERFACE SOUNDS"
        checked={config.uiSoundsEnabled !== false}
        onChange={(value) => {
          setSoundsEnabled(value);
          return save({ uiSoundsEnabled: value });
        }}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0" }}>
      <span className="dim" style={{ fontSize: 13, letterSpacing: 2 }}>{label}</span>
      <button
        className="btn small"
        onClick={() => {
          playSound("toggle", 0.4);
          onChange(!checked);
        }}
      >
        {checked ? "[ ENABLED ]" : "[ DISABLED ]"}
      </button>
    </div>
  );
}
