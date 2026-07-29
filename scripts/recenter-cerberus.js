"use strict";

/**
 * One-shot: recenters the Cerberus emblem inside public/assets/brand/cerberus.jpg.
 * Trims the dark margins to the emblem bounding box, pads to a square with
 * black, and overwrites the asset so circular crops are centered.
 */
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const file = path.join(root, "public", "assets", "brand", "cerberus.jpg");

async function main() {
  const trimmed = await sharp(file)
    .trim({ threshold: 45 })
    .toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  const side = Math.max(width, height) + 24; // small black margin
  const out = await sharp(trimmed.data)
    .extend({
      top: Math.floor((side - height) / 2),
      bottom: Math.ceil((side - height) / 2),
      left: Math.floor((side - width) / 2),
      right: Math.ceil((side - width) / 2),
      background: { r: 8, g: 6, b: 4 }
    })
    .jpeg({ quality: 92 })
    .toBuffer();
  await sharp(out).toFile(file + ".tmp.jpg");
  require("fs").renameSync(file + ".tmp.jpg", file);
  console.log(`[recenter] ${width}x${height} -> ${side}x${side}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
