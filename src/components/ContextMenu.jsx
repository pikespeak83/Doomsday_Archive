import React, { useEffect, useRef } from "react";
import { playSound } from "../lib/sounds.js";

/**
 * Windows-style right-click menu, DCI skin.
 * items: [{ label, onClick, danger, disabled, divider }]
 */
export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    playSound("hover", 0.3);
    const away = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    const key = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", away);
    window.addEventListener("keydown", key);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  // keep the menu on-screen
  const style = {
    left: Math.min(x, window.innerWidth - 210),
    top: Math.min(y, window.innerHeight - items.length * 30 - 20)
  };

  return (
    <div className="ctx-menu" style={style} ref={ref} onContextMenu={(e) => e.preventDefault()}>
      {items.map((item, i) =>
        item.divider ? (
          <div className="ctx-divider" key={`div-${i}`} />
        ) : (
          <button
            key={item.label}
            className={`ctx-item ${item.danger ? "danger" : ""}`}
            disabled={item.disabled}
            onClick={() => {
              playSound("click", 0.35);
              onClose();
              item.onClick?.();
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
