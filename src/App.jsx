import React, { useEffect, useRef, useState } from "react";
import BootScreen from "./components/BootScreen.jsx";
import LockScreen from "./components/LockScreen.jsx";
import TopBar from "./components/TopBar.jsx";
import Seal from "./components/Seal.jsx";
import DeskIcon from "./components/DeskIcon.jsx";
import ContextMenu from "./components/ContextMenu.jsx";
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
import CommsApp from "./components/apps/CommsApp.jsx";
import PersonnelApp from "./components/apps/PersonnelApp.jsx";
import MissionsApp from "./components/apps/MissionsApp.jsx";
import ResearchApp from "./components/apps/ResearchApp.jsx";
import SecurityApp from "./components/apps/SecurityApp.jsx";
import SatelliteApp from "./components/apps/SatelliteApp.jsx";
import AssistantApp from "./components/apps/AssistantApp.jsx";
import CalculatorApp from "./components/apps/CalculatorApp.jsx";
import SnakeApp from "./components/apps/SnakeApp.jsx";
import ChatNetApp from "./components/apps/ChatNetApp.jsx";
import CameraNetApp from "./components/apps/CameraNetApp.jsx";
import FaultyTerminal from "./reactbits/FaultyTerminal.jsx";
import LetterGlitch from "./reactbits/LetterGlitch.jsx";
import LineSidebar from "./reactbits/LineSidebar.jsx";
import { playSound, setSoundsEnabled, setMasterVolume } from "./lib/sounds.js";
import { THEME_FX, BUNDLED_BACKDROPS, THEME_CHOICES } from "./lib/themes.js";
import { snapToGrid } from "./lib/deskGrid.js";

const APPS = [
  { id: "archive", label: "Archive", width: 680 },
  { id: "comms", label: "Comms", width: 700 },
  { id: "chat", label: "Chat", width: 660 },
  { id: "cameras", label: "Cameras", width: 840 },
  { id: "personnel", label: "Personnel", width: 760 },
  { id: "missions", label: "Missions", width: 760 },
  { id: "research", label: "Research", width: 780 },
  { id: "security", label: "Security", width: 780 },
  { id: "satellite", label: "Satellite", width: 820 },
  { id: "oracle", label: "Oracle AI", width: 640 },
  { id: "livefeed", label: "Live Feed", width: 600 },
  { id: "uplink", label: "Uplink", width: 560 },
  { id: "devices", label: "Devices", width: 560 },
  { id: "terminal", label: "Terminal", width: 640 },
  { id: "calc", label: "Calculator", width: 340 },
  { id: "snake", label: "Serpent", width: 500 },
  { id: "help", label: "Help", width: 580 },
  { id: "settings", label: "Settings", width: 620 }
];

