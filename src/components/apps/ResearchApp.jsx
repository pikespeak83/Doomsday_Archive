import React, { useEffect, useState } from "react";
import { playSound } from "../../lib/sounds.js";

const CATEGORIES = [
  ["biological", "BIOLOGICAL"],
  ["weapons", "WEAPONS"],
  ["technology", "TECHNOLOGY"],
  ["artifacts", "RECOVERED ARTIFACTS"],
  ["experiments", "EXPERIMENTS"]
];
const CLASSIFICATIONS = ["OPEN", "RESTRICTED", "CONFIDENTIAL", "TOP SECRET"];
const VIEWABLE = new Set(["image", "video", "audio", "text"]);

/** Research database: categorized entries with attachments from the vault. */
export default function ResearchApp({ notify, onOpenMedia }) {
  const [data, setData] = useState(null);
  const [cat, setCat] = useState("biological");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    window.archiveApi.getData("research").then(setData);
  }, []);

  async function save(records) {
    const next = { ...data, records };
    setData(next);
    await window.archiveApi.saveData("research", next);
  }

  if (!data) return <div className="dim">UNSEALING RESEARCH WING...</div>;
  const records = data.records || [];
  const inCat = records.filter((r) => r.category === cat);
  const selected = records.find((r) => r.id === selectedId) || null;

  async function patch(id, partial) {
    await save(records.map((r) => (r.id === id ? { ...r, ...partial, updatedAt: Date.now() } : r)));
  }

  async function newEntry() {
    const title = window.prompt("Entry title:");
    if (!title?.trim()) return;
    playSound("confirm", 0.5);
    const rec = {
      id: `r${Date.now()}`,
      category: cat,
      title: title.trim().toUpperCase(),
      classification: "OPEN",
      body: "",
      attachments: [],
      updatedAt: Date.now()
    };
    await save([rec, ...records]);
    setSelectedId(rec.id);
  }

  async function openAttachment(att) {
    const name = att.split("/").pop() || att;
    const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    const kindMap = {
      png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", bmp: "image",
      mp4: "video", webm: "video", mkv: "video", mov: "video",
      mp3: "audio", ogg: "audio", wav: "audio", flac: "audio", m4a: "audio",
      txt: "text", md: "text", log: "text", json: "text", csv: "text"
    };
    const kind = kindMap[ext];
    if (kind && VIEWABLE.has(kind) && onOpenMedia) {
      onOpenMedia({ kind, name, src: `vault://file/${encodeURI(att)}` });
    } else {
      const ok = await window.archiveApi.openFile(att);
      if (!ok) notify?.("COULD NOT OPEN ATTACHMENT", true);
    }
  }

  return (
    <div className="research-split">
      <div className="research-side">
        {CATEGORIES.map(([value, label]) => (
          <button key={value} className={`app-tab side ${cat === value ? "on" : ""}`}
            onClick={() => { playSound("click", 0.3); setCat(value); setSelectedId(null); }}>
            {label} ({records.filter((r) => r.category === value).length})
          </button>
        ))}
        <button className="btn small" style={{ marginTop: 10, width: "100%" }} onClick={newEntry}>NEW ENTRY</button>
      </div>

      <div className="research-main">
        {!selected && (
          <table className="data-table">
            <tbody>
              {inCat.map((r) => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => { playSound("select", 0.35); setSelectedId(r.id); }}>
                  <td className="bright">{r.title}</td>
                  <td style={{ width: 120, textAlign: "right" }}>
                    <span className={`badge ${r.classification === "OPEN" ? "live" : ""}`}>{r.classification}</span>
                  </td>
                </tr>
              ))}
              {!inCat.length && <tr><td className="dim">wing is empty.</td></tr>}
            </tbody>
          </table>
        )}

        {selected && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="btn small ghost" onClick={() => setSelectedId(null)}>&lt; WING</button>
              <div className="bright">{selected.title}</div>
              <select className="text-input" style={{ marginLeft: "auto", width: 150 }}
                value={selected.classification}
                onChange={(e) => patch(selected.id, { classification: e.target.value })}>
                {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn small danger" onClick={async () => {
                if (!window.confirm(`Incinerate ${selected.title}?`)) return;
                playSound("error", 0.5);
                await save(records.filter((r) => r.id !== selected.id));
                setSelectedId(null);
              }}>BURN</button>
            </div>

            {selected.classification !== "OPEN" && (
              <div className={`classif-banner ${selected.classification === "TOP SECRET" ? "hot" : ""}`}>
                {selected.classification} :: EYES ONLY
              </div>
            )}

            <div className="field-label">FINDINGS</div>
            <textarea className="text-input" style={{ width: "100%", height: 150, resize: "vertical" }}
              value={selected.body}
              onChange={(e) => patch(selected.id, { body: e.target.value })} />

            <div className="field-label">ATTACHED EVIDENCE (ARCHIVE PATHS)</div>
            {(selected.attachments || []).map((att, i) => (
              <div key={i} className="obj-row">
                <span className="dim" style={{ wordBreak: "break-all" }}>{att}</span>
                <button className="btn small ghost" style={{ marginLeft: "auto" }} onClick={() => openAttachment(att)}>VIEW</button>
                <button className="task-x"
                  onClick={() => patch(selected.id, { attachments: selected.attachments.filter((_, j) => j !== i) })}>
                  x
                </button>
              </div>
            ))}
            <input className="text-input" style={{ width: "100%", marginTop: 6 }}
              placeholder="src0/path/to/evidence + ENTER"
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const v = e.currentTarget.value.trim();
                if (!v) return;
                patch(selected.id, { attachments: [...(selected.attachments || []), v] });
                e.currentTarget.value = "";
              }} />
          </div>
        )}
      </div>
    </div>
  );
}
