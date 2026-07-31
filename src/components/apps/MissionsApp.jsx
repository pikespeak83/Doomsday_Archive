import React, { useEffect, useState } from "react";
import { playSound } from "../../lib/sounds.js";
import TextPrompt from "../TextPrompt.jsx";

const STATUS_TABS = [
  ["active", "ACTIVE"],
  ["completed", "COMPLETED"],
  ["archived", "ARCHIVED"]
];

/** Mission board: active / completed / archived operations with objectives. */
export default function MissionsApp({ notify }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("active");
  const [selectedId, setSelectedId] = useState(null);
  const [objDraft, setObjDraft] = useState("");
  const [naming, setNaming] = useState(false);

  useEffect(() => {
    window.archiveApi.getData("missions").then(setData);
  }, []);

  async function save(records) {
    const next = { ...data, records };
    setData(next);
    await window.archiveApi.saveData("missions", next);
  }

  if (!data) return <div className="dim">LOADING MISSION BOARD...</div>;
  const records = data.records || [];
  const inTab = records.filter((m) => (m.status || "active") === tab);
  const selected = records.find((m) => m.id === selectedId) || null;

  async function patch(id, partial) {
    await save(records.map((m) => (m.id === id ? { ...m, ...partial, updatedAt: Date.now() } : m)));
  }

  async function newMission(codename) {
    const rec = {
      id: `m${Date.now()}`,
      codename: codename.trim().toUpperCase(),
      status: tab,
      location: "",
      description: "",
      personnel: "",
      objectives: [],
      attachments: [],
      updatedAt: Date.now()
    };
    await save([rec, ...records]);
    setSelectedId(rec.id);
    notify?.(`MISSION FILE OPENED: ${rec.codename}`);
  }

  async function destroy(rec) {
    if (!window.confirm(`Shred ${rec.codename}?`)) return;
    playSound("error", 0.5);
    await save(records.filter((m) => m.id !== rec.id));
    setSelectedId(null);
  }

  return (
    <div>
      <div className="app-tabs">
        {STATUS_TABS.map(([value, label]) => (
          <button key={value} className={`app-tab ${tab === value ? "on" : ""}`}
            onClick={() => { playSound("click", 0.3); setTab(value); setSelectedId(null); }}>
            {label} ({records.filter((m) => (m.status || "active") === value).length})
          </button>
        ))}
        <button className="btn small" style={{ marginLeft: "auto" }} onClick={() => { playSound("confirm", 0.5); setNaming(true); }}>NEW MISSION</button>
      </div>

      {naming && (
        <TextPrompt
          title="MISSION CODENAME"
          initial="OPERATION "
          onSubmit={(value) => void newMission(value)}
          onClose={() => setNaming(false)}
        />
      )}

      {!selected && (
        <table className="data-table">
          <tbody>
            {inTab.map((m) => (
              <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => { playSound("select", 0.35); setSelectedId(m.id); }}>
                <td className="bright">{m.codename}</td>
                <td className="dim">{m.location || "location unset"}</td>
                <td className="dim" style={{ textAlign: "right" }}>
                  {(m.objectives || []).filter((o) => o.done).length}/{(m.objectives || []).length} OBJ
                </td>
              </tr>
            ))}
            {!inTab.length && <tr><td className="dim">nothing on the board.</td></tr>}
          </tbody>
        </table>
      )}

      {selected && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn small ghost" onClick={() => setSelectedId(null)}>&lt; BOARD</button>
            <div className="bright" style={{ letterSpacing: 2 }}>{selected.codename}</div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {STATUS_TABS.filter(([v]) => v !== selected.status).map(([value, label]) => (
                <button key={value} className="btn small ghost"
                  onClick={() => { playSound("toggle", 0.4); patch(selected.id, { status: value }); setTab(value); }}>
                  &gt; {label}
                </button>
              ))}
              <button className="btn small danger" onClick={() => destroy(selected)}>SHRED</button>
            </div>
          </div>

          <div className="field-label">LOCATION</div>
          <input className="text-input" style={{ width: "100%" }} value={selected.location}
            placeholder="GRID REFERENCE / SITE"
            onChange={(e) => patch(selected.id, { location: e.target.value })} />

          <div className="field-label">DESCRIPTION</div>
          <textarea className="text-input" style={{ width: "100%", height: 80, resize: "vertical" }}
            value={selected.description}
            onChange={(e) => patch(selected.id, { description: e.target.value })} />

          <div className="field-label">ASSIGNED PERSONNEL</div>
          <input className="text-input" style={{ width: "100%" }} value={selected.personnel}
            placeholder="comma separated, see PERSONNEL app"
            onChange={(e) => patch(selected.id, { personnel: e.target.value })} />

          <div className="field-label">OBJECTIVES</div>
          {(selected.objectives || []).map((obj, i) => (
            <div key={i} className="obj-row">
              <button className={`obj-check ${obj.done ? "done" : ""}`}
                onClick={() => {
                  playSound(obj.done ? "toggle" : "confirm", 0.4);
                  const objectives = selected.objectives.map((o, j) => (j === i ? { ...o, done: !o.done } : o));
                  patch(selected.id, { objectives });
                }}>
                {obj.done ? "[X]" : "[ ]"}
              </button>
              <span className={obj.done ? "dim strike" : ""}>{obj.text}</span>
              <button className="task-x" style={{ marginLeft: "auto" }}
                onClick={() => patch(selected.id, { objectives: selected.objectives.filter((_, j) => j !== i) })}>
                x
              </button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input className="text-input" style={{ flex: 1 }} placeholder="ADD OBJECTIVE + ENTER"
              value={objDraft}
              onChange={(e) => setObjDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || !objDraft.trim()) return;
                playSound("select", 0.4);
                patch(selected.id, { objectives: [...(selected.objectives || []), { text: objDraft.trim(), done: false }] });
                setObjDraft("");
              }} />
          </div>

          <div className="field-label">ATTACHMENTS (ARCHIVE PATHS)</div>
          {(selected.attachments || []).map((att, i) => (
            <div key={i} className="obj-row">
              <span className="dim" style={{ wordBreak: "break-all" }}>{att}</span>
              <button className="btn small ghost" style={{ marginLeft: "auto" }}
                onClick={() => window.archiveApi.openFile(att)}>OPEN</button>
              <button className="task-x"
                onClick={() => patch(selected.id, { attachments: selected.attachments.filter((_, j) => j !== i) })}>
                x
              </button>
            </div>
          ))}
          <input className="text-input" style={{ width: "100%", marginTop: 6 }}
            placeholder="src0/path/to/file + ENTER"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const v = e.currentTarget.value.trim();
              if (!v) return;
              patch(selected.id, { attachments: [...(selected.attachments || []), v] });
              e.currentTarget.value = "";
              notify?.("ATTACHMENT FILED");
            }} />
        </div>
      )}
    </div>
  );
}
