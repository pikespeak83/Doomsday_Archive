import React from "react";

/** Lime folder icon in the style of the reference desktop. */
export default function FolderIcon() {
  return (
    <svg viewBox="0 0 64 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="folder-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8f542" />
          <stop offset="1" stopColor="#86c81e" />
        </linearGradient>
        <linearGradient id="folder-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ede2c" />
          <stop offset="1" stopColor="#5f9a12" />
        </linearGradient>
      </defs>
      <path d="M 4 8 L 24 8 L 29 14 L 60 14 L 60 46 L 4 46 Z" fill="url(#folder-back)" stroke="#2c4d07" strokeWidth="1.4" />
      <path d="M 4 18 L 60 18 L 60 46 L 4 46 Z" fill="url(#folder-face)" stroke="#2c4d07" strokeWidth="1.4" />
      <rect x="4" y="18" width="56" height="3" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}
