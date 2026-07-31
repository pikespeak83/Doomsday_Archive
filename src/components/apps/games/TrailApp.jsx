import React, { useRef, useState } from "react";
import { playSound } from "../../../lib/sounds.js";

const GOAL_KM = 2000;

const EVENTS = [
  { text: "RAIDERS AMBUSH THE CONVOY.", ammo: -12, health: -10 },
  { text: "ABANDONED PHARMACY LOOTED CLEAN... ALMOST.", meds: +2 },
  { text: "RADSTORM. THE PARTY SHELTERS IN A CULVERT.", days: +1, health: -6 },
  { text: "A TRADER SWAPS FUEL FOR STORIES.", fuel: +14 },
  { text: "WILD DOGS RAID THE FOOD CRATES.", food: -18 },
  { text: "CLEAR SKIES. GOOD TIME ON THE OLD HIGHWAY.", km: +40 },
  { text: "TIRE SHREDS ON REBAR. REPAIRS COST A DAY.", days: +1, fuel: -6 },
  { text: "FRIENDLY VAULT SHARES PURIFIED WATER.", health: +10 },
  { text: "SHORTCUT THROUGH THE DRY LAKEBED PAYS OFF.", km: +60, fuel: -4 },
  { text: "FOOD CACHE UNDER A COLLAPSED OVERPASS.", food: +20 }
];

function roll(mod = {}) {
  const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  return { ...ev, ...mod };
}

export default function TrailApp() {
  const [s, setS] = useState(null);
  const [log, setLog] = useState(["WASTELAND TRAIL :: FOUR SOULS, ONE TRUCK, 2000 KM TO SANCTUARY.", "PRESS DEPART TO BEGIN."]);
  const logRef = useRef(null);

  function push(lines) {
    setLog((prev) => [...prev.slice(-80), ...lines]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 30);
  }

  function start() {
    playSound("confirm", 0.5);
    setS({ km: 0, day: 1, food: 60, fuel: 50, ammo: 30, meds: 3, health: 100, party: 4, over: false });
    setLog(["DAY 1 :: THE CONVOY ROLLS OUT OF THE SHELTER GATES."]);
  }

  function apply(state, ev, extraKm) {
    const next = { ...state };
    next.day += 1 + (ev.days || 0);
    next.km = Math.min(GOAL_KM, next.km + (extraKm || 0) + (ev.km || 0));
    next.food = Math.max(0, next.food + (ev.food || 0) - 4 * next.party);
    next.fuel = Math.max(0, next.fuel + (ev.fuel || 0));
    next.ammo = Math.max(0, next.ammo + (ev.ammo || 0));
    next.meds = Math.max(0, next.meds + (ev.meds || 0));
    next.health = Math.min(100, next.health + (ev.health || 0));
    const lines = [`DAY ${next.day} :: ${ev.text}`];
    if (next.food === 0) { next.health -= 15; lines.push("NO FOOD. THE PARTY WEAKENS."); }
    if (next.health <= 0 && next.party > 1) {
      next.party -= 1;
      next.health = 55;
      lines.push(`A PARTY MEMBER DIDN'T MAKE IT. ${next.party} REMAIN.`);
      playSound("error", 0.5);
    } else if (next.health <= 0) {
      next.over = "dead";
      lines.push("THE LAST SURVIVOR FALLS. THE TRAIL WINS.");
      playSound("error", 0.6);
    }
    if (next.km >= GOAL_KM && !next.over) {
      next.over = "won";
      lines.push(`SANCTUARY LIGHTS ON THE HORIZON. ${next.party} SURVIVOR${next.party > 1 ? "S" : ""} MADE IT IN ${next.day} DAYS.`);
      playSound("confirm", 0.7);
    }
    push(lines);
    return next;
  }

  function depart() {
    if (!s || s.over) return;
    if (s.fuel <= 0) { push(["TANKS DRY. SCAVENGE FOR FUEL FIRST."]); playSound("error", 0.4); return; }
    playSound("toggle", 0.3);
    setS((st) => apply({ ...st, fuel: st.fuel - 8 }, roll(), 80 + Math.floor(Math.random() * 60)));
  }

  function hunt() {
    if (!s || s.over) return;
    if (s.ammo < 5) { push(["NOT ENOUGH AMMO TO HUNT."]); playSound("error", 0.4); return; }
    playSound("toggle", 0.3);
    const gain = 15 + Math.floor(Math.random() * 25);
    setS((st) => apply({ ...st, ammo: st.ammo - 5, food: st.food + gain }, { text: `HUNTING PARTY RETURNS WITH ${gain} FOOD.` }, 0));
  }

  function rest() {
    if (!s || s.over) return;
    playSound("toggle", 0.3);
    setS((st) => apply({ ...st, health: Math.min(100, st.health + 18) }, { text: "THE PARTY RESTS. WOUNDS CLOSE." }, 0));
  }

  function scavenge() {
    if (!s || s.over) return;
    playSound("toggle", 0.3);
    const fuel = 6 + Math.floor(Math.random() * 12);
    const ammo = Math.floor(Math.random() * 10);
    setS((st) => apply({ ...st, fuel: st.fuel + fuel, ammo: st.ammo + ammo }, { text: `SCAVENGED ${fuel} FUEL AND ${ammo} AMMO FROM THE RUINS.` }, 0));
  }

  function medkit() {
    if (!s || s.over) return;
    if (s.meds < 1) { push(["NO MEDKITS LEFT."]); playSound("error", 0.4); return; }
    playSound("confirm", 0.4);
    setS((st) => apply({ ...st, meds: st.meds - 1, health: Math.min(100, st.health + 35) }, { text: "MEDKIT USED. THE PARTY STEADIES." }, 0));
  }

  return (
    <div className="trail-wrap">
      {s && (
        <div className="snake-hud trail-hud">
          <span>KM {s.km}/{GOAL_KM}</span>
          <span>DAY {s.day}</span>
          <span>PARTY {s.party}</span>
          <span>HP {Math.max(0, s.health)}</span>
          <span>FOOD {s.food}</span>
          <span>FUEL {s.fuel}</span>
          <span>AMMO {s.ammo}</span>
          <span>MEDS {s.meds}</span>
        </div>
      )}
      <div className="trail-log" ref={logRef}>
        {log.map((line, i) => <div key={i}>{line}</div>)}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {!s || s.over ? (
          <button className="btn" onClick={start}>{s?.over ? "NEW EXPEDITION" : "DEPART"}</button>
        ) : (
          <>
            <button className="btn small" onClick={depart}>TRAVEL</button>
            <button className="btn small" onClick={hunt}>HUNT (5 AMMO)</button>
            <button className="btn small" onClick={scavenge}>SCAVENGE</button>
            <button className="btn small" onClick={rest}>REST</button>
            <button className="btn small" onClick={medkit}>MEDKIT ({s.meds})</button>
          </>
        )}
      </div>
    </div>
  );
}
