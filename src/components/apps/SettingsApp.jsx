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
      <Toggle
        label="RUN IN TRAY ON CLOSE"
        checked={config.runInTray === true}
        onChange={(value) => save({ runInTray: value })}
      />
      <Toggle
        label="START WITH PC"
        checked={config.startWithPc === true}
        onChange={(value) => save({ startWithPc: value })}
      />
      <Toggle
        label="PC NOTIFICATIONS"
        checked={config.notificationsEnabled !== false}
        onChange={(value) => save({ notificationsEnabled: value })}
      />

      <hr className="hr" />
      <div className="field-label">DESKTOP BACKDROP</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["map", "WORLD MAP"],
          ["emerald", "EMERALD MAP"],
          ["ember", "EMBER MAP"],
          ["crimson", "CRIMSON MAP"],
          ["terminal", "FAULTY TERMINAL"],
          ["glitch", "LETTER GLITCH"],
          ["none", "PLAIN"]
        ].map(([value, label]) => (
          <button
            key={value}
            className={`btn small ${config.desktopBackground === value || (!config.desktopBackground && value === "map") ? "" : "ghost"}`}
            onClick={() => {
              playSound("toggle", 0.4);
              const matched = BACKDROP_THEMES[value];
              void save({ desktopBackground: value, ...(matched ? { theme: matched } : {}) });
            }}
          >
            {label}
          </button>
        ))}
        <button
          className={`btn small ${config.desktopBackground === "image" ? "" : "ghost"}`}
          onClick={async () => {
            playSound("click", 0.4);
            const next = await window.archiveApi.pickBackgroundImage();
            if (next) onConfigChange(next);
          }}
        >
          CUSTOM IMAGE...
        </button>
      </div>
      <p className="dim" style={{ fontSize: 12, marginTop: 6 }}>
        Picking a bundled map switches the whole interface style to match it.
      </p>
      {config.desktopBackground === "image" && config.backgroundImage && (
        <p className="dim" style={{ fontSize: 12, marginTop: 6, wordBreak: "break-all" }}>
          {config.backgroundImage}
        </p>
      )}

      <hr className="hr" />
      <div className="field-label">VAULT PASSPHRASE</div>
      <PasswordSection config={config} onConfigChange={onConfigChange} />

      <hr className="hr" />
      <div className="field-label">STYLES</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["green", "PHOSPHOR GREEN"],
          ["amber", "AMBER ALERT"],
          ["crimson", "CRIMSON PROTOCOL"]
        ].map(([value, label]) => (
          <button
            key={value}
            className={`btn small ${(config.theme || "green") === value ? "" : "ghost"}`}
            onClick={() => {
              playSound("toggle", 0.4);
              void save({ theme: value });
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Bundled backdrops force the matching style. */
const BACKDROP_THEMES = { emerald: "green", ember: "amber", crimson: "crimson" };

function PasswordSection({ config, onConfigChange }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState(null); // { text, warn }
  const passwordSet = Boolean(config.passwordHash);

  async function refreshConfig() {
    const cfg = await window.archiveApi.getConfig();
    onConfigChange(cfg);
  }

  async function apply() {
    const result = await window.archiveApi.setVaultPassword(current, next);
    if (result.ok) {
      playSound("confirm", 0.5);
      setMessage({ text: "PASSPHRASE SET. IT NOW GUARDS THIS TERMINAL AND ALL CONNECTORS." });
      setCurrent("");
      setNext("");
      await refreshConfig();
    } else {
      playSound("error", 0.45);
      setMessage({ text: result.error.toUpperCase(), warn: true });
    }
  }

  async function clear() {
    const result = await window.archiveApi.clearVaultPassword(current);
    if (result.ok) {
      playSound("confirm", 0.5);
      setMessage({ text: "PASSPHRASE REMOVED." });
      setCurrent("");
      setNext("");
      await refreshConfig();
    } else {
      playSound("error", 0.45);
      setMessage({ text: result.error.toUpperCase(), warn: true });
    }
  }

  return (
    <div>
      <p className="dim" style={{ fontSize: 12, marginBottom: 8 }}>
        {passwordSet
          ? "A passphrase is SET. The host must enter it on launch; connectors must send it with access requests."
          : "No passphrase. Anyone on the wire can request access and this terminal opens without a lock."}
      </p>
      {passwordSet && (
        <>
          <div className="field-label">CURRENT PASSPHRASE</div>
          <input
            className="text-input"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </>
      )}
      <div className="field-label">{passwordSet ? "NEW PASSPHRASE" : "SET PASSPHRASE"}</div>
      <input
        className="text-input"
        type="password"
        value={next}
        placeholder="at least 4 characters"
        onChange={(e) => setNext(e.target.value)}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button className="btn small" onClick={apply} disabled={!next}>
          {passwordSet ? "CHANGE PASSPHRASE" : "SET PASSPHRASE"}
        </button>
        {passwordSet && (
          <button className="btn small danger" onClick={clear}>
            REMOVE PASSPHRASE
          </button>
        )}
      </div>
      {message && (
        <p className={message.warn ? "warn" : "bright"} style={{ fontSize: 12, marginTop: 8 }}>
          {message.text}
        </p>
      )}
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
