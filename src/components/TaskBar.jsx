import React from "react";
import { playSound } from "../lib/sounds.js";

/** Bottom taskbar: one button per open window, click to minimize/restore. */
export default function TaskBar({ windows, onToggle, onClose }) {
  if (!windows.length) return null;
  return (
    <div className="taskbar">
      {windows.map((win) => (
        <div key={win.key} className={`task-chip ${win.minimized ? "min" : ""}`}>
          <button
            className="task-label"
            title={win.title}
            onClick={() => {
              playSound("toggle", 0.3);
              onToggle(win.key);
            }}
          >
            {win.title}
          </button>
          <button
            className="task-x"
            title="Close"
            onClick={() => onClose(win.key)}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
