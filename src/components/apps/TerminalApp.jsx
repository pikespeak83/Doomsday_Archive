import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../lib/sounds.js";

/** Small local console: status, devices, uplink info, and flavor. */
export default function TerminalApp({ lanState, sysInfo, config }) {
  const [lines, setLines] = useState([
    "CERBERUS ARCHIVE SHELL v1.1",
    'Type "help" for available commands.',
    ""
  ]);
  const [input, setInput] = useState("");
  const termRef = useRef(null);

  useEffect(() => {
    termRef.current?.scrollTo(0, termRef.current.scrollHeight);
  }, [lines]);

  function print(...newLines) {
    setLines((prev) => [...prev, ...newLines]);
  }

  async function run(raw) {
    const trimmed = raw.trim();
    const cmd = trimmed.toLowerCase();
    print(`da:\\> ${raw}`);
    if (!cmd) return;
    playSound("click", 0.3);

    // ---- commands with arguments
    if (cmd.startsWith("search ")) {
      const q = trimmed.slice(7).trim();
      print(`  scanning the vault for "${q}"...`);
      const res = await window.archiveApi.searchArchive(q);
      const hits = res.results || [];
      if (!hits.length) { print("  no matches.", ""); return; }
      hits.slice(0, 25).forEach((h) => print(`  ${h.type === "dir" ? "<DIR> " : "      "}${h.rel}`));
      print(`  ${hits.length}${res.truncated ? "+" : ""} match(es).`, "");
      return;
    }
    if (cmd.startsWith("run ")) {
      const rel = trimmed.slice(4).trim();
      print(`  executing ${rel} ...`);
      const res = await window.archiveApi.runBat(rel);
      if (!res.ok && res.error) {
        playSound("error", 0.4);
        print(`  error: ${res.error}`, "");
        return;
      }
      (res.output || "(no output)").split(/\r?\n/).slice(0, 60).forEach((l) => print(`  ${l}`));
      print(`  exit code ${res.code ?? 0}`, "");
      return;
    }
    if (cmd.startsWith("open ")) {
      const rel = trimmed.slice(5).trim();
      const ok = await window.archiveApi.openFile(rel);
      print(ok ? "  handed to the system shell." : "  could not open that path.", "");
      return;
    }
    if (cmd === "provision") {
      const sources = lanState?.archiveSources || [];
      if (!sources.length) { print("  no storage linked (see SETTINGS)", ""); return; }
      const res = await window.archiveApi.provisionArchive(sources[0].id);
      if (res.ok) print(`  standard archive folders provisioned (${res.created} created).`, "");
      else print(`  error: ${res.error}`, "");
      return;
    }

    switch (cmd) {
      case "help":
        print(
          "  help              this list",
          "  status            node status report",
          "  search <text>     find files across the vault",
          "  run <path.bat>    execute a batch file from the vault",
          "  open <path>       open a vault file with the system app",
          "  provision         create the standard archive folder tree",
          "  devices           cleared + pending devices",
          "  uplink            LAN addresses for field terminals",
          "  vault             linked storage info",
          "  whoami            operator identity",
          "  clear             wipe the console",
          ""
        );
        break;
      case "status":
        print(
          `  NODE ........ ${sysInfo?.hostname || "?"}`,
          `  UPLINK ...... ${lanState?.running ? `ACTIVE :${lanState.port}` : "OFFLINE"}`,
          `  VAULT ....... ${lanState?.archiveSources?.length ? `${lanState.archiveSources.length} SOURCE(S)` : "NOT LINKED"}`,
          `  DEVICES ..... ${lanState?.approved?.length || 0} cleared, ${lanState?.pending?.length || 0} pending`,
          `  INTERNET .... SEVERED (BY DESIGN)`,
          ""
        );
        break;
      case "devices": {
        const approved = lanState?.approved || [];
        const pending = lanState?.pending || [];
        if (!approved.length && !pending.length) print("  no devices on record", "");
        approved.forEach((d) => print(`  [CLEARED] ${d.name}`));
        pending.forEach((d) => print(`  [PENDING] ${d.name}`));
        if (approved.length || pending.length) print("");
        break;
      }
      case "uplink": {
        const list = lanState?.interfaces || [];
        if (!list.length) print("  no local adapters found", "");
        list.forEach((iface) =>
          print(`  http://${iface.address}:${lanState?.port || 8737}  (${iface.name})`)
        );
        if (list.length) print("");
        break;
      }
      case "vault": {
        const list = lanState?.archiveSources || [];
        if (!list.length) print("  no storage linked (see SETTINGS)", "");
        list.forEach((s) => print(`  [${s.id}] ${s.label || s.path} -> ${s.path}`));
        if (list.length) print("");
        break;
      }
      case "whoami":
        print(`  ${sysInfo?.username || "operator"} @ ${sysInfo?.hostname || "node"}`, "");
        break;
      case "clear":
        setLines([]);
        break;
      case "sudo":
      case "sudo su":
        print("  clearance already at maximum. nice try.", "");
        break;
      case "exit":
        print("  there is no exit. only the archive.", "");
        break;
      default:
        playSound("error", 0.3);
        print(`  unknown directive: ${cmd}`, "");
    }
  }

  return (
    <div>
      <div className="term" ref={termRef}>
        {lines.map((line, i) => (
          <div key={i}>{line || "\u00a0"}</div>
        ))}
      </div>
      <div className="term-input-row">
        <span className="dim">da:\&gt;</span>
        <input
          className="term-input"
          value={input}
          autoFocus
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void run(input);
              setInput("");
            }
          }}
        />
      </div>
    </div>
  );
}
