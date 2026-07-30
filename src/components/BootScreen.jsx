import React, { useEffect, useRef, useState } from "react";
import Seal from "./Seal.jsx";
import LetterGlitch from "../reactbits/LetterGlitch.jsx";
import DecryptedText from "../reactbits/DecryptedText.jsx";
import { playSound } from "../lib/sounds.js";

const DEFAULT_LINES = [
  "CERBERUS ARCHIVE OS v1.2.0 :: SECURE KERNEL LOADED",
  "MOUNTING LOCAL NODE ............ OK",
  "SCANNING STORAGE BUS ........... OK",
  "UPLINK MODULE (LAN ONLY) ....... READY",
  "EXTERNAL NETWORKS .............. SEVERED"
];

/**
 * Boot sequence: glitch backdrop, seal, typed status lines, then the
 * WELCOME BACK banner decrypting the PC name. Click or key skips.
 */
export default function BootScreen({
  hostname,
  onDone,
  lines = DEFAULT_LINES,
  subtitle = "DATA CONTAINMENT INITIATIVE :: ARCHIVE NODE ONLINE",
  glitchColors
}) {
  const [lineCount, setLineCount] = useState(0);
  const [phase, setPhase] = useState("lines"); // lines -> welcome -> exit
  const [videoFailed, setVideoFailed] = useState(false);
  const timers = useRef([]);
  const doneRef = useRef(false);

  useEffect(() => {
    playSound("boot", 0.4);
    lines.forEach((_, i) => {
      timers.current.push(setTimeout(() => setLineCount(i + 1), 550 + i * 420));
    });
    timers.current.push(
      setTimeout(() => {
        setPhase("welcome");
        playSound("confirm", 0.5);
      }, 550 + lines.length * 420 + 350)
    );
    timers.current.push(setTimeout(() => beginExit(), 550 + lines.length * 420 + 3400));
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
      <LetterGlitch className="boot-glitch" glitchColors={glitchColors} glitchSpeed={70} opacity={0.16} outerVignette />
      {videoFailed ? (
        <Seal className="boot-seal" />
      ) : (
        <video
          className="seal-img boot-seal video"
          src="assets/brand/cerberus-loop.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      )}
      {phase === "lines" && (
        <div className="boot-lines">
          {lines.slice(0, lineCount).map((line) => (
            <div key={line} className="done">{line}</div>
          ))}
          {lineCount < lines.length && <div className="cursor-block" />}
        </div>
      )}
      {phase !== "lines" && (
        <div className="boot-lines" style={{ minHeight: 120 }}>
          <div className="boot-welcome">
            <DecryptedText text={`WELCOME BACK, ${hostname.toUpperCase()}`} speed={30} />
          </div>
          <div className="boot-sub">{subtitle}</div>
        </div>
      )}
      <div className="boot-skip">[ CLICK OR PRESS ANY KEY TO SKIP ]</div>
    </div>
  );
}
