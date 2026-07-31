import React, { useEffect, useRef, useState } from "react";
import LetterGlitch from "../../reactbits/LetterGlitch.jsx";
import { playSound } from "../../lib/sounds.js";
import { THEME_FX } from "../../lib/themes.js";

const ALARM_LEVELS = [
  ["green", "CONDITION GREEN"],
  ["amber", "CONDITION AMBER"],
  ["red", "CONDITION RED"]
];

/** Security console: doors, cameras, alarm state, power, network, intrusion log. */
export default function SecurityApp({ lanState, sysInfo, config, notify }) {
  const [data, setData] = useState(null);
  const dataRef = useRef(null);
  dataRef.current = data;

  useEffect(() => {
    window.archiveApi.getData("security").then(setData);
    const off = window.archiveApi.onLanEvent((event) => {
      if (event.type === "access-request") {
        appendLog(`UPLINK CONTACT :: ACCESS REQUEST FROM ${event.device?.name || "UNKNOWN"}`, "warn");
      } else if (event.type === "device-approved") {
        appendLog(`DEVICE CLEARED :: ${event.device?.name || "UNKNOWN"}`, "info");
      } else if (event.type === "device-revoked") {
        appendLog(`CLEARANCE REVOKED :: ${event.device?.name || "UNKNOWN"}`, "warn");
      } else if (event.type === "download") {
        appendLog(`VAULT PULL :: ${event.device?.name || "?"} TOOK ${event.file}`, "info");
      }
    });
    return off;
  }, []);

  function appendLog(text, level = "info") {
    const cur = dataRef.current;
    if (!cur) return;
    const log = [{ time: Date.now(), text, level }, ...(cur.log || [])].slice(0, 60);
    const next = { ...cur, log };
    setData(next);
    void window.archiveApi.saveData("security", next);
  }

  async function save(next) {
    setData(next);
    await window.archiveApi.saveData("security", next);
  }

  if (!data) return <div className="dim">ARMING CONSOLE...</div>;

  const doors = data.doors || [];
  const alarm = data.alarm || "green";
  const fx = THEME_FX[config?.theme || "green"] || THEME_FX.green;
  const sealedCount = doors.filter((d) => d.sealed).length;
  const devices = lanState?.approved?.length || 0;
  const pending = lanState?.pending?.length || 0;

  async function toggleDoor(door) {
    playSound(door.sealed ? "toggle" : "confirm", 0.5);
    const next = {
      ...data,
      doors: doors.map((d) => (d.id === door.id ? { ...d, sealed: !d.sealed } : d))
    };
    await save(next);
    appendLog(`${door.name} ${door.sealed ? "UNSEALED" : "SEALED"}`, door.sealed ? "warn" : "info");
  }

  async function setAlarm(level) {
    if (level === alarm) return;
    playSound(level === "red" ? "klaxon" : "toggle", 0.6);
    await save({ ...data, alarm: level });
    appendLog(`ALARM STATE :: ${level.toUpperCase()}`, level === "green" ? "info" : "warn");
    notify?.(`SECURITY CONDITION ${level.toUpperCase()}`, level === "red");
    // red alert reaches every connected terminal; anything else stands down
    void window.archiveApi.setAlert(level === "red" ? "red" : "none");
  }

  function runSimulation(kind) {
    playSound("alert", 0.4);
    const scripts = {
      doors: [
        "DOOR DIAGNOSTIC :: CYCLING SEAL ACTUATORS",
        "HYDRAULIC PRESSURE NOMINAL ON ALL SEALS",
        "DOOR DIAGNOSTIC COMPLETE :: 0 FAULTS"
      ],
      cams: [
        "CAMERA SWEEP :: POLLING ALL FEEDS",
        "CAM 03 RETURNED STATIC :: REALIGNING ANTENNA",
        "CAMERA SWEEP COMPLETE :: 2 LIVE / 2 DARK"
      ],
      power: [
        "POWER FLUX TEST :: LOAD SHIFTED TO AUX CELLS",
        "VOLTAGE DIP 4% :: WITHIN TOLERANCE",
        "POWER TEST COMPLETE :: CELLS AT 98%"
      ],
      network: [
        "NETWORK PROBE :: PINGING ALL SHELTER NODES",
        "PACKET LOSS 0.0% :: LATENCY 2MS",
        "NETWORK PROBE COMPLETE :: LAN SECURE"
      ]
    };
    (scripts[kind] || []).forEach((line, i) => {
      setTimeout(() => appendLog(line, i === 1 ? "warn" : "info"), i * 1400);
    });
  }

  return (
    <div className={`sec-root alarm-${alarm}`}>
      <div className="sec-grid">
        <div className="sec-panel" onClick={() => runSimulation("doors")} title="Run door diagnostic">
          <div className="field-label" style={{ marginTop: 0 }}>DOOR STATUS ({sealedCount}/{doors.length} SEALED)</div>
          {doors.map((door) => (
            <div key={door.id} className="obj-row">
              <span className={`status-led ${door.sealed ? "ok" : "bad"}`} />
              <span>{door.name}</span>
              <button className={`btn small ${door.sealed ? "ghost" : "danger"}`} style={{ marginLeft: "auto" }}
                onClick={(e) => { e.stopPropagation(); toggleDoor(door); }}>
                {door.sealed ? "SEALED" : "OPEN!"}
              </button>
            </div>
          ))}
        </div>

        <div className="sec-panel" onClick={() => runSimulation("cams")} title="Run camera sweep">
          <div className="field-label" style={{ marginTop: 0 }}>CAMERA GRID</div>
          <div className="cam-grid">
            {["CAM 01 :: BLAST DOOR", "CAM 02 :: PANTRY", "CAM 03 :: PERIMETER N", "CAM 04 :: PERIMETER S"].map((label, i) => (
              <div key={label} className="cam-tile">
                {i < 2 ? (
                  <LetterGlitch className="cam-feed" glitchColors={fx.glitch} glitchSpeed={40 + i * 25} opacity={0.5} />
                ) : (
                  <div className="cam-dead">NO SIGNAL</div>
                )}
                <div className="cam-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="sec-panel">
          <div className="field-label" style={{ marginTop: 0 }}>ALARM STATE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ALARM_LEVELS.map(([value, label]) => (
              <button key={value}
                className={`btn small ${alarm === value ? (value === "red" ? "danger" : "") : "ghost"}`}
                onClick={() => setAlarm(value)}>
                {label}{alarm === value ? " :: LIVE" : ""}
              </button>
            ))}
          </div>
          <div className="field-label" onClick={() => runSimulation("power")} style={{ cursor: "pointer" }}>POWER</div>
          <div className="obj-row"><span className="status-led bad" /><span>GRID FEED</span><span className="dim" style={{ marginLeft: "auto" }}>SEVERED</span></div>
          <div className="obj-row"><span className="status-led ok" /><span>AUX CELLS</span><span className="bright" style={{ marginLeft: "auto" }}>NOMINAL</span></div>
          <div className="field-label" onClick={() => runSimulation("network")} style={{ cursor: "pointer" }}>NETWORK</div>
          <div className="obj-row">
            <span className={`status-led ${lanState?.running ? "ok" : "bad"}`} />
            <span>SHELTER LAN</span>
            <span className="dim" style={{ marginLeft: "auto" }}>
              {lanState?.running ? `UP :: ${devices} NODES${pending ? ` (+${pending} WAITING)` : ""}` : "DOWN"}
            </span>
          </div>
          <div className="obj-row"><span className="status-led bad" /><span>INTERNET</span><span className="dim" style={{ marginLeft: "auto" }}>SEVERED (BY DESIGN)</span></div>
        </div>

        <div className="sec-panel wide">
          <div className="field-label" style={{ marginTop: 0 }}>INTRUSION / EVENT LOG</div>
          <div className="sec-log">
            {(data.log || []).map((entry, i) => (
              <div key={i} className={entry.level === "warn" ? "warn" : "dim"}>
                [{entry.time ? new Date(entry.time).toLocaleTimeString() : "--:--"}] {entry.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
