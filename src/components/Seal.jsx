import React from "react";

/** DCI circular seal, drawn to match the reference branding. */
export default function Seal({ className }) {
  return (
    <svg className={className} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <path id="seal-arc-top" d="M 150,150 m -108,0 a 108,108 0 1,1 216,0" />
        <path id="seal-arc-bottom" d="M 150,150 m -86,0 a 86,86 0 1,0 172,0" />
      </defs>

      <circle cx="150" cy="150" r="128" fill="rgba(2,10,3,0.72)" stroke="#e8ffe0" strokeWidth="3" />
      <circle cx="150" cy="150" r="120" fill="none" stroke="#e8ffe0" strokeWidth="1" opacity="0.7" />
      <circle cx="150" cy="150" r="74" fill="none" stroke="#e8ffe0" strokeWidth="2" />

      <text fill="#f2fff0" fontFamily="'Share Tech Mono', monospace" fontSize="21" letterSpacing="5">
        <textPath href="#seal-arc-top" startOffset="50%" textAnchor="middle">
          DATA CONTAINMENT INITIATIVE
        </textPath>
      </text>
      <text fill="#d8f5d0" fontFamily="'Share Tech Mono', monospace" fontSize="14" letterSpacing="4">
        <textPath href="#seal-arc-bottom" startOffset="50%" textAnchor="middle">
          PROTECT &#183; CONTAIN &#183; SECURE
        </textPath>
      </text>

      {[-2, -1, 0, 1, 2].map((i) => {
        const angle = (-90 + i * 16) * (Math.PI / 180);
        const r = 97;
        const x = 150 + r * Math.cos(angle);
        const y = 150 + r * Math.sin(angle);
        const size = i === 0 ? 9 : 6.5;
        return <Star key={i} cx={x} cy={y} r={size} />;
      })}

      {/* shield */}
      <path
        d="M 150 92 L 196 106 L 196 152 C 196 186 176 206 150 218 C 124 206 104 186 104 152 L 104 106 Z"
        fill="rgba(3,14,4,0.85)"
        stroke="#f2fff0"
        strokeWidth="3.5"
      />
      {/* globe */}
      <circle cx="150" cy="152" r="34" fill="none" stroke="#f2fff0" strokeWidth="2.5" />
      <ellipse cx="150" cy="152" rx="15" ry="34" fill="none" stroke="#f2fff0" strokeWidth="1.6" />
      <ellipse cx="150" cy="152" rx="27" ry="34" fill="none" stroke="#f2fff0" strokeWidth="1" opacity="0.65" />
      <line x1="116" y1="152" x2="184" y2="152" stroke="#f2fff0" strokeWidth="1.6" />
      <line x1="121" y1="136" x2="179" y2="136" stroke="#f2fff0" strokeWidth="1.2" opacity="0.8" />
      <line x1="121" y1="168" x2="179" y2="168" stroke="#f2fff0" strokeWidth="1.2" opacity="0.8" />
      {/* shield wings */}
      <path d="M 104 118 L 88 112 L 88 150 C 88 160 92 170 100 178 L 104 172 Z" fill="none" stroke="#f2fff0" strokeWidth="2" />
      <path d="M 196 118 L 212 112 L 212 150 C 212 160 208 170 200 178 L 196 172 Z" fill="none" stroke="#f2fff0" strokeWidth="2" />
    </svg>
  );
}

function Star({ cx, cy, r }) {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return <polygon points={points.join(" ")} fill="#f2fff0" />;
}
