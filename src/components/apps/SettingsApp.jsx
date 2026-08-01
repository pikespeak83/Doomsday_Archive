import React, { useEffect, useState } from "react";
import { playSound, setSoundsEnabled, setMasterVolume } from "../../lib/sounds.js";
import { THEME_CHOICES } from "../../lib/themes.js";

function fmtGb(bytes) {
  if (!bytes) return "?";
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

const TABS = ["STORAGE", "NETWORK", "GRAPHICS", "AUDIO", "AI", "SYSTEM", "SECURITY"];

/** Tabbed settings: storage, network, graphics, audio, system, security. */
export default function SettingsApp({ config, onConfigChange, notify }) {
  const [tab, setTab] = useState("STORAGE");
  const [drives, setDrives] = useState([]);
  const [portDraft, setPortDraft] = useState(String(config.port || 8737));
  const [core, setCore] = useState(null); // local LLM core status
  const sources = config.archiveSources || [];

  useEffect(() => {
    window.archiveApi.listDrives().then(setDrives);
  }, []);

  useEffect(() => {
    if (tab !== "AI") return;
    setCore(null);
    window.archiveApi.oracleStatus().then(setCore).catch(() => setCore({ provider: "none" }));
  }, [tab]);

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

  async function provision(sourceId) {
    playSound("confirm", 0.5);
    const res = await window.archiveApi.provisionArchive(sourceId);
    if (res.ok) notify?.(`STANDARD ARCHIVE FOLDERS READY (${res.created} CREATED)`);
    else notify?.(`PROVISION FAILED: ${res.error}`, true);
  }

  const linkedPaths = new Set(sources.map((s) => s.path.toLowerCase()));

  return (
    <div>
      <div className="app-tabs">
        {TABS.map((t) => (
          <button key={t} className={`app-tab ${tab === t ? "on" : ""}`}
            onClick={() => { playSound("click", 0.3); setTab(t); }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "STORAGE" && (
        <>
          <div className="field-label" style={{ marginTop: 0 }}>LINKED STORAGE (THE VAULT)</div>
          {!sources.length && <p className="warn">NO DEVICE LINKED.</p>}
          {sources.length > 0 && (
            <table className="data-table">
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td className="bright" style={{ wordBreak: "break-all" }}>{source.label || source.path}</td>
                    <td className="dim" style={{ wordBreak: "break-all" }}>{source.path}</td>
                    <td style={{ width: 190, textAlign: "right" }}>
                      <button className="btn small ghost" onClick={() => provision(source.id)}>PROVISION</button>{" "}
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
          <p className="dim" style={{ fontSize: 11, marginTop: 6 }}>
            PROVISION creates the standard doomsday folder tree (collapse phases, field manuals,
            protocol binder, fallout shelter, family documents, SOPs, disaster forms).
          </p>

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
        </>
      )}

      {tab === "NETWORK" && (
        <>
          <div className="field-label" style={{ marginTop: 0 }}>UPLINK PORT</div>
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
        </>
      )}

      {tab === "GRAPHICS" && (
        <>
          <div className="field-label" style={{ marginTop: 0 }}>DESKTOP BACKDROP</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              ["map", "WORLD MAP"],
              ["emerald", "EMERALD MAP"],
              ["ember", "EMBER MAP"],
              ["crimson", "CRIMSON MAP"],
              ["onyx", "ONYX MAP"],
              ["circuit", "BLUE CIRCUIT"],
              ["gold", "GOLD GRID"],
              ["vaultec", "VAULT-TEC POSTER"],
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

          <div className="field-label">STYLES</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {THEME_CHOICES.map(([value, label]) => (
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

          <hr className="hr" />
          <Toggle
            label="CRT SCANLINES"
            checked={config.scanlinesEnabled !== false}
            onChange={(value) => save({ scanlinesEnabled: value })}
          />
          <Toggle
            label="REDUCE MOTION (ACCESSIBILITY)"
            checked={config.reduceMotion === true}
            onChange={(value) => save({ reduceMotion: value })}
          />
          <Toggle
            label="BOOT SEQUENCE ANIMATION"
            checked={config.bootAnimationEnabled !== false}
            onChange={(value) => save({ bootAnimationEnabled: value })}
          />
        </>
      )}

      {tab === "AUDIO" && (
        <>
          <Toggle
            label="INTERFACE SOUNDS"
            checked={config.uiSoundsEnabled !== false}
            onChange={(value) => {
              setSoundsEnabled(value);
              return save({ uiSoundsEnabled: value });
            }}
          />
          <Toggle
            label="ALERT CHIME ON NOTIFICATIONS"
            checked={config.chimeEnabled !== false}
            onChange={(value) => save({ chimeEnabled: value })}
          />
          <div className="field-label">MASTER VOLUME :: {Math.round((config.soundVolume ?? 1) * 100)}%</div>
          <input
            type="range" min="0" max="100" className="vol-slider"
            value={Math.round((config.soundVolume ?? 1) * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              setMasterVolume(v);
              void save({ soundVolume: v });
            }}
            onMouseUp={() => playSound("click", 0.5)}
          />
        </>
      )}

      {tab === "AI" && (
        <>
          <div className="field-label" style={{ marginTop: 0 }}>ORACLE AI PROVIDER</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              ["auto", "AUTO"],
              ["ollama", "OLLAMA (LOCAL)"],
              ["openai", "OPENAI"],
              ["google", "GOOGLE"],
              ["off", "OFF"]
            ].map(([value, label]) => (
              <button key={value}
                className={`btn small ${(config.aiProvider || "auto") === value ? "" : "ghost"}`}
                onClick={() => { playSound("toggle", 0.4); void save({ aiProvider: value }); }}>
                {label}
              </button>
            ))}
          </div>
          <p className="dim" style={{ fontSize: 11, marginTop: 6 }}>
            AUTO prefers a local Ollama model (fully offline), then falls back to whichever
            cloud key is set. Cloud providers only work while the grid is up.
          </p>

          <div className="field-label">LOCAL CORE (OLLAMA)</div>
          <p className="dim" style={{ fontSize: 12, margin: "2px 0 6px" }}>
            {core === null
              ? "PROBING LOCAL CORE..."
              : core.provider === "ollama"
                ? `LOCAL CORE ONLINE :: MODELS: ${(core.models || []).join(", ").toUpperCase() || "NONE PULLED"}`
                : "LOCAL CORE OFFLINE :: THE ORACLE RUNS FULLY OFFLINE ONCE OLLAMA IS INSTALLED"}
          </p>
          {core !== null && core.provider !== "ollama" && (
            <>
              <button
                className="btn small"
                onClick={() => {
                  playSound("confirm", 0.5);
                  void window.archiveApi.openExternal("https://ollama.com/download");
                }}>
                GET OLLAMA (EXTERNAL GRID LINK)
              </button>
              <p className="dim" style={{ fontSize: 11, marginTop: 6 }}>
                Install it, then run: ollama pull llama3.2 :: the ORACLE detects the local
                core automatically, no key or grid link needed after that.
              </p>
            </>
          )}

          <div className="field-label">OPENAI API KEY</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="text-input" type="password" style={{ flex: 1 }}
              placeholder="sk-..."
              value={config.openaiKey || ""}
              onChange={(e) => save({ openaiKey: e.target.value.trim() })} />
            <input className="text-input" style={{ width: 160 }}
              title="OpenAI model"
              value={config.openaiModel || "gpt-4o-mini"}
              onChange={(e) => save({ openaiModel: e.target.value.trim() })} />
          </div>

          <div className="field-label">GOOGLE AI API KEY</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="text-input" type="password" style={{ flex: 1 }}
              placeholder="AIza..."
              value={config.googleKey || ""}
              onChange={(e) => save({ googleKey: e.target.value.trim() })} />
            <input className="text-input" style={{ width: 160 }}
              title="Google model"
              value={config.googleModel || "gemini-2.0-flash"}
              onChange={(e) => save({ googleModel: e.target.value.trim() })} />
          </div>
          <p className="dim" style={{ fontSize: 11, marginTop: 6 }}>
            Keys are stored locally in this node's config file and never leave the machine
            except to call the provider you selected.
          </p>
        </>
      )}

      {tab === "SYSTEM" && (
        <>
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
          <Toggle
            label="AMBIENT SYSTEM EVENTS"
            checked={config.ambientEventsEnabled !== false}
            onChange={(value) => save({ ambientEventsEnabled: value })}
          />
          <hr className="hr" />
          <UpdateSection api={window.archiveApi} label="NODE SOFTWARE" />
        </>
      )}

      {tab === "SECURITY" && (
        <>
          <div className="field-label" style={{ marginTop: 0 }}>VAULT PASSPHRASE</div>
          <PasswordSection config={config} onConfigChange={onConfigChange} />
        </>
      )}
    </div>
  );
}

/** Bundled backdrops force the matching style. */
const BACKDROP_THEMES = { emerald: "green", ember: "amber", crimson: "crimson", onyx: "mono", circuit: "cobalt", gold: "gold", vaultec: "vault" };

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

/** Version readout + manual grid update check; shared by host and field settings. */
export function UpdateSection({ api, label }) {
  const [version, setVersion] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null); // { text, warn }

  useEffect(() => {
    api.getSysInfo().then((info) => setVersion(info.version || ""));
  }, []);

  async function check() {
    playSound("confirm", 0.5);
    setChecking(true);
    setResult(null);
    try {
      const res = await api.checkForUpdates();
      if (res.status === "current") setResult({ text: `THIS NODE IS CURRENT (v${version})` });
      else if (res.status === "offline") setResult({ text: "GRID UNREACHABLE :: RUNNING ARCHIVED SOFTWARE", warn: true });
      else if (res.status === "dev") setResult({ text: "DEV NODE :: LIVE UPDATER OFFLINE", warn: true });
      else if (res.status === "busy") setResult({ text: "UPDATER ALREADY WORKING", warn: true });
      else if (res.status === "skipped") setResult({ text: `UPDATE ${res.remoteVersion} AVAILABLE ON THE GRID` });
      // "installing" restarts the app; nothing to render
    } catch {
      setResult({ text: "UPDATE CHECK FAILED", warn: true });
    }
    setChecking(false);
  }

  return (
    <div>
      <div className="field-label">{label}</div>
      <p className="dim" style={{ fontSize: 12, margin: "2px 0 8px" }}>
        INSTALLED VERSION :: v{version || "?"} :: checks the GitHub grid when reachable
      </p>
      <button className="btn" onClick={check} disabled={checking}>
        {checking ? "SCANNING THE GRID..." : "CHECK GRID FOR UPDATES"}
      </button>
      {result && (
        <p className={result.warn ? "warn" : "bright"} style={{ fontSize: 12, marginTop: 8 }}>
          {result.text}
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
