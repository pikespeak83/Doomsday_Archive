import React, { useEffect, useRef, useState } from "react";
import BootScreen from "../components/BootScreen.jsx";
import TopBar from "../components/TopBar.jsx";
import Seal from "../components/Seal.jsx";
import FolderIcon from "../components/FolderIcon.jsx";
import WindowFrame from "../components/WindowFrame.jsx";
import ClickSpark from "../reactbits/ClickSpark.jsx";
import LetterGlitch from "../reactbits/LetterGlitch.jsx";
import DecryptedText from "../reactbits/DecryptedText.jsx";
import RemoteArchiveApp from "./apps/RemoteArchiveApp.jsx";
import FieldUplinkApp from "./apps/FieldUplinkApp.jsx";
import FieldSettingsApp from "./apps/FieldSettingsApp.jsx";
import FieldHelpApp from "./apps/FieldHelpApp.jsx";
import { playSound, setSoundsEnabled } from "../lib/sounds.js";
import { baseUrl, listFiles, requestAccess, accessState } from "./api.js";

const FIELD_BOOT_LINES = [
  "DCI FIELD TERMINAL v1.0.0 :: SECURE KERNEL LOADED",
  "CHECKING LOCAL HARDWARE ........ OK",
  "UPLINK RECEIVER ................ READY",
  "EXTERNAL NETWORKS .............. SEVERED",
  "SEARCHING FOR HOST NODE ........"
];

const APPS = [
  { id: "archive", label: "Archive", width: 640 },
  { id: "uplink", label: "Uplink", width: 540 },
  { id: "help", label: "Help", width: 560 },
  { id: "settings", label: "Settings", width: 520 }
];

let toastId = 0;

/**
 * Field terminal state machine:
 * boot -> connect (discover / manual) -> pending -> desktop
 */
