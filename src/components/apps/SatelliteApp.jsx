import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../lib/sounds.js";

const SATS = [
  { id: "c1", name: "CERBERUS-1", period: 34, radiusX: 42, radiusY: 16, tilt: -14, phase: 0, health: "OPERATIONAL" },
  { id: "c2", name: "CERBERUS-2", period: 52, radiusX: 46, radiusY: 22, tilt: 18, phase: 2.1, health: "OPERATIONAL" },
  { id: "c3", name: "CERBERUS-3", period: 71, radiusX: 38, radiusY: 26, tilt: 42, phase: 4.2, health: "DEGRADED" },
  { id: "kh", name: "KH-DERELICT", period: 97, radiusX: 48, radiusY: 12, tilt: 65, phase: 1.3, health: "NO CONTACT" }
];

/** Satellite control: animated orbits, tracking, signal strength, uplink lines. */
export default function SatelliteApp({ lanState, notify }) {
  const [selected, setSelected] = useState(SATS[0].id);
  const [zoom, setZoom] = useState(1);
  const [locked, setLocked] = useState({});
  const [tick, setTick] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(performance.now());

  useEffect(() => {
    const loop = () => {
      setTick((performance.now() - startRef.current) / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const sat = SATS.find((s) => s.id === selected) || SATS[0];
  const groundStations = (lanState?.approved || []).slice(0, 4);

  function positionOf(s, t) {
    const a = (t / s.period) * Math.PI * 2 + s.phase;
    const x = Math.cos(a) * s.radiusX;
    const y = Math.sin(a) * s.radiusY;
    const rad = (s.tilt * Math.PI) / 180;
    return {
      x: 50 + x * Math.cos(rad) - y * Math.sin(rad),
      y: 50 + x * Math.sin(rad) * 0.6 + y * Math.cos(rad)
    };
  }

  const signal = sat.health === "NO CONTACT"
    ? 0
    : Math.max(0.08, Math.abs(Math.sin(tick / 3 + sat.phase))) * (sat.health === "DEGRADED" ? 0.55 : 1);
  const bars = Math.round(signal * 5);

  function toggleLock() {
    if (sat.health === "NO CONTACT") {
      playSound("error", 0.5);
      notify?.(`${sat.name}: NO CARRIER. LOCK IMPOSSIBLE.`, true);
      return;
    }
    const next = !locked[sat.id];
    playSound(next ? "confirm" : "toggle", 0.5);
    setLocked({ ...locked, [sat.id]: next });
    notify?.(next ? `SATELLITE LOCK ACQUIRED :: ${sat.name}` : `TRACKING RELEASED :: ${sat.name}`);
  }

  return (
    <div className="sat-root">
      <div className="sat-map-wrap">
        <div className="sat-map" style={{ transform: `scale(${zoom})` }}>
          <div className="world-map sat-bg" />
          <svg className="sat-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {SATS.map((s) => (
              <ellipse key={`orbit-${s.id}`}
                cx="50" cy="50" rx={s.radiusX} ry={s.radiusY * 0.9}
                transform={`rotate(${s.tilt} 50 50)`}
                className={`sat-orbit ${s.id === selected ? "on" : ""}`} />
            ))}
            {SATS.map((s) => {
              const p = positionOf(s, tick);
              return (
                <g key={s.id} className="sat-node" onClick={() => { playSound("select", 0.4); setSelected(s.id); }}>
                  {locked[s.id] && (
                    <line x1="50" y1="96" x2={p.x} y2={p.y} className="sat-link" />
                  )}
                  <circle cx={p.x} cy={p.y} r={s.id === selected ? 1.8 : 1.2}
                    className={`sat-dot ${s.health === "NO CONTACT" ? "dead" : ""} ${s.id === selected ? "on" : ""}`} />
                  <text x={p.x + 2.4} y={p.y + 0.8} className="sat-label">{s.name}</text>
                </g>
              );
            })}
            <circle cx="50" cy="96" r="1.6" className="sat-home" />
            <text x="52.5" y="97" className="sat-label home">VAULT PRIME</text>
          </svg>
        </div>
        <div className="sat-zoom">
          <button className="btn small ghost" onClick={() => setZoom(Math.min(2.2, +(zoom + 0.3).toFixed(1)))}>+</button>
          <button className="btn small ghost" onClick={() => setZoom(Math.max(1, +(zoom - 0.3).toFixed(1)))}>-</button>
        </div>
      </div>

      <div className="sat-side">
        <div className="field-label" style={{ marginTop: 0 }}>TRACKING :: {sat.name}</div>
        <div className="obj-row"><span>STATUS</span><span className={`bright ${sat.health === "NO CONTACT" ? "warn" : ""}`} style={{ marginLeft: "auto" }}>{sat.health}</span></div>
        <div className="obj-row"><span>ORBIT PERIOD</span><span className="dim" style={{ marginLeft: "auto" }}>{sat.period} MIN (SIM)</span></div>
        <div className="obj-row">
          <span>SIGNAL</span>
          <span className="sig-bars big" style={{ marginLeft: "auto" }}>
            {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= bars ? "on" : ""} />)}
          </span>
        </div>
        <button className={`btn ${locked[sat.id] ? "" : "ghost"}`} style={{ width: "100%", marginTop: 8 }} onClick={toggleLock}>
          {locked[sat.id] ? "LOCKED :: RELEASE" : "ACQUIRE LOCK"}
        </button>

        <div className="field-label">GROUND STATIONS (LAN)</div>
        {groundStations.map((d) => (
          <div key={d.id} className="obj-row">
            <span className="status-led ok" />
            <span>{d.name}</span>
          </div>
        ))}
        {!groundStations.length && <p className="dim" style={{ fontSize: 12 }}>no field terminals cleared yet.</p>}

        <p className="dim" style={{ fontSize: 11, marginTop: 10 }}>
          Orbital picture is simulated. When the sky comes back, so will the birds.
        </p>
      </div>
    </div>
  );
}
