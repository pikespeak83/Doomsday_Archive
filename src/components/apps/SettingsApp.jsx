import React, { useEffect, useState } from "react";
import { playSound, setSoundsEnabled } from "../../lib/sounds.js";

function fmtGb(bytes) {
  if (!bytes) return "?";
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

/** Link full drives or folders to the vault, tune uplink, toggles. */
export default function SettingsApp({ config, onConfigChange }) {
  const [drives, setDrives] = useState([]);
  const [portDraft, setPortDraft] = useState(String(config.port || 8737));
  const sources = config.archiveSources || [];

  useEffect(() => {
    window.archiveApi.listDrives().then(setDrives);
  }, []);

  async function save(partial) {
    const next = await window.archiveApi.saveConfig(partial);
    onConfigChange(next);
    return next;
  }

  async function linkDrive(drive) {
    playSound("confirm", 0.5);
    const next = await window.archiveApi.addDriveSource(drive.letter, drive.label);
    onConfigChange(next);
  }

  async function linkFolder() {
    playSound("confirm", 0.5);
    const next = await window.archiveApi.addFolderSource();
    onConfigChange(next);
  }

  async function unlink(sourceId) {
    playSound("error", 0.4);
    const next = await window.archiveApi.removeSource(sourceId);
    onConfigChange(next);
  }

  const linkedPaths = new Set(sources.map((s) => s.path.toLowerCase()));

  return (
    <div>
      <div className="field-label">LINKED STORAGE (THE VAULT)</div>
      {!sources.length && <p className="warn">NO DEVICE LINKED.</p>}
      {sources.length > 0 && (
        <table className="data-table">
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="bright" style={{ wordBreak: "break-all" }}>{source.label || source.path}</td>
                <td className="dim" style={{ wordBreak: "break-all" }}>{source.path}</td>
                <td style={{ width: 90 }}>
                  <button className="btn small danger" onClick={() => unlink(source.id)}>UNLINK</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button className="btn" onClick={linkFolder}>LINK FOLDER...</button>
      </div>

      <div className="field-label">DETECTED DRIVES (LINK SERVES THE FULL DRIVE)</div>
      <table className="data-table">
        <tbody>
          {drives.map((drive) => {
            const linked = linkedPaths.has(`${drive.letter.toLowerCase()}:\\`);
            return (
              <tr key={drive.letter}>
                <td className="bright">{drive.letter}:</td>
                <td>{drive.label || <span className="dim">unlabeled</span>}</td>
                <td className="dim">{drive.type}</td>
                <td className="dim">
                  {drive.totalBytes ? `${fmtGb(drive.freeBytes)} free / ${fmtGb(drive.totalBytes)}` : ""}
                </td>
                <td style={{ width: 90 }}>
                  {linked
                    ? <span className="badge live">LINKED</span>
                    : <button className="btn small" onClick={() => linkDrive(drive)}>LINK</button>}
                </td>
              </tr>
            );
          })}
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

export function Toggle({ label, checked, onChange }) {
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
