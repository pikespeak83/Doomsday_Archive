import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../lib/sounds.js";

const BOOT_MSG = {
  role: "oracle",
  text: "ORACLE CORE ONLINE.\nI answer from the vault, not the sky.\nTry: search <name>, missions, roster, status. Or just talk."
};

const CANNED = [
  "The archive holds. Ask me to SEARCH it and I will dig.",
  "No uplink to the old world. Everything I know lives on these drives.",
  "Recommendation: verify your water filters before you verify my sarcasm.",
  "I have read every manual in the vault twice. The second time was for fun.",
  "State your query. Preferably before the batteries do not."
];

/** ORACLE: offline assistant with archive search, mission and roster recall.
 *  Upgrades itself to a local LLM automatically when one is detected. */
export default function AssistantApp({ lanState, sysInfo }) {
  const [messages, setMessages] = useState([BOOT_MSG]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [llm, setLlm] = useState({ online: false, models: [] });
  const logRef = useRef(null);

  useEffect(() => {
    window.archiveApi.oracleStatus().then(setLlm);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [messages, busy]);

  function push(role, text) {
    setMessages((prev) => [...prev, { role, text }]);
  }

  async function handle(raw) {
    const text = raw.trim();
    if (!text) return;
    playSound("click", 0.35);
    push("user", text);
    setBusy(true);
    try {
      const lower = text.toLowerCase();

      if (lower.startsWith("search ")) {
        const q = text.slice(7).trim();
        const res = await window.archiveApi.searchArchive(q);
        const hits = res.results || [];
        if (!hits.length) {
          push("oracle", `Nothing in the vault matches "${q}". Either it does not exist, or somebody filed it badly.`);
        } else {
          const lines = hits.slice(0, 12).map((h) => `  ${h.type === "dir" ? "[DIR] " : ""}${h.rel}`);
          push("oracle", `${hits.length}${res.truncated ? "+" : ""} matches for "${q}":\n${lines.join("\n")}${hits.length > 12 ? "\n  ...more in the ARCHIVE app." : ""}`);
        }
        return;
      }

      if (lower === "missions" || lower.startsWith("mission")) {
        const data = await window.archiveApi.getData("missions");
        const recs = data.records || [];
        const active = recs.filter((m) => m.status === "active");
        const lines = recs.slice(0, 10).map((m) => {
          const done = (m.objectives || []).filter((o) => o.done).length;
          return `  [${(m.status || "?").toUpperCase()}] ${m.codename} :: ${done}/${(m.objectives || []).length} objectives`;
        });
        push("oracle", `Mission board: ${active.length} active of ${recs.length} total.\n${lines.join("\n")}`);
        return;
      }

      if (lower === "roster" || lower.startsWith("personnel")) {
        const name = lower.startsWith("personnel ") ? text.slice(10).trim().toLowerCase() : "";
        const data = await window.archiveApi.getData("personnel");
        const recs = data.records || [];
        if (name) {
          const hit = recs.find((r) => r.name.toLowerCase().includes(name));
          if (!hit) { push("oracle", `No dossier matches "${name}".`); return; }
          push("oracle", `${hit.name}\n  CLEARANCE: ${hit.clearance}\n  STATUS: ${hit.status}\n  SKILLS: ${hit.skills || "none on file"}\n  HISTORY: ${hit.history || "sealed"}`);
        } else {
          push("oracle", `Roster: ${recs.length} dossiers.\n${recs.map((r) => `  ${r.name} :: ${r.status}`).join("\n")}`);
        }
        return;
      }

      if (lower === "status") {
        push("oracle", [
          `NODE: ${sysInfo?.hostname || "?"}`,
          `UPLINK: ${lanState?.running ? `ACTIVE :${lanState.port}` : "OFFLINE"}`,
          `VAULT: ${lanState?.archiveSources?.length || 0} source(s)`,
          `FIELD UNITS: ${lanState?.approved?.length || 0} cleared`,
          `LLM CORE: ${llm.online ? `LINKED (${llm.models[0]})` : "OFFLINE HEURISTICS"}`
        ].join("\n"));
        return;
      }

      if (llm.online && llm.models[0]) {
        const res = await window.archiveApi.oracleAsk(text, llm.models[0]);
        if (res.ok && res.text) {
          push("oracle", res.text);
        } else {
          push("oracle", `LLM core faulted (${res.error || "unknown"}). Falling back to instinct: ${CANNED[Math.floor(Math.random() * CANNED.length)]}`);
        }
        return;
      }

      push("oracle", CANNED[Math.floor(Math.random() * CANNED.length)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="chat-status">
        <span className={`status-led ${llm.online ? "ok" : ""}`} />
        <span className="dim" style={{ fontSize: 11 }}>
          {llm.online
            ? `LOCAL LLM LINKED :: ${llm.models[0]} (offline, via Ollama)`
            : "HEURISTIC CORE :: no local LLM detected (install Ollama to upgrade ORACLE, still fully offline)"}
        </span>
      </div>
      <div className="chat-log" ref={logRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <span className="chat-tag">{m.role === "user" ? "YOU" : "ORACLE"}</span>
            <pre>{m.text}</pre>
          </div>
        ))}
        {busy && <div className="chat-msg oracle"><span className="chat-tag">ORACLE</span><pre className="dim">thinking...</pre></div>}
      </div>
      <div className="term-input-row">
        <span className="dim">&gt;&gt;</span>
        <input className="term-input" value={input} autoFocus spellCheck={false}
          placeholder="ask, or: search water filter"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !busy) {
              void handle(input);
              setInput("");
            }
          }} />
      </div>
    </div>
  );
}
