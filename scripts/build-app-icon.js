"use strict";

/**
 * Renders the Project Cerberus emblem into assets/app-icon.png using sharp.
 * The source jpg is center-cropped square, masked to a circle, and framed
 * with a thin orange ring on a dark rounded-square plate.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const srcPath = path.join(root, "public", "assets", "brand", "cerberus.jpg");
const outPath = path.join(root, "assets", "app-icon.png");

const SIZE = 512;
const EMBLEM = 456; // circular emblem diameter inside the plate

const plateSvg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="#1a0e02"/>
      <stop offset="0.7" stop-color="#0c0601"/>
      <stop offset="1" stop-color="#050301"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="86" fill="url(#bg)"/>
  <rect x="10" y="10" width="492" height="492" rx="78" fill="none" stroke="#ffab26" stroke-opacity="0.4" stroke-width="4"/>
</svg>
`;

const ringSvg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <circle cx="256" cy="256" r="${EMBLEM / 2 - 2}" fill="none" stroke="#ffab26" stroke-width="6"/>
</svg>
`;

const circleMask = `
<svg width="${EMBLEM}" height="${EMBLEM}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${EMBLEM / 2}" cy="${EMBLEM / 2}" r="${EMBLEM / 2}" fill="#fff"/>
</svg>
`;

async function main() {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const meta = await sharp(srcPath).metadata();
  const side = Math.min(meta.width, meta.height);
  const emblem = await sharp(srcPath)
    .extract({
      left: Math.floor((meta.width - side) / 2),
      top: Math.floor((meta.height - side) / 2),
      width: side,
      height: side
    })
    .resize(EMBLEM, EMBLEM)
    .composite([{ input: Buffer.from(circleMask), blend: "dest-in" }])
    .png()
    .toBuffer();

  await sharp(Buffer.from(plateSvg))
    .composite([
      { input: emblem, left: (SIZE - EMBLEM) / 2, top: (SIZE - EMBLEM) / 2 },
      { input: Buffer.from(ringSvg) }
    ])
    .png()
    .toFile(outPath);
  console.log("[build-app-icon] Wrote", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
