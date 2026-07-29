import React, { useState } from "react";
import Seal from "./Seal.jsx";
import LetterGlitch from "../reactbits/LetterGlitch.jsx";
import { playSound } from "../lib/sounds.js";

/** Full-screen vault lock. Shown when the host set a passphrase. */
export default function LockScreen({ onUnlocked, glitchColors }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function tryUnlock() {
    if (busy || !value) return;
    setBusy(true);
    const result = await window.archiveApi.unlockVault(value);
    setBusy(false);
    if (result.ok) {
      playSound("confirm", 0.5);
      onUnlocked();
    } else {
      playSound("error", 0.5);
      setError(true);
      setValue("");
      setTimeout(() => setError(false), 600);
    }
  }

  return (
    <div className="lock-screen">
      <LetterGlitch className="boot-glitch" glitchColors={glitchColors} glitchSpeed={80} opacity={0.14} outerVignette />
      <Seal className="lock-seal" />
      <div className={`panel lock-panel ${error ? "shake" : ""}`}>
        <div className="bright" style={{ letterSpacing: 3, marginBottom: 6 }}>VAULT SEALED</div>
        <div className="dim" style={{ fontSize: 13, marginBottom: 10 }}>
          Enter the passphrase to open this terminal.
        </div>
        <input
          className="text-input"
          type="password"
          autoFocus
          value={value}
          placeholder="PASSPHRASE"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
        />
        <button className="btn" style={{ marginTop: 12 }} onClick={tryUnlock} disabled={busy || !value}>
          {busy ? "VERIFYING..." : "UNSEAL VAULT"}
        </button>
        {error && <p className="warn" style={{ marginTop: 10, fontSize: 13 }}>INCORRECT PASSPHRASE</p>}
      </div>
    </div>
  );
}