export default function FieldApp() {
  const [config, setConfig] = useState(null);
  const [sysInfo, setSysInfo] = useState(null);
  const [phase, setPhase] = useState("boot");
  const [hosts, setHosts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [connectError, setConnectError] = useState("");
  const [connection, setConnection] = useState(null); // { address, port, hostName }
  const [openApps, setOpenApps] = useState([]);
  const [toasts, setToasts] = useState([]);
  const pollRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [cfg, info] = await Promise.all([
        window.fieldApi.getConfig(),
        window.fieldApi.getSysInfo()
      ]);
      setSoundsEnabled(cfg.uiSoundsEnabled !== false);
      setConfig(cfg);
      setSysInfo(info);
      if (cfg.bootAnimationEnabled === false) setPhase("connect");
    })();

    const offDownload = window.fieldApi.onDownload((event) => {
      if (event.done) {
        if (event.state === "completed") {
          playSound("confirm", 0.45);
          pushToast(`RETRIEVED: ${event.file}`);
        } else {
          playSound("error", 0.4);
          pushToast(`RETRIEVAL FAILED: ${event.file}`, true);
        }
      }
    });
    return () => {
      offDownload();
      clearInterval(pollRef.current);
    };
  }, []);

  // after boot, try the saved link first, else scan
  useEffect(() => {
    if (phase !== "connect" || !config) return;
    setConnectError("");
    if (config.hostAddress && config.token) {
      void tryResume();
    } else {
      void scan();
    }
  }, [phase === "connect", config?.deviceId]);

  function pushToast(text, warn = false) {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-3), { id, text, warn }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  }

  async function tryResume() {
    const base = baseUrl(config.hostAddress, config.hostPort);
    try {
      const res = await listFiles(base, config.token, "");
      if (res.ok) {
        setConnection({ address: config.hostAddress, port: config.hostPort, hostName: config.hostName || config.hostAddress });
        setPhase("desktop");
        return;
      }
      if (res.status === 401) {
        // clearance revoked; ask again
        await beginRequest(config.hostAddress, config.hostPort, config.hostName);
        return;
      }
      setConnectError("HOST REFUSED THE LINK. RE-SCAN OR ENTER ADDRESS.");
      void scan();
    } catch {
      setConnectError("SAVED HOST NODE UNREACHABLE.");
      void scan();
    }
  }

  async function scan() {
    setScanning(true);
    playSound("click", 0.35);
    const found = await window.fieldApi.discover();
    setHosts(found);
    setScanning(false);
    if (!found.length) {
      setConnectError("NO HOST NODE FOUND. CHECK THE WIRE OR ENTER THE ADDRESS MANUALLY.");
    } else {
      setConnectError("");
    }
  }

  async function beginRequest(address, port, hostName) {
    const base = baseUrl(address, port);
    try {
      const result = await requestAccess(base, config.deviceId, config.deviceName || sysInfo.hostname);
      const next = await window.fieldApi.saveConfig({ hostAddress: address, hostPort: port, hostName: hostName || address });
      setConfig(next);
      if (result.status === "approved" && result.token) {
        const saved = await window.fieldApi.saveConfig({ token: result.token });
        setConfig(saved);
        setConnection({ address, port, hostName: hostName || address });
        playSound("confirm", 0.5);
        setPhase("desktop");
        return;
      }
      if (result.status === "denied") {
        setPhase("denied");
        return;
      }
      setPhase("pending");
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const state = await accessState(base, config.deviceId);
          if (state.json.status === "approved") {
            clearInterval(pollRef.current);
            const saved = await window.fieldApi.saveConfig({ token: state.json.token });
            setConfig(saved);
            setConnection({ address, port, hostName: state.json.host || hostName || address });
            playSound("confirm", 0.55);
            setPhase("desktop");
          } else if (state.json.status === "denied") {
            clearInterval(pollRef.current);
            playSound("error", 0.5);
            setPhase("denied");
          }
        } catch {
          // host went away mid-wait; keep polling
        }
      }, 2500);
    } catch {
      setConnectError("COULD NOT REACH THAT NODE.");
      setPhase("connect");
    }
  }

  async function disconnect() {
    clearInterval(pollRef.current);
    const next = await window.fieldApi.saveConfig({ token: "", hostAddress: "", hostName: "" });
    setConfig(next);
    setConnection(null);
    setOpenApps([]);
    setPhase("connect");
  }

  function openApp(id) {
    playSound("click", 0.4);
    setOpenApps((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function closeApp(id) {
    setOpenApps((prev) => prev.filter((a) => a !== id));
  }

  if (!config || !sysInfo) {
    return <div className="os-root crt" />;
  }

  const stats = [
    { label: connection ? `LINK:${(connection.hostName || "").toUpperCase()}` : "LINK:NONE", on: Boolean(connection) },
    { label: "MODE:FIELD", on: true }
  ];

  return (
    <div className="os-root crt">
      <ClickSpark sparkColor="#b6ff6a">
      {phase === "boot" && (
        <BootScreen
          hostname={sysInfo.hostname}
          lines={FIELD_BOOT_LINES}
          subtitle="DATA CONTAINMENT INITIATIVE :: FIELD TERMINAL READY"
          onDone={() => setPhase("connect")}
        />
      )}

      <TopBar stats={stats} />

      {(phase === "connect" || phase === "pending" || phase === "denied") && (
        <div className="desktop">
          <LetterGlitch glitchSpeed={80} opacity={0.12} outerVignette />
          <div className="connect-wrap">
            <Seal className="connect-seal" />
            <div className="panel connect-panel">
              {phase === "connect" && (
                <>
                  <div className="bright" style={{ letterSpacing: 3, marginBottom: 6 }}>
                    UPLINK SEARCH
                  </div>
                  <div className="dim" style={{ fontSize: 13, marginBottom: 10 }}>
                    Scanning the local wire for an archive host node. No
                    internet, no wifi required.
                  </div>
                  <div className="field-label">OPERATIVE / DEVICE NAME</div>
                  <input
                    className="text-input"
                    value={config.deviceName || ""}
                    maxLength={40}
                    onChange={async (e) => {
                      const next = await window.fieldApi.saveConfig({ deviceName: e.target.value });
                      setConfig(next);
                    }}
                  />
                  <div className="field-label">
                    DETECTED HOST NODES {scanning && <span className="cursor-block" />}
                  </div>
                  {hosts.map((host) => (
                    <div className="pending-card" key={`${host.address}:${host.port}`}>
                      <div>
                        <div className="bright">{host.name}</div>
                        <div className="dim" style={{ fontSize: 12 }}>
                          {host.address}:{host.port} {host.running ? "" : "(UPLINK OFFLINE)"}
                        </div>
                      </div>
                      <button
                        className="btn small"
                        disabled={!host.running}
                        onClick={() => beginRequest(host.address, host.port, host.name)}
                      >
                        CONNECT
                      </button>
                    </div>
                  ))}
                  {!hosts.length && !scanning && (
                    <p className="dim" style={{ fontSize: 13 }}>No nodes detected yet.</p>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <button className="btn" onClick={scan} disabled={scanning}>
                      {scanning ? "SCANNING..." : "RE-SCAN"}
                    </button>
                  </div>
                  <div className="field-label">MANUAL ADDRESS (e.g. 192.168.1.20 or 192.168.1.20:8737)</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="text-input"
                      value={manualAddress}
                      placeholder="host address"
                      onChange={(e) => setManualAddress(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && connectManual()}
                    />
                    <button className="btn" onClick={connectManual}>LINK</button>
                  </div>
                  {connectError && (
                    <p className="warn" style={{ marginTop: 10, fontSize: 13 }}>{connectError}</p>
                  )}
                </>
              )}

              {phase === "pending" && (
                <>
                  <div className="bright" style={{ letterSpacing: 3, marginBottom: 10 }}>
                    <DecryptedText text="TRANSMISSION RECEIVED BY HOST NODE" speed={26} />
                  </div>
                  <div className="status-line">
                    AWAITING HOST APPROVAL<span className="cursor-block" />
                  </div>
                  <p className="dim" style={{ fontSize: 13, marginTop: 10 }}>
                    The host must grant this device clearance in DEVICES on the
                    archive terminal.
                  </p>
                  <button className="btn danger" style={{ marginTop: 12 }} onClick={disconnect}>
                    ABORT REQUEST
                  </button>
                </>
              )}

              {phase === "denied" && (
                <>
                  <div className="warn" style={{ letterSpacing: 3, marginBottom: 10 }}>
                    ACCESS DENIED BY HOST NODE
                  </div>
                  <button className="btn" onClick={() => setPhase("connect")}>BACK TO SEARCH</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "desktop" && connection && (
        <div className="desktop">
          <div className="map-grid" />
          <div className="world-map" />
          <Seal className="desktop-seal" />

          <div className="icon-column">
            {APPS.map((app) => (
              <button key={app.id} className="desk-icon" onClick={() => openApp(app.id)}>
                <FolderIcon />
                <span>{app.label}</span>
              </button>
            ))}
          </div>

          {openApps.map((id, index) => {
            const meta = APPS.find((a) => a.id === id);
            const initial = { x: 90 + index * 36, y: 48 + index * 30 };
            return (
              <WindowFrame
                key={id}
                title={`DCI // ${meta.label.toUpperCase()}`}
                width={meta.width}
                initial={initial}
                onClose={() => closeApp(id)}
              >
                {id === "archive" && (
                  <RemoteArchiveApp connection={connection} config={config} onAuthLost={disconnect} />
                )}
                {id === "uplink" && (
                  <FieldUplinkApp connection={connection} onDisconnect={disconnect} />
                )}
                {id === "settings" && (
                  <FieldSettingsApp config={config} onConfigChange={setConfig} />
                )}
                {id === "help" && <FieldHelpApp sysInfo={sysInfo} connection={connection} />}
              </WindowFrame>
            );
          })}
        </div>
      )}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.warn ? "warn" : ""}`}>
            {toast.text}
          </div>
        ))}
      </div>
      </ClickSpark>
    </div>
  );

  function connectManual() {
    const raw = manualAddress.trim();
    if (!raw) return;
    const [address, portRaw] = raw.split(":");
    const port = Number(portRaw) || 8737;
    void beginRequest(address, port, address);
  }
}
