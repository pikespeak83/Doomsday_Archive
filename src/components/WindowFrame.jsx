import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../lib/sounds.js";

let zCounter = 50;

/** Draggable window with title bar, minimize/close, and focus-to-front. */
export default function WindowFrame({ title, onClose, onMinimize, minimized, initial, width, children }) {
  const [pos, setPos] = useState(initial || { x: 120, y: 70 });
  const [z, setZ] = useState(() => ++zCounter);
  const [closing, setClosing] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    playSound("open", 0.4);
    return () => playSound("close", 0.35);
  }, []);

  function requestClose() {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 130);
  }

  function onPointerDown(e) {
    drag.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y };
    e.target.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 240, drag.current.baseX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 90, drag.current.baseY + dy))
    });
  }
  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div
      className={`window ${closing ? "win-closing" : ""}`}
      style={{ left: pos.x, top: pos.y, zIndex: z, width, display: minimized ? "none" : undefined }}
      onMouseDown={() => setZ(++zCounter)}
    >
      <div
        className="window-title"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <img className="window-logo" src="assets/brand/cerberus.jpg" alt="" draggable={false} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        </span>
        <span style={{ display: "flex", gap: 5 }}>
          {onMinimize && (
            <button
              className="window-close"
              onClick={onMinimize}
              onPointerDown={(e) => e.stopPropagation()}
              title="Minimize"
            >
              _
            </button>
          )}
          <button
            className="window-close"
            onClick={requestClose}
            onPointerDown={(e) => e.stopPropagation()}
            title="Close"
          >
            x
          </button>
        </span>
      </div>
      <div className="window-body">{children}</div>
    </div>
  );
}
