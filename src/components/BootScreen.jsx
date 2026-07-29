import React, { useEffect, useRef, useState } from "react";
import Seal from "./Seal.jsx";
import { playSound } from "../lib/sounds.js";

const BOOT_LINES = [
  "DCI ARCHIVE OS v1.0.0 :: SECURE KERNEL LOADED",
  "MOUNTING LOCAL NODE ............ OK",
  "SCANNING STORAGE BUS ........... OK",
  "UPLINK MODULE (LAN ONLY) ....... READY",
  "EXTERNAL NETWORKS .............. NOT REQUIRED"
];

/**
 * Boot sequence: seal draws in, status lines type out, then the
 * WELCOME BACK banner with the PC name. Click or key skips.
 */
export default function BootScreen({ hostname, onDone }) {
  const [lineCount, setLineCount] = useState(0);
  const [phase, setPhase] = useState("lines"); // lines -> welcome -> exit
  const timers = useRef([]);
  const doneRef = useRef(false);

  useEffect(() => {
    playSound("boot", 0.4);
    BOOT_LINES.forEach((_, i) => {
      timers.current.push(setTimeout(() => setLineCount(i + 1), 550 + i * 420));
    });
    timers.current.push(
      setTimeout(() => {
        setPhase("welcome");
        playSound("confirm", 0.5);
      }, 550 + BOOT_LINES.length * 420 + 350)
    );
    timers.current.push(setTimeout(() => beginExit(), 550 + BOOT_LINES.length * 420 + 3100));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  function beginExit() {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase("exit");
    setTimeout(onDone, 560);
  }

  useEffect(() => {
    const skip = () => beginExit();
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, []);

  return (
    <div className={`boot ${phase === "exit" ? "boot-exit" : ""}`} onClick={beginExit}>
      <Seal className="boot-seal" />
      {phase === "lines" && (
        <div className="boot-lines">
          {BOOT_LINES.slice(0, lineCount).map((line) => (
            <div key={line} className="done">{line}</div>
          ))}
          {lineCount < BOOT_LINES.length && <div className="cursor-block" />}
        </div>
      )}
      {phase !== "lines" && (
        <div className="boot-lines" style={{ minHeight: 120 }}>
          <div className="boot-welcome">WELCOME BACK, {hostname.toUpperCase()}</div>
          <div className="boot-sub">DATA CONTAINMENT INITIATIVE :: ARCHIVE NODE ONLINE</div>
        </div>
      )}
      <div className="boot-skip">[ CLICK OR PRESS ANY KEY TO SKIP ]</div>
    </div>
  );
}
