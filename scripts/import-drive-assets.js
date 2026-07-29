"use strict";

/** One-shot: imports Doomsday Drive pack assets into public/ (backdrops, font, boot loop). */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const drive = path.join(root, "Doomsday Drive");
const img = (n) => path.join(drive, "Archive_Images", n);
const outB = path.join(root, "public", "assets", "backdrops");
const outBrand = path.join(root, "public", "assets", "brand");
const outFonts = path.join(root, "public", "assets", "fonts");

const MAPS = [
  ["Green_Map.jpg", "emerald.jpg"],
  ["Red_Grid_Map.jpg", "crimson.jpg"],
  ["Black_Map.jpg", "onyx.jpg"],
  ["Blue_Circuit_Map.png", "circuit.jpg"],
  ["Gold_Grid_Map.avif", "gold.jpg"]
];

(async () => {
  fs.mkdirSync(outB, { recursive: true });
  fs.mkdirSync(outBrand, { recursive: true });
  fs.mkdirSync(outFonts, { recursive: true });

  for (const [src, dest] of MAPS) {
    const meta = await sharp(img(src)).metadata();
    const pipeline = sharp(img(src));
    if ((meta.width || 0) > 1600) pipeline.resize({ width: 1600 });
    await pipeline.jpeg({ quality: 86 }).toFile(path.join(outB, dest));
    console.log(`[backdrop] ${src} -> ${dest} (${meta.width}x${meta.height})`);
  }

  fs.copyFileSync(
    path.join(drive, "Cyberdeck Logos and Wallpapers", "Cerberus Logos and Wallpapers", "cerberus_full_360_seamless_ominous_loop.mp4"),
    path.join(outBrand, "cerberus-loop.mp4")
  );
  console.log("[brand] cerberus-loop.mp4 copied");

  fs.copyFileSync(img("Cerberus 01.png"), path.join(outBrand, "cerberus-alt.png"));
  fs.copyFileSync(img("Division_Logo_2.png"), path.join(outBrand, "division-logo.png"));
  console.log("[brand] alt logos copied");

  fs.copyFileSync(
    path.join(drive, "Cyberdeck Logos and Wallpapers", "Cerberus Logo Fonts", "medusa_gothic", "MedusaGothic D.otf"),
    path.join(outFonts, "MedusaGothic.otf")
  );
  console.log("[font] MedusaGothic.otf copied");
})();
