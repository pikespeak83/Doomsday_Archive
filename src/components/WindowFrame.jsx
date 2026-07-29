import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../lib/sounds.js";

let zCounter = 50;

/** Draggable window with title bar, close button, and focus-to-front. */
export default function WindowFrame({ title, onClose, initial, width, children }) {
  const [pos, setPos] = useState(initial || { x: 120, y: 70 });
  const [z, setZ] = useState(() => ++zCounter);
  const drag = useRef(null);

  useEffect(() => {
    playSound("open", 0.4);
    return () => playSound("close", 0.35);
  }, []);

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
      className="window"
      style={{ left: pos.x, top: pos.y, zIndex: z, width }}
      onMouseDown={() => setZ(++zCounter)}
    >
      <div
        className="window-title"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span>{title}</span>
        <button
          className="window-close"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
        >
          x
        </button>
      </div>
      <div className="window-body">{children}</div>
    </div>
  );
}
