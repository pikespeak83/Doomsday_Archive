import React, { useEffect, useRef, useState } from "react";
import BootScreen from "./components/BootScreen.jsx";
import TopBar from "./components/TopBar.jsx";
import Seal from "./components/Seal.jsx";
import FolderIcon from "./components/FolderIcon.jsx";
import WindowFrame from "./components/WindowFrame.jsx";
import ArchiveApp from "./components/apps/ArchiveApp.jsx";
import DevicesApp from "./components/apps/DevicesApp.jsx";
import UplinkApp from "./components/apps/UplinkApp.jsx";
import TerminalApp from "./components/apps/TerminalApp.jsx";
import SettingsApp from "./components/apps/SettingsApp.jsx";
import HelpApp from "./components/apps/HelpApp.jsx";
import FaultyTerminal from "./reactbits/FaultyTerminal.jsx";
import LineSidebar from "./reactbits/LineSidebar.jsx";
import { playSound, setSoundsEnabled } from "./lib/sounds.js";

const APPS = [
  { id: "archive", label: "Archive", width: 640 },
  { id: "uplink", label: "Uplink", width: 560 },
  { id: "devices", label: "Devices", width: 560 },
  { id: "terminal", label: "Terminal", width: 620 },
  { id: "help", label: "Help", width: 580 },
  { id: "settings", label: "Settings", width: 560 }
];

let toastId = 0;

export default function App() {
  const [config, setConfig] = useState(null);
  const [sysInfo, setSysInfo] = useState(null);
  const [lanState, setLanState] = useState(null);
  const [booted, setBooted] = useState(false);
  const [openApps, setOpenApps] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [shuttingDown, setShuttingDown] = useState(false);
  const openAppsRef = useRef(openApps);
  openAppsRef.current = openApps;

  useEffect(() => {
    (async () => {
      const [cfg, info, lan] = await Promise.all([
        window.archiveApi.getConfig(),
        window.archiveApi.getSysInfo(),
        window.archiveApi.getLanState()
      ]);
      setSoundsEnabled(cfg.uiSoundsEnabled !== false);
      setConfig(cfg);
      setSysInfo(info);
      setLanState(lan);
      if (cfg.bootAnimationEnabled === false) setBooted(true);
    })();

    const offState = window.archiveApi.onLanState((state) => setLanState(state));
    const offEvent = window.archiveApi.onLanEvent((event) => {
      if (event.type === "access-request") {
        playSound("alert", 0.6);
        pushToast(`ACCESS REQUEST: ${event.device?.name || "unknown device"}`);
        if (!openAppsRef.current.includes("devices")) {
          setOpenApps((prev) => [...prev, "devices"]);
        }
      } else if (event.type === "download") {
        playSound("notify", 0.35);
        pushToast(`${event.device?.name} retrieved ${event.file}`);
      } else if (event.type === "server-error") {
        pushToast(`UPLINK ERROR: ${event.message}`, true);
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

  function openApp(id) {
    playSound("click", 0.4);
    setOpenApps((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function closeApp(id) {
    setOpenApps((prev) => prev.filter((a) => a !== id));
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
    {
      label: `DEV:${lanState?.approved?.length || 0}${lanState?.pending?.length ? ` (+${lanState.pending.length}!)` : ""}`,
      on: (lanState?.approved?.length || 0) > 0 || (lanState?.pending?.length || 0) > 0
    }
  ];

  return (
    <>
    <div className={`os-root crt ${shuttingDown ? "powering-off" : ""}`}>
      {!booted && (
        <BootScreen hostname={sysInfo.hostname} onDone={() => setBooted(true)} />
      )}
      <TopBar title="DOOMSDAY ARCHIVE" stats={stats} onShutdown={shutdown} />
      <div className="desktop">
        <div className="desktop-shader">
          <FaultyTerminal tint="#7dff3f" brightness={0.55} mouseReact={false} timeScale={0.22} />
        </div>
        <div className="map-grid" />
        <div className="world-map" />
        <Seal className="desktop-seal" />

        <LineSidebar
          title="DCI"
          items={APPS.map((app) => ({
            id: app.id,
            label: app.label,
            active: openApps.includes(app.id)
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
                <ArchiveApp sources={sources} onOpenSettings={() => openApp("settings")} />
              )}
              {id === "devices" && <DevicesApp lanState={lanState} />}
              {id === "uplink" && <UplinkApp lanState={lanState} />}
              {id === "terminal" && (
                <TerminalApp lanState={lanState} sysInfo={sysInfo} config={config} />
              )}
              {id === "settings" && (
                <SettingsApp config={config} onConfigChange={setConfig} />
              )}
              {id === "help" && <HelpApp sysInfo={sysInfo} />}
            </WindowFrame>
          );
        })}
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
