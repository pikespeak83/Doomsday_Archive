import React, { useEffect, useState } from "react";
import { playSound } from "../../lib/sounds.js";

const CLEARANCES = ["LEVEL 1 :: PROVISIONAL", "LEVEL 2", "LEVEL 3", "LEVEL 4", "LEVEL 5 :: OMEGA"];
const STATUSES = ["ACTIVE", "MIA", "KIA", "RETIRED", "UNKNOWN"];

const BLANK = {
  name: "", clearance: CLEARANCES[0], status: "ACTIVE", photo: "",
  assignments: "", associates: "", skills: "", history: ""
};

/** Searchable dossier cards: agents, clearance, photos, history. */
export default function PersonnelApp({ notify }) {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // record draft or null

  useEffect(() => {
    window.archiveApi.getData("personnel").then(setData);
  }, []);

  async function save(records) {
    const next = { ...data, records };
    setData(next);
    await window.archiveApi.saveData("personnel", next);
  }

  if (!data) return <div className="dim">DECRYPTING DOSSIERS...</div>;
  const records = data.records || [];

  const q = query.trim().toLowerCase();
  const visible = q
    ? records.filter((r) =>
        [r.name, r.clearance, r.status, r.assignments, r.associates, r.skills, r.history]
          .join(" ").toLowerCase().includes(q))
    : records;

  async function commit() {
    if (!editing.name.trim()) return notify?.("DOSSIER NEEDS A NAME", true);
    playSound("confirm", 0.5);
    const rec = { ...editing, name: editing.name.trim().toUpperCase(), updatedAt: Date.now() };
    if (rec.id) {
      await save(records.map((r) => (r.id === rec.id ? rec : r)));
    } else {
      rec.id = `p${Date.now()}`;
      await save([rec, ...records]);
    }
    setEditing(null);
  }

  async function destroy(rec) {
    if (!window.confirm(`Burn dossier for ${rec.name}?`)) return;
    playSound("error", 0.5);
    await save(records.filter((r) => r.id !== rec.id));
    setEditing(null);
  }

  async function pickPhoto() {
    const res = await window.archiveApi.pickDossierPhoto();
    if (res?.error) return notify?.(`PHOTO ERROR: ${res.error}`, true);
    if (res?.dataUrl) setEditing({ ...editing, photo: res.dataUrl });
  }

  if (editing) {
    return (
      <div>
        <div className="field-label" style={{ marginTop: 0 }}>
          {editing.id ? `DOSSIER :: ${editing.name || "?"}` : "NEW DOSSIER"}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 120 }}>
            <div className="dossier-photo big">
              {editing.photo ? <img src={editing.photo} alt="" /> : <span>NO PHOTO</span>}
            </div>
            <button className="btn small" style={{ width: "100%", marginTop: 6 }} onClick={pickPhoto}>PHOTO...</button>
            {editing.photo && (
              <button className="btn small ghost" style={{ width: "100%", marginTop: 4 }}
                onClick={() => setEditing({ ...editing, photo: "" })}>CLEAR</button>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <input className="text-input" style={{ width: "100%", marginBottom: 6 }} placeholder="AGENT NAME"
              value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <select className="text-input" style={{ flex: 1 }} value={editing.clearance}
                onChange={(e) => setEditing({ ...editing, clearance: e.target.value })}>
                {CLEARANCES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="text-input" style={{ width: 130 }} value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {[
              ["assignments", "ASSIGNMENTS"],
              ["associates", "KNOWN ASSOCIATES"],
              ["skills", "SKILL SETS"]
            ].map(([key, label]) => (
              <input key={key} className="text-input" style={{ width: "100%", marginBottom: 6 }} placeholder={label}
                value={editing[key]} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })} />
            ))}
            <textarea className="text-input" style={{ width: "100%", height: 90, resize: "vertical" }}
              placeholder="MISSION HISTORY / NOTES"
              value={editing.history} onChange={(e) => setEditing({ ...editing, history: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="btn" onClick={commit}>FILE DOSSIER</button>
          <button className="btn ghost" onClick={() => setEditing(null)}>CANCEL</button>
          {editing.id && <button className="btn danger" style={{ marginLeft: "auto" }} onClick={() => destroy(editing)}>BURN</button>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input className="text-input" style={{ flex: 1 }} placeholder="SEARCH NAME, SKILL, STATUS..."
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn small" onClick={() => { playSound("click", 0.4); setEditing({ ...BLANK }); }}>
          NEW DOSSIER
        </button>
      </div>
      <div className="card-grid">
        {visible.map((rec) => (
          <button key={rec.id} className="pcard" onClick={() => { playSound("select", 0.35); setEditing({ ...BLANK, ...rec }); }}>
            <div className="dossier-photo">
              {rec.photo ? <img src={rec.photo} alt="" /> : <span>NO PHOTO</span>}
            </div>
            <div className="pcard-body">
              <div className="bright">{rec.name}</div>
              <div className="dim" style={{ fontSize: 11 }}>{rec.clearance}</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>
                <span className={`badge ${rec.status === "ACTIVE" ? "live" : ""}`}>{rec.status}</span>
              </div>
              {rec.skills && <div className="dim pcard-skills">{rec.skills}</div>}
            </div>
          </button>
        ))}
        {!visible.length && <p className="dim">no dossiers match.</p>}
      </div>
    </div>
  );
}
