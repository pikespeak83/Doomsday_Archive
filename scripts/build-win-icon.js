"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const toIco = require("to-ico");

const root = path.join(__dirname, "..");
const pngPath = path.join(root, "assets", "app-icon.png");
const icoOut = path.join(root, "assets", "app-icon.ico");
const sidebarOut = path.join(root, "build", "installerSidebar.bmp");

/** Sizes electron-builder expects in a Windows .ico (256 required). */
const SIZES = [16, 24, 32, 48, 64, 128, 256];

/** NSIS MUI2 welcome/finish sidebar dimensions. */
const SIDEBAR_W = 164;
const SIDEBAR_H = 314;

async function buildIco() {
  const bufs = await Promise.all(
    SIZES.map((s) => sharp(pngPath).resize(s, s, { fit: "cover" }).png().toBuffer())
  );
  const ico = await toIco(bufs);
  fs.writeFileSync(icoOut, ico);
  console.log("[build-win-icon] Wrote", icoOut, `(${ico.length} bytes)`);
}

/** Encode raw RGB pixels (top-down) as an uncompressed 24-bit bottom-up BMP. */
function encodeBmp24(width, height, rgb) {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const dataSize = rowSize * height;
  const fileSize = 54 + dataSize;
  const out = Buffer.alloc(fileSize);
  out.write("BM", 0, "ascii");
  out.writeUInt32LE(fileSize, 2);
  out.writeUInt32LE(54, 10);
  out.writeUInt32LE(40, 14);
  out.writeInt32LE(width, 18);
  out.writeInt32LE(height, 22);
  out.writeUInt16LE(1, 26);
  out.writeUInt16LE(24, 28);
  out.writeUInt32LE(0, 30);
  out.writeUInt32LE(dataSize, 34);
  out.writeInt32LE(2835, 38);
  out.writeInt32LE(2835, 42);
  for (let y = 0; y < height; y += 1) {
    const srcY = height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const src = (srcY * width + x) * 3;
      const dst = 54 + y * rowSize + x * 3;
      out[dst] = rgb[src + 2];
      out[dst + 1] = rgb[src + 1];
      out[dst + 2] = rgb[src];
    }
  }
  return out;
}

async function buildInstallerSidebar() {
  const backgroundSvg = Buffer.from(`
    <svg width="${SIDEBAR_W}" height="${SIDEBAR_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0.65" y2="1">
          <stop offset="0" stop-color="#0b2205"/>
          <stop offset="0.55" stop-color="#040d02"/>
          <stop offset="1" stop-color="#061404"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.3" r="0.6">
          <stop offset="0" stop-color="#7dff3f" stop-opacity="0.28"/>
          <stop offset="1" stop-color="#7dff3f" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${SIDEBAR_W}" height="${SIDEBAR_H}" fill="url(#bg)"/>
      <rect width="${SIDEBAR_W}" height="${SIDEBAR_H}" fill="url(#glow)"/>
      <rect x="0" y="0" width="${SIDEBAR_W}" height="2" fill="#7dff3f" fill-opacity="0.55"/>
      <rect x="0" y="${SIDEBAR_H - 2}" width="${SIDEBAR_W}" height="2" fill="#7dff3f" fill-opacity="0.25"/>
      <circle cx="${SIDEBAR_W / 2}" cy="112" r="62" fill="none" stroke="#7dff3f" stroke-opacity="0.35" stroke-width="1.5"/>
      <circle cx="${SIDEBAR_W / 2}" cy="112" r="70" fill="none" stroke="#7dff3f" stroke-opacity="0.12" stroke-width="1"/>
    </svg>
  `);

  const iconSize = 104;
  const icon = await sharp(pngPath).resize(iconSize, iconSize, { fit: "cover" }).png().toBuffer();

  const { data, info } = await sharp(backgroundSvg)
    .composite([
      {
        input: icon,
        left: Math.round((SIDEBAR_W - iconSize) / 2),
        top: Math.round(112 - iconSize / 2)
      }
    ])
    .flatten({ background: "#040d02" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bmp = encodeBmp24(info.width, info.height, data);
  fs.mkdirSync(path.dirname(sidebarOut), { recursive: true });
  fs.writeFileSync(sidebarOut, bmp);
  console.log("[build-win-icon] Wrote", sidebarOut, `(${bmp.length} bytes)`);
}

async function main() {
  if (!fs.existsSync(pngPath)) {
    console.error("[build-win-icon] Missing source PNG:", pngPath);
    process.exit(1);
  }
  await buildIco();
  await buildInstallerSidebar();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
