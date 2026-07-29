import React, { useEffect, useState } from "react";
import { playSound } from "../lib/sounds.js";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/**
 * Bottom taskbar: window chips, heartbeat lights, notification bell,
 * clock, and power. The bell opens a notification history panel.
 */
export default function TaskBar({ windows, onToggle, onClose, notifications = [], unread = 0, onBellOpen, onClearNotifications, onShutdown }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const now = useClock();

  function togglePanel() {
    playSound("click", 0.35);
    const next = !panelOpen;
    setPanelOpen(next);
    if (next) onBellOpen?.();
  }

  return (
    <>
      {panelOpen && (
        <div className="notif-panel">
          <div className="notif-head">
            <span>NOTIFICATION CENTER</span>
            <button className="btn small ghost" onClick={() => { onClearNotifications?.(); setPanelOpen(false); }}>CLEAR</button>
          </div>
          <div className="notif-list">
            {notifications.length === 0 && <div className="dim" style={{ padding: 10 }}>all quiet.</div>}
            {[...notifications].reverse().map((n) => (
              <div key={n.id} className={`notif-item ${n.warn ? "warn" : ""}`}>
                <span className="notif-time">{new Date(n.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span>{n.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="taskbar">
        <span className="heartbeat">
          <i /><i /><i />
        </span>
        <div className="task-chips">
          {windows.map((win) => (
            <div key={win.key} className={`task-chip ${win.minimized ? "min" : ""}`}>
              <button
                className="task-label"
                title={win.title}
                onClick={() => {
                  playSound("toggle", 0.3);
                  onToggle(win.key);
                }}
              >
                {win.title}
              </button>
              <button className="task-x" title="Close" onClick={() => onClose(win.key)}>x</button>
            </div>
          ))}
        </div>
        <div className="task-right">
          <button className={`task-bell ${unread ? "hot" : ""}`} title="Notifications" onClick={togglePanel}>
            [!]{unread ? <span className="bell-count">{unread}</span> : null}
          </button>
          <span className="task-clock">{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          <button className="task-power" title="Power off" onClick={() => onShutdown?.()}>(o)</button>
        </div>
      </div>
    </>
  );
}
