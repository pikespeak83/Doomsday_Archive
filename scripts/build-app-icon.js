"use strict";

/**
 * Renders the DCI seal into assets/app-icon.png using sharp.
 * Text is kept simple (DCI monogram) so it stays legible at 16px.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const outPath = path.join(root, "assets", "app-icon.png");

const SIZE = 512;

const svg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="#0d2b06"/>
      <stop offset="0.7" stop-color="#04120a"/>
      <stop offset="1" stop-color="#020703"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="86" fill="url(#bg)"/>
  <rect x="10" y="10" width="492" height="492" rx="78" fill="none" stroke="#7dff3f" stroke-opacity="0.35" stroke-width="4"/>

  <circle cx="256" cy="256" r="196" fill="none" stroke="#b6ff6a" stroke-width="10"/>
  <circle cx="256" cy="256" r="172" fill="none" stroke="#7dff3f" stroke-width="3" stroke-opacity="0.8"/>

  <path d="M 256 118 L 366 152 L 366 268 C 366 344 320 396 256 424 C 192 396 146 344 146 268 L 146 152 Z"
        fill="#061c04" stroke="#d9ffc4" stroke-width="12"/>

  <circle cx="256" cy="268" r="74" fill="none" stroke="#d9ffc4" stroke-width="8"/>
  <ellipse cx="256" cy="268" rx="32" ry="74" fill="none" stroke="#d9ffc4" stroke-width="5"/>
  <line x1="182" y1="268" x2="330" y2="268" stroke="#d9ffc4" stroke-width="5"/>
  <line x1="192" y1="232" x2="320" y2="232" stroke="#d9ffc4" stroke-width="4" stroke-opacity="0.85"/>
  <line x1="192" y1="304" x2="320" y2="304" stroke="#d9ffc4" stroke-width="4" stroke-opacity="0.85"/>

  ${star(256, 92, 22)}
  ${star(196, 102, 15)}
  ${star(316, 102, 15)}
</svg>
`;

function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="#d9ffc4"/>`;
}

async function main() {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log("[build-app-icon] Wrote", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
