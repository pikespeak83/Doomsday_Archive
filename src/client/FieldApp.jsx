import React, { useEffect, useRef, useState } from "react";
import BootScreen from "../components/BootScreen.jsx";
import TopBar from "../components/TopBar.jsx";
import Seal from "../components/Seal.jsx";
import DeskIcon from "../components/DeskIcon.jsx";
import ContextMenu from "../components/ContextMenu.jsx";
import WindowFrame from "../components/WindowFrame.jsx";
import FaultyTerminal from "../reactbits/FaultyTerminal.jsx";
import DecryptedText from "../reactbits/DecryptedText.jsx";
import TextType from "../reactbits/TextType.jsx";
import ASCIIText from "../reactbits/ASCIIText.jsx";
import LineSidebar from "../reactbits/LineSidebar.jsx";
import RemoteArchiveApp from "./apps/RemoteArchiveApp.jsx";
import FieldUplinkApp from "./apps/FieldUplinkApp.jsx";
import FieldSettingsApp from "./apps/FieldSettingsApp.jsx";
import FieldHelpApp from "./apps/FieldHelpApp.jsx";
import FieldLiveFeed from "./FieldLiveFeed.jsx";
import MediaViewer from "../components/MediaViewer.jsx";
import TaskBar from "../components/TaskBar.jsx";
import { THEME_FX, BUNDLED_BACKDROPS } from "../lib/themes.js";
import { playSound, setSoundsEnabled } from "../lib/sounds.js";
import { baseUrl, listFiles, requestAccess, accessState, hostInfo, broadcastState, downloadUrl } from "./api.js";

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
let windowKey = 0;

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
  const [passphrase, setPassphrase] = useState("");
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [connection, setConnection] = useState(null); // { address, port, hostName }
  const [windows, setWindows] = useState([]); // { key, type, appId, media, feed, title, width, minimized }
  const [toasts, setToasts] = useState([]);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [deskMenu, setDeskMenu] = useState(null); // { x, y }
  const pollRef = useRef(null);
  const feedPollRef = useRef(null);
  const feedKeyRef = useRef(null);

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
    const offUpdate = window.fieldApi.onUpdateEvent((event) => {
      if (event.type === "update-found") {
        playSound("alert", 0.5);
        pushToast(`GRID TRANSMISSION: UPDATE ${event.version} DETECTED`);
      } else if (event.type === "update-downloading") {
        pushToast(`RETRIEVING UPDATE ${event.version} FROM THE GRID...`);
      } else if (event.type === "update-ready") {
        pushToast(`UPDATE ${event.version} RETRIEVED. RESTARTING TERMINAL...`);
      }
    });
    return () => {
      offDownload();
      offUpdate();
      clearInterval(pollRef.current);
      clearInterval(feedPollRef.current);
    };
  }, []);

  // live feed auto-join: poll while linked
  useEffect(() => {
    clearInterval(feedPollRef.current);
    if (phase !== "desktop" || !connection) return;
    const base = baseUrl(connection.address, connection.port);
    let lastActivePath = null;
    const poll = async () => {
      try {
        const res = await broadcastState(base, config.token);
        if (!res.ok) return;
        const state = res.json;
        if (state.active && state.path !== lastActivePath) {
          lastActivePath = state.path;
          const clockOffset = state.serverNow - Date.now();
          playSound("alert", 0.5);
          pushToast(`LIVE FEED FROM HOST: ${state.name}`);
          openFeedWindow({
            src: downloadUrl(base, config.token, state.path, true),
            kind: state.kind,
            name: state.name,
            startedAt: state.startedAt,
            clockOffset
          });
        } else if (!state.active && lastActivePath) {
          lastActivePath = null;
          closeFeedWindow();
          pushToast("LIVE FEED ENDED BY HOST");
        }
      } catch {
        // host unreachable; uplink app handles that
      }
    };
    void poll();
    feedPollRef.current = setInterval(poll, 4000);
    return () => clearInterval(feedPollRef.current);
  }, [phase, connection?.address, config?.token]);

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
      // does this node demand a passphrase?
      try {
        const info = await hostInfo(base);
        if (info.ok && info.json.passwordRequired && !passphrase) {
          setNeedsPassphrase(true);
          setConnectError("THIS NODE DEMANDS A PASSPHRASE. ENTER IT BELOW.");
          setPhase("connect");
          return;
        }
      } catch {
        // older host without host-info; proceed
      }
      const result = await requestAccess(base, config.deviceId, config.deviceName || sysInfo.hostname, passphrase);
      if (result.status === "unauthorized") {
        setNeedsPassphrase(true);
        playSound("error", 0.5);
        setConnectError("INVALID PASSPHRASE.");
        setPhase("connect");
        return;
      }
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
    clearInterval(feedPollRef.current);
    const next = await window.fieldApi.saveConfig({ token: "", hostAddress: "", hostName: "" });
    setConfig(next);
    setConnection(null);
    setWindows([]);
    setPhase("connect");
  }

  function openApp(appId) {
    playSound("click", 0.4);
    setWindows((prev) => {
      const existing = prev.find((w) => w.appId === appId);
      if (existing) {
        return prev.map((w) => (w.key === existing.key ? { ...w, minimized: false } : w));
      }
      const meta = APPS.find((a) => a.id === appId);
      return [...prev, {
        key: `app-${++windowKey}`,
        type: "app",
        appId,
        title: `DCI // ${meta.label.toUpperCase()}`,
        width: meta.width,
        minimized: false
      }];
    });
  }

  function openMedia(media) {
    playSound("open", 0.4);
    setWindows((prev) => [...prev, {
      key: `media-${++windowKey}`,
      type: "media",
      media,
      title: `${media.kind.toUpperCase()} // ${media.name.toUpperCase().slice(0, 34)}`,
      width: media.kind === "audio" ? 420 : media.kind === "text" ? 560 : 640,
      minimized: false
    }]);
  }

  function openFeedWindow(feed) {
    setWindows((prev) => {
      const without = prev.filter((w) => w.type !== "feed");
      const key = `feed-${++windowKey}`;
      feedKeyRef.current = key;
      return [...without, {
        key,
        type: "feed",
        feed,
        title: `LIVE FEED // ${feed.name.toUpperCase().slice(0, 30)}`,
        width: feed.kind === "audio" ? 440 : 660,
        minimized: false
      }];
    });
  }

  function closeFeedWindow() {
    setWindows((prev) => prev.filter((w) => w.type !== "feed"));
    feedKeyRef.current = null;
  }

  function closeWindow(key) {
    setWindows((prev) => prev.filter((w) => w.key !== key));
  }

  function toggleMinimize(key, value) {
    setWindows((prev) =>
      prev.map((w) => (w.key === key ? { ...w, minimized: value ?? !w.minimized } : w))
    );
  }

  function shutdown() {
    if (shuttingDown) return;
    setShuttingDown(true);
    playSound("close", 0.5);
    setTimeout(() => window.fieldApi.close(), 780);
  }

  if (!config || !sysInfo) {
    return <div className="os-root crt" />;
  }

  const stats = [
    { label: connection ? `LINK:${(connection.hostName || "").toUpperCase()}` : "LINK:NONE", on: Boolean(connection) },
    { label: "MODE:FIELD", on: true }
  ];

  const theme = config.theme || "green";
  const fx = THEME_FX[theme] || THEME_FX.green;
  const themeClass = theme === "green" ? "" : `theme-${theme}`;
  const backdrop = config.desktopBackground || "map";
  const bundledBackdrop = BUNDLED_BACKDROPS[backdrop];
  const iconPositions = config.iconPositions || {};

  async function moveIcon(appId, pos) {
    const next = await window.fieldApi.saveConfig({
      iconPositions: { ...(config.iconPositions || {}), [appId]: pos }
    });
    setConfig(next);
  }

  async function setTheme(value) {
    playSound("toggle", 0.4);
    setConfig(await window.fieldApi.saveConfig({ theme: value }));
  }

  function onDesktopContext(e) {
    if (e.target.closest(".window") || e.target.closest(".desk-icon") || e.target.closest(".taskbar") || e.target.closest(".ctx-menu")) return;
    e.preventDefault();
    setDeskMenu({ x: e.clientX, y: e.clientY });
  }

  const deskMenuItems = [
    { label: "OPEN VAULT", onClick: () => openApp("archive") },
    { label: "SETTINGS", onClick: () => openApp("settings") },
    { divider: true },
    { label: `STYLE :: PHOSPHOR GREEN${theme === "green" ? " (ON)" : ""}`, onClick: () => setTheme("green") },
    { label: `STYLE :: AMBER ALERT${theme === "amber" ? " (ON)" : ""}`, onClick: () => setTheme("amber") },
    { label: `STYLE :: CRIMSON PROTOCOL${theme === "crimson" ? " (ON)" : ""}`, onClick: () => setTheme("crimson") }
  ];

  return (
    <>
    <div className={`os-root crt ${themeClass} ${shuttingDown ? "powering-off" : ""}`}>
      {phase === "boot" && (
        <BootScreen
          hostname={sysInfo.hostname}
          lines={FIELD_BOOT_LINES}
          subtitle="DATA CONTAINMENT INITIATIVE :: FIELD TERMINAL READY"
          glitchColors={fx.glitch}
          onDone={() => setPhase("connect")}
        />
      )}

      <TopBar title="DOOMSDAY FIELD TERMINAL" stats={stats} onShutdown={shutdown} />

      {(phase === "connect" || phase === "pending" || phase === "denied") && (
        <div className="desktop">
          <div className="connect-shader">
            <FaultyTerminal tint="#7dff3f" brightness={0.7} mouseReact={false} timeScale={0.3} />
          </div>
          <div className="connect-wrap">
            <div className="connect-ascii">
              <ASCIIText
                text={phase === "denied" ? "DENIED" : "D.C.I."}
                asciiFontSize={7}
                planeBaseHeight={7}
                enableWaves
                gradient={phase === "denied"
                  ? "radial-gradient(circle, #ff8a76 0%, #ff5f4f 55%, #7a1608 100%)"
                  : "radial-gradient(circle, #b6ff6a 0%, #7dff3f 50%, #3f8a1f 100%)"}
              />
            </div>
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
                  {needsPassphrase && (
                    <>
                      <div className="field-label">HOST PASSPHRASE</div>
                      <input
                        className="text-input"
                        type="password"
                        value={passphrase}
                        placeholder="required by this node"
                        onChange={(e) => setPassphrase(e.target.value)}
                      />
                    </>
                  )}
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
                    <TextType
                      text={[
                        "AWAITING HOST APPROVAL...",
                        "TRANSMISSION HELD IN QUEUE...",
                        "STAND BY, OPERATIVE..."
                      ]}
                      typingSpeed={42}
                      deletingSpeed={18}
                      pauseDuration={1600}
                      cursorCharacter="_"
                    />
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
        <div className="desktop" onContextMenu={onDesktopContext}>
          {backdrop !== "none" && !bundledBackdrop && (
            <div className="desktop-shader">
              <FaultyTerminal tint={fx.tint} brightness={0.55} mouseReact={false} timeScale={0.22} />
            </div>
          )}
          {bundledBackdrop && (
            <div
              className="desktop-image bundled"
              style={{ backgroundImage: `url('${bundledBackdrop.image}')` }}
            />
          )}
          {backdrop === "map" && (
            <>
              <div className="map-grid" />
              <div className="world-map" />
            </>
          )}
          <Seal className="desktop-seal" />

          <LineSidebar
            title="DCI"
            items={APPS.map((app) => ({
              id: app.id,
              label: app.label,
              active: windows.some((w) => w.appId === app.id && !w.minimized)
            }))}
            onSelect={openApp}
          />

          <div className="icon-column">
            {APPS.filter((app) => !iconPositions[app.id]).map((app) => (
              <DeskIcon
                key={app.id}
                label={app.label}
                pos={null}
                onOpen={() => openApp(app.id)}
                onMove={(pos) => moveIcon(app.id, pos)}
              />
            ))}
          </div>
          {APPS.filter((app) => iconPositions[app.id]).map((app) => (
            <DeskIcon
              key={app.id}
              label={app.label}
              pos={iconPositions[app.id]}
              onOpen={() => openApp(app.id)}
              onMove={(pos) => moveIcon(app.id, pos)}
            />
          ))}

          {windows.map((win, index) => {
            const initial = { x: 90 + (index % 8) * 36, y: 48 + (index % 8) * 30 };
            return (
              <WindowFrame
                key={win.key}
                title={win.title}
                width={win.width}
                initial={initial}
                minimized={win.minimized}
                onMinimize={() => toggleMinimize(win.key, true)}
                onClose={() => closeWindow(win.key)}
              >
                {win.type === "media" && <MediaViewer media={win.media} />}
                {win.type === "feed" && (
                  <FieldLiveFeed
                    src={win.feed.src}
                    kind={win.feed.kind}
                    name={win.feed.name}
                    startedAt={win.feed.startedAt}
                    clockOffset={win.feed.clockOffset}
                  />
                )}
                {win.appId === "archive" && (
                  <RemoteArchiveApp
                    connection={connection}
                    config={config}
                    onAuthLost={disconnect}
                    onOpenMedia={openMedia}
                  />
                )}
                {win.appId === "uplink" && (
                  <FieldUplinkApp connection={connection} onDisconnect={disconnect} />
                )}
                {win.appId === "settings" && (
                  <FieldSettingsApp config={config} onConfigChange={setConfig} />
                )}
                {win.appId === "help" && <FieldHelpApp sysInfo={sysInfo} connection={connection} />}
              </WindowFrame>
            );
          })}

          <TaskBar
            windows={windows}
            onToggle={(key) => toggleMinimize(key)}
            onClose={closeWindow}
          />

          {deskMenu && (
            <ContextMenu
              x={deskMenu.x}
              y={deskMenu.y}
              items={deskMenuItems}
              onClose={() => setDeskMenu(null)}
            />
          )}
        </div>
      )}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.warn ? "warn" : ""}`}>
            {toast.text}
          </div>
        ))}
      </div>
    </div>
    {shuttingDown && <div className="crt-off-line" />}
    </>
  );

  function connectManual() {
    const raw = manualAddress.trim();
    if (!raw) return;
    const [address, portRaw] = raw.split(":");
    const port = Number(portRaw) || 8737;
    void beginRequest(address, port, address);
  }
}
