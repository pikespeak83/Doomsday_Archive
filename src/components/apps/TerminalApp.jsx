import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../lib/sounds.js";

/** Small local console: status, devices, uplink info, and flavor. */
export default function TerminalApp({ lanState, sysInfo, config }) {
  const [lines, setLines] = useState([
    "DCI ARCHIVE SHELL v1.0",
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

  function run(raw) {
    const cmd = raw.trim().toLowerCase();
    print(`da:\\> ${raw}`);
    if (!cmd) return;
    playSound("click", 0.3);
    switch (cmd) {
      case "help":
        print(
          "  help      this list",
          "  status    node status report",
          "  devices   cleared + pending devices",
          "  uplink    LAN addresses for field terminals",
          "  vault     linked storage info",
          "  whoami    operator identity",
          "  clear     wipe the console",
          ""
        );
        break;
      case "status":
        print(
          `  NODE ........ ${sysInfo?.hostname || "?"}`,
          `  UPLINK ...... ${lanState?.running ? `ACTIVE :${lanState.port}` : "OFFLINE"}`,
          `  VAULT ....... ${config?.archiveRoot || "NOT LINKED"}`,
          `  DEVICES ..... ${lanState?.approved?.length || 0} cleared, ${lanState?.pending?.length || 0} pending`,
          `  INTERNET .... NOT REQUIRED`,
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
      case "vault":
        print(
          config?.archiveRoot
            ? `  root: ${config.archiveRoot}`
            : "  no storage linked (see SETTINGS)",
          ""
        );
        break;
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
              run(input);
              setInput("");
            }
          }}
        />
      </div>
    </div>
  );
}
