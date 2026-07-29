import React, { useEffect, useRef, useState } from "react";
import BootScreen from "./components/BootScreen.jsx";
import LockScreen from "./components/LockScreen.jsx";
import TopBar from "./components/TopBar.jsx";
import Seal from "./components/Seal.jsx";
import FolderIcon from "./components/FolderIcon.jsx";
import WindowFrame from "./components/WindowFrame.jsx";
import TaskBar from "./components/TaskBar.jsx";
import MediaViewer from "./components/MediaViewer.jsx";
import ArchiveApp from "./components/apps/ArchiveApp.jsx";
import DevicesApp from "./components/apps/DevicesApp.jsx";
import UplinkApp from "./components/apps/UplinkApp.jsx";
import TerminalApp from "./components/apps/TerminalApp.jsx";
import SettingsApp from "./components/apps/SettingsApp.jsx";
import HelpApp from "./components/apps/HelpApp.jsx";
import LiveFeedApp from "./components/apps/LiveFeedApp.jsx";
import FaultyTerminal from "./reactbits/FaultyTerminal.jsx";
import LetterGlitch from "./reactbits/LetterGlitch.jsx";
import LineSidebar from "./reactbits/LineSidebar.jsx";
import { playSound, setSoundsEnabled } from "./lib/sounds.js";

const APPS = [
  { id: "archive", label: "Archive", width: 680 },
  { id: "livefeed", label: "Live Feed", width: 600 },
  { id: "uplink", label: "Uplink", width: 560 },
  { id: "devices", label: "Devices", width: 560 },
  { id: "terminal", label: "Terminal", width: 620 },
  { id: "help", label: "Help", width: 580 },
  { id: "settings", label: "Settings", width: 580 }
];

let toastId = 0;
let windowKey = 0;

