import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../lib/sounds.js";

/** Modal text prompt; window.prompt does not exist inside Electron. */
export default function TextPrompt({ title, initial = "", maxLength = 80, onSubmit, onClose }) {
  const [draft, setDraft] = useState(initial);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function submit() {
    const value = draft.trim();
    if (!value) return onClose();
    playSound("confirm", 0.45);
    onSubmit(value);
    onClose();
  }

  return (
    <div className="prompt-veil" onMouseDown={onClose}>
      <div className="prompt-box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="field-label" style={{ marginTop: 0 }}>{title}</div>
        <input
          ref={inputRef}
          className="text-input"
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onClose();
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
          <button className="btn small ghost" onClick={onClose}>CANCEL</button>
          <button className="btn small" onClick={submit}>CONFIRM</button>
        </div>
      </div>
    </div>
  );
}
