import React, { useRef, useState } from "react";
import FolderIcon from "./FolderIcon.jsx";

/**
 * Desktop folder icon: click to open, drag to reposition (Windows style).
 * Icons without a stored position live in the right-hand column; once
 * dragged they become free-floating and the position is persisted.
 */
export default function DeskIcon({ label, pos, onOpen, onMove }) {
  const [drag, setDrag] = useState(null); // { dx, dy }
  const info = useRef(null);

  function down(e) {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    info.current = {
      startX: e.clientX,
      startY: e.clientY,
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
      moved: false
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function move(e) {
    if (!info.current) return;
    const dx = e.clientX - info.current.startX;
    const dy = e.clientY - info.current.startY;
    if (!info.current.moved && Math.hypot(dx, dy) < 6) return;
    info.current.moved = true;
    setDrag({ dx, dy });
  }

  function up(e) {
    const i = info.current;
    info.current = null;
    setDrag(null);
    if (!i) return;
    if (!i.moved) {
      onOpen();
      return;
    }
    const desk = e.currentTarget.closest(".desktop");
    if (!desk) return;
    const rect = desk.getBoundingClientRect();
    const x = Math.max(4, Math.min(rect.width - 96, e.clientX - rect.left - i.grabX));
    const y = Math.max(4, Math.min(rect.height - 104, e.clientY - rect.top - i.grabY));
    onMove({ x: Math.round(x), y: Math.round(y) });
  }

  return (
    <button
      className={`desk-icon ${pos ? "free" : ""} ${drag ? "dragging" : ""}`}
      style={{
        ...(pos ? { left: pos.x, top: pos.y } : null),
        ...(drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : null)
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
    >
      <FolderIcon />
      <span>{label}</span>
    </button>
  );
}