export default function App() {
  const [config, setConfig] = useState(null);
  const [sysInfo, setSysInfo] = useState(null);
  const [lanState, setLanState] = useState(null);
  const [booted, setBooted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [windows, setWindows] = useState([]); // { key, type, appId, media, title, width, minimized }
  const [toasts, setToasts] = useState([]);
  const [shuttingDown, setShuttingDown] = useState(false);
  const windowsRef = useRef(windows);
  windowsRef.current = windows;

  useEffect(() => {
    (async () => {
      const [cfg, info, lan, security] = await Promise.all([
        window.archiveApi.getConfig(),
        window.archiveApi.getSysInfo(),
        window.archiveApi.getLanState(),
        window.archiveApi.getSecurityState()
      ]);
      setSoundsEnabled(cfg.uiSoundsEnabled !== false);
      setConfig(cfg);
      setSysInfo(info);
      setLanState(lan);
      setLocked(security.passwordSet && !security.unlocked);
      if (cfg.bootAnimationEnabled === false) setBooted(true);
    })();

    const offState = window.archiveApi.onLanState((state) => setLanState(state));
    const offEvent = window.archiveApi.onLanEvent((event) => {
      if (event.type === "access-request") {
        playSound("alert", 0.6);
        pushToast(`ACCESS REQUEST: ${event.device?.name || "unknown device"}`);
        if (!windowsRef.current.some((w) => w.appId === "devices")) {
          openAppRef.current("devices");
        }
      } else if (event.type === "download") {
        playSound("notify", 0.35);
        pushToast(`${event.device?.name} retrieved ${event.file}`);
      } else if (event.type === "server-error") {
        pushToast(`UPLINK ERROR: ${event.message}`, true);
      } else if (event.type === "update-found") {
        playSound("alert", 0.5);
        pushToast(`GRID TRANSMISSION: UPDATE ${event.version} DETECTED`);
      } else if (event.type === "update-downloading") {
        pushToast(`RETRIEVING UPDATE ${event.version} FROM THE GRID...`);
      } else if (event.type === "update-ready") {
        pushToast(`UPDATE ${event.version} RETRIEVED. RESTARTING NODE...`);
      } else if (event.type === "broadcast") {
        pushToast(event.active ? `LIVE FEED STARTED: ${event.name}` : "LIVE FEED ENDED");
      }
    });
    return () => {
      offState();
      offEvent();
    };
  }, []);

  function pushToast(text, warn = false) {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-3), { id, text, warn }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
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
  const openAppRef = useRef(openApp);
  openAppRef.current = openApp;

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

  function closeWindow(key) {
    setWindows((prev) => prev.filter((w) => w.key !== key));
  }

  function toggleMinimize(key, value) {
    setWindows((prev) =>
      prev.map((w) => (w.key === key ? { ...w, minimized: value ?? !w.minimized } : w))
    );
  }

  async function broadcast(rel, name) {
    const result = await window.archiveApi.startFeed(rel);
    if (result.ok) {
      openApp("livefeed");
    } else {
      pushToast(`FEED ERROR: ${result.error}`, true);
    }
  }

  function shutdown() {
    if (shuttingDown) return;
    setShuttingDown(true);
    playSound("close", 0.5);
    setTimeout(() => window.archiveApi.close(), 780);
  }

  if (!config || !sysInfo) {
    return <div className="os-root crt" />;
  }

  const sources = lanState?.archiveSources || config.archiveSources || [];
  const stats = [
    { label: lanState?.running ? "UPLINK:ON" : "UPLINK:OFF", on: Boolean(lanState?.running) },
    { label: sources.length ? `VAULT:${sources.length} SRC` : "VAULT:NONE", on: sources.length > 0 },
    ...(lanState?.broadcast?.active ? [{ label: "LIVE FEED", on: true }] : []),
    {
      label: `DEV:${lanState?.approved?.length || 0}${lanState?.pending?.length ? ` (+${lanState.pending.length}!)` : ""}`,
      on: (lanState?.approved?.length || 0) > 0 || (lanState?.pending?.length || 0) > 0
    }
  ];

  const backdrop = config.desktopBackground || "map";

  if (booted && locked) {
    return (
      <div className="os-root crt">
        <LockScreen onUnlocked={() => setLocked(false)} />
      </div>
    );
  }

  return (
    <>
    <div className={`os-root crt ${shuttingDown ? "powering-off" : ""}`}>
      {!booted && (
        <BootScreen hostname={sysInfo.hostname} onDone={() => setBooted(true)} />
      )}
      <TopBar title="DOOMSDAY ARCHIVE" stats={stats} onShutdown={shutdown} />
      <div className="desktop">
        {(backdrop === "map" || backdrop === "terminal") && (
          <div className="desktop-shader">
            <FaultyTerminal
              tint="#7dff3f"
              brightness={backdrop === "terminal" ? 0.85 : 0.55}
              mouseReact={false}
              timeScale={backdrop === "terminal" ? 0.4 : 0.22}
            />
          </div>
        )}
        {backdrop === "glitch" && (
          <LetterGlitch className="desktop-shader" glitchSpeed={75} opacity={0.35} outerVignette />
        )}
        {backdrop === "image" && config.backgroundImage && (
          <div
            className="desktop-image"
            style={{ backgroundImage: "url('dabg://bg/image')" }}
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
          {APPS.map((app) => (
            <button key={app.id} className="desk-icon" onClick={() => openApp(app.id)}>
              <FolderIcon />
              <span>{app.label}</span>
            </button>
          ))}
        </div>

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
              {win.appId === "archive" && (
                <ArchiveApp
                  sources={sources}
                  onOpenSettings={() => openApp("settings")}
                  onOpenMedia={openMedia}
                  onBroadcast={broadcast}
                  notify={pushToast}
                />
              )}
              {win.appId === "livefeed" && <LiveFeedApp lanState={lanState} />}
              {win.appId === "devices" && <DevicesApp lanState={lanState} />}
              {win.appId === "uplink" && <UplinkApp lanState={lanState} />}
              {win.appId === "terminal" && (
                <TerminalApp lanState={lanState} sysInfo={sysInfo} config={config} />
              )}
              {win.appId === "settings" && (
                <SettingsApp config={config} onConfigChange={setConfig} />
              )}
              {win.appId === "help" && <HelpApp sysInfo={sysInfo} />}
            </WindowFrame>
          );
        })}

        <TaskBar
          windows={windows}
          onToggle={(key) => toggleMinimize(key)}
          onClose={closeWindow}
        />
      </div>

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
}