const AMBIENT_EVENTS = [
  "SATELLITE LOCK MAINTAINED :: CERBERUS-2",
  "ARCHIVE INTEGRITY SWEEP COMPLETE :: 0 ERRORS",
  "PERIMETER SENSORS NOMINAL",
  "AIRWAVE SCAN :: NO NEW TRANSMISSIONS",
  "AUX POWER CELLS AT 98%",
  "THREAT INDEX RECALCULATED :: UNCHANGED",
  "VAULT ATMOSPHERE :: WITHIN TOLERANCE"
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
  const [notifHistory, setNotifHistory] = useState([]);
  const [unread, setUnread] = useState(0);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [deskMenu, setDeskMenu] = useState(null); // { x, y }
  const [iconMenu, setIconMenu] = useState(null); // { x, y, appId }
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
      setMasterVolume(cfg.soundVolume ?? 1);
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
      } else if (event.type === "chat") {
        if (event.message?.from?.id !== "host") {
          playSound("notify", 0.3);
          pushToast(`CHAT :: ${event.message?.from?.name}: ${String(event.message?.text || event.message?.media?.name || "").slice(0, 60)}`);
        }
      } else if (event.type === "cam") {
        if (event.device?.id !== "host") {
          pushToast(event.active ? `CAMERA ONLINE :: ${event.device?.name}` : `CAMERA OFFLINE :: ${event.device?.name}`);
        }
      } else if (event.type === "cam-declined") {
        pushToast(`CAMERA REQUEST DECLINED :: ${event.device?.name}`, true);
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
    setNotifHistory((prev) => [...prev.slice(-99), { id, text, warn, time: Date.now() }]);
    setUnread((prev) => prev + 1);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  }
  const pushToastRef = useRef(pushToast);
  pushToastRef.current = pushToast;

  // Ambient system heartbeat: rare flavor notifications (roadmap phase 17).
  useEffect(() => {
    if (config && config.ambientEventsEnabled === false) return undefined;
    let timer;
    function schedule() {
      timer = setTimeout(() => {
        pushToastRef.current(AMBIENT_EVENTS[Math.floor(Math.random() * AMBIENT_EVENTS.length)]);
        schedule();
      }, 240000 + Math.random() * 300000);
    }
    schedule();
    return () => clearTimeout(timer);
  }, [config?.ambientEventsEnabled]);

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
  const theme = config.theme || "green";
  const fx = THEME_FX[theme] || THEME_FX.green;
  const scanlines = config.scanlinesEnabled !== false;
  const reduceMotion = config.reduceMotion === true;
  const shellClass = `os-root ${scanlines ? "crt" : ""} ${reduceMotion ? "reduce-motion" : ""}`;
  const themeClass = theme === "green" ? "" : `theme-${theme}`;
  const bundledBackdrop = BUNDLED_BACKDROPS[backdrop];
  const iconPositions = config.iconPositions || {};

  async function moveIcon(appId, pos, deskHeight) {
    const others = Object.entries(config.iconPositions || {})
      .filter(([id]) => id !== appId)
      .map(([, p]) => p);
    const snapped = snapToGrid(pos, others, deskHeight);
    const next = await window.archiveApi.saveConfig({
      iconPositions: { ...(config.iconPositions || {}), [appId]: snapped }
    });
    setConfig(next);
  }

  async function renameIcon(appId) {
    const meta = APPS.find((a) => a.id === appId);
    const current = (config.iconNames || {})[appId] || meta?.label || "";
    const name = window.prompt("Icon name:", current);
    if (name === null) return;
    const clean = name.trim().slice(0, 24);
    const iconNames = { ...(config.iconNames || {}) };
    if (!clean || clean === meta?.label) delete iconNames[appId];
    else iconNames[appId] = clean;
    setConfig(await window.archiveApi.saveConfig({ iconNames }));
  }

  async function resetIconPos(appId) {
    const iconPositions = { ...(config.iconPositions || {}) };
    delete iconPositions[appId];
    setConfig(await window.archiveApi.saveConfig({ iconPositions }));
  }

  function iconLabel(app) {
    return (config.iconNames || {})[app.id] || app.label;
  }

  async function setTheme(value) {
    playSound("toggle", 0.4);
    setConfig(await window.archiveApi.saveConfig({ theme: value }));
  }

  async function createFromDesktop(type) {
    const src = sources[0];
    if (!src) return;
    const listing = await window.archiveApi.browse(src.id);
    const names = new Set((listing?.entries || []).map((en) => en.name.toLowerCase()));
    const base = type === "dir" ? "NEW FOLDER" : "NEW FILE";
    let name = type === "dir" ? base : `${base}.txt`;
    let n = 2;
    while (names.has(name.toLowerCase())) {
      name = type === "dir" ? `${base} (${n})` : `${base} (${n}).txt`;
      n += 1;
    }
    const res = type === "dir"
      ? await window.archiveApi.vaultMkdir(src.id, name)
      : await window.archiveApi.vaultNewFile(src.id, name);
    if (res?.ok === false) {
      playSound("error", 0.5);
      pushToast(`CREATE FAILED: ${res.error || "unknown"}`);
    } else {
      playSound("select", 0.4);
      pushToast(`CREATED ${name} IN ${(src.label || "SOURCE").toUpperCase()} :: SEE ARCHIVE`);
    }
  }

  function onDesktopContext(e) {
    if (e.target.closest(".window") || e.target.closest(".desk-icon") || e.target.closest(".taskbar") || e.target.closest(".ctx-menu")) return;
    e.preventDefault();
    setDeskMenu({ x: e.clientX, y: e.clientY });
  }

  const deskMenuItems = [
    { label: "NEW FOLDER", disabled: !sources.length, onClick: () => createFromDesktop("dir") },
    { label: "NEW FILE", disabled: !sources.length, onClick: () => createFromDesktop("file") },
    { divider: true },
    { label: "OPEN ARCHIVE", onClick: () => openApp("archive") },
    { label: "SETTINGS", onClick: () => openApp("settings") },
    { divider: true },
    ...THEME_CHOICES.map(([value, label]) => ({
      label: `STYLE :: ${label}${theme === value ? " (ON)" : ""}`,
      onClick: () => setTheme(value)
    }))
  ];

  if (booted && locked) {
    return (
      <div className={`${shellClass} ${themeClass}`}>
        <LockScreen onUnlocked={() => setLocked(false)} glitchColors={fx.glitch} />
      </div>
    );
  }

  return (
    <>
    <div className={`${shellClass} ${themeClass} ${shuttingDown ? "powering-off" : ""}`}>
      {!booted && (
        <BootScreen hostname={sysInfo.hostname} glitchColors={fx.glitch} onDone={() => setBooted(true)} />
      )}
      <TopBar title="PROJECT CERBERUS" stats={stats} onShutdown={shutdown} />
      <div className="desktop" onContextMenu={onDesktopContext}>
        {(backdrop === "map" || backdrop === "terminal") && !reduceMotion && (
          <div className="desktop-shader">
            <FaultyTerminal
              tint={fx.tint}
              brightness={backdrop === "terminal" ? 0.85 : 0.55}
              mouseReact={false}
              timeScale={backdrop === "terminal" ? 0.4 : 0.22}
            />
          </div>
        )}
        {backdrop === "glitch" && !reduceMotion && (
          <LetterGlitch className="desktop-shader" glitchColors={fx.glitch} glitchSpeed={75} opacity={0.35} outerVignette />
        )}
        {bundledBackdrop && (
          <div
            className="desktop-image bundled"
            style={{ backgroundImage: `url('${bundledBackdrop.image}')` }}
          />
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
          {APPS.filter((app) => !iconPositions[app.id]).map((app) => (
            <DeskIcon
              key={app.id}
              label={iconLabel(app)}
              pos={null}
              onOpen={() => openApp(app.id)}
              onMove={(pos, deskH) => moveIcon(app.id, pos, deskH)}
              onMenu={(at) => setIconMenu({ ...at, appId: app.id })}
            />
          ))}
        </div>
        {APPS.filter((app) => iconPositions[app.id]).map((app) => (
          <DeskIcon
            key={app.id}
            label={iconLabel(app)}
            pos={iconPositions[app.id]}
            onOpen={() => openApp(app.id)}
            onMove={(pos, deskH) => moveIcon(app.id, pos, deskH)}
            onMenu={(at) => setIconMenu({ ...at, appId: app.id })}
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
              {win.appId === "comms" && <CommsApp notify={pushToast} onOpenApp={openApp} />}
              {win.appId === "personnel" && <PersonnelApp notify={pushToast} />}
              {win.appId === "missions" && <MissionsApp notify={pushToast} />}
              {win.appId === "research" && <ResearchApp notify={pushToast} onOpenMedia={openMedia} />}
              {win.appId === "security" && (
                <SecurityApp lanState={lanState} sysInfo={sysInfo} config={config} notify={pushToast} />
              )}
              {win.appId === "satellite" && <SatelliteApp lanState={lanState} notify={pushToast} />}
              {win.appId === "oracle" && <AssistantApp lanState={lanState} sysInfo={sysInfo} />}
              {win.appId === "calc" && <CalculatorApp />}
              {win.appId === "snake" && <SnakeApp />}
              {win.appId === "chat" && (
                lanState?.running && lanState?.hostToken ? (
                  <ChatNetApp
                    base={`http://127.0.0.1:${lanState.port || 8737}`}
                    token={lanState.hostToken}
                    selfId="host"
                    onOpenMedia={openMedia}
                    notify={pushToast}
                  />
                ) : (
                  <p className="warn">THE UPLINK IS OFFLINE. START IT IN SETTINGS &gt; NETWORK.</p>
                )
              )}
              {win.appId === "cameras" && (
                lanState?.running && lanState?.hostToken ? (
                  <CameraNetApp
                    base={`http://127.0.0.1:${lanState.port || 8737}`}
                    token={lanState.hostToken}
                    selfId="host"
                    isHost
                    devices={lanState?.approved || []}
                    notify={pushToast}
                  />
                ) : (
                  <p className="warn">THE UPLINK IS OFFLINE. START IT IN SETTINGS &gt; NETWORK.</p>
                )
              )}
              {win.appId === "devices" && <DevicesApp lanState={lanState} />}
              {win.appId === "uplink" && <UplinkApp lanState={lanState} />}
              {win.appId === "terminal" && (
                <TerminalApp lanState={lanState} sysInfo={sysInfo} config={config} />
              )}
              {win.appId === "settings" && (
                <SettingsApp config={config} onConfigChange={setConfig} notify={pushToast} />
              )}
              {win.appId === "help" && <HelpApp sysInfo={sysInfo} />}
            </WindowFrame>
          );
        })}

        <TaskBar
          windows={windows}
          onToggle={(key) => toggleMinimize(key)}
          onClose={closeWindow}
          notifications={notifHistory}
          unread={unread}
          onBellOpen={() => setUnread(0)}
          onClearNotifications={() => { setNotifHistory([]); setUnread(0); }}
          onShutdown={shutdown}
        />

        {deskMenu && (
          <ContextMenu
            x={deskMenu.x}
            y={deskMenu.y}
            items={deskMenuItems}
            onClose={() => setDeskMenu(null)}
          />
        )}
        {iconMenu && (
          <ContextMenu
            x={iconMenu.x}
            y={iconMenu.y}
            items={[
              { label: "OPEN", onClick: () => openApp(iconMenu.appId) },
              { label: "RENAME", onClick: () => renameIcon(iconMenu.appId) },
              { label: "RESET POSITION", onClick: () => resetIconPos(iconMenu.appId) }
            ]}
            onClose={() => setIconMenu(null)}
          />
        )}
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
