import React from "react";

/** Folder icon tinted by the active UI style via CSS variables. */
export default function FolderIcon() {
  return (
    <svg viewBox="0 0 64 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="folder-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--folder-face-a)" }} />
          <stop offset="1" style={{ stopColor: "var(--folder-face-b)" }} />
        </linearGradient>
        <linearGradient id="folder-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--folder-back-a)" }} />
          <stop offset="1" style={{ stopColor: "var(--folder-back-b)" }} />
        </linearGradient>
      </defs>
      <path d="M 4 8 L 24 8 L 29 14 L 60 14 L 60 46 L 4 46 Z" fill="url(#folder-back)" style={{ stroke: "var(--folder-edge)" }} strokeWidth="1.4" />
      <path d="M 4 18 L 60 18 L 60 46 L 4 46 Z" fill="url(#folder-face)" style={{ stroke: "var(--folder-edge)" }} strokeWidth="1.4" />
      <rect x="4" y="18" width="56" height="3" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}
