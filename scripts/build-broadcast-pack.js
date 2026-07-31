// Builds the Broadcast Pack: transcodes the Fallout clips to web-safe mp4,
// probes durations, writes a channel manifest, and zips the result for the
// GitHub release. Run on the dev box only: node scripts/build-broadcast-pack.js
const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const SRC = "C:\\Users\\Cadyn\\Downloads\\temp_folder";
const ROOT = path.join(__dirname, "..");
const STAGE = path.join(ROOT, "Temp", "broadcast-pack");
const OUT_ZIP = path.join(ROOT, "release", "Broadcast-Pack.zip");

const CHANNELS = [
  { id: "ch1", num: 1, name: "VAULT-TEC TRAINING", match: /training video|episode 1\b/i },
  { id: "ch2", num: 2, name: "AMERICA PSA", match: /america's future|nuclear|american wars|american secrets|american money|american careers|people will die|end of the world/i },
  { id: "ch3", num: 3, name: "CORPORATE LIFE", match: /corporate|never leave work|welcome home|american workers|living underground|emotional issues|winning team/i },
  { id: "ch4", num: 4, name: "VAULT BOY ORIGINS", match: /vault boy|pip boy|dog intro/i }
];

function slug(name) {
  return name.toLowerCase().replace(/\.mkv$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function title(name) {
  return name
    .replace(/\.mkv$/i, "")
    .replace(/^Fallout (Episode \d+ )?/i, "")
    .replace(/^Fallout 4 Anniversary Edition Animation - /i, "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .toUpperCase();
}

function probeDuration(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return Math.round(parseFloat(out.trim()) || 0);
}

function main() {
  fs.rmSync(STAGE, { recursive: true, force: true });
  fs.mkdirSync(path.join(STAGE, "video"), { recursive: true });

  const mkvs = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith(".mkv"));
  const channels = CHANNELS.map((c) => ({ id: c.id, num: c.num, name: c.name, episodes: [] }));
  const seen = new Set();

  for (const name of mkvs.sort()) {
    // first matching channel wins; training check runs before the episode-N buckets
    const chDef = CHANNELS.find((c) => c.match.test(name)) || CHANNELS[2];
    const ch = channels.find((c) => c.id === chDef.id);
    let base = slug(name);
    let n = 2;
    while (seen.has(base)) base = `${slug(name)}-${n++}`;
    seen.add(base);
    const outFile = `video/${base}.mp4`;
    const dest = path.join(STAGE, outFile);
    console.log(`[transcode] ${name} -> ${outFile}`);
    execFileSync("ffmpeg", [
      "-y", "-i", path.join(SRC, name),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
      "-vf", "scale='min(1280,iw)':-2",
      "-c:a", "aac", "-b:a", "128k",
      "-movflags", "+faststart",
      dest
    ], { stdio: ["ignore", "ignore", "ignore"] });
    ch.episodes.push({ id: base, title: title(name), file: outFile, duration: probeDuration(dest) });
  }

  // interstitial + poster assets
  const extras = [
    ["After Effects Template - Glitchy Circuits (Glitch Circuits Logo Opener).m4a", "static.m4a"],
    ["vault-tec-f78b2mshmdojhelo.jpg", "vault-tec.jpg"],
    ["1.gif", "test-card-1.gif"],
    ["4f3f44875abd9647c3d14d064439d53d.gif", "test-card-2.gif"],
    ["fallout-on-prime-fallout.gif", "test-card-3.gif"]
  ];
  for (const [from, to] of extras) {
    const src = path.join(SRC, from);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(STAGE, to));
      console.log(`[extra] ${to}`);
    }
  }

  const manifest = {
    version: 1,
    built: new Date().toISOString(),
    channels: channels.filter((c) => c.episodes.length)
  };
  fs.writeFileSync(path.join(STAGE, "manifest.json"), JSON.stringify(manifest, null, 2));

  fs.mkdirSync(path.dirname(OUT_ZIP), { recursive: true });
  fs.rmSync(OUT_ZIP, { force: true });
  const zip = spawnSync("tar", ["-a", "-c", "-f", OUT_ZIP, "-C", STAGE, "."], { stdio: "inherit" });
  if (zip.status !== 0) throw new Error("zip failed");

  const totalEps = manifest.channels.reduce((n, c) => n + c.episodes.length, 0);
  const mb = (fs.statSync(OUT_ZIP).size / 1024 / 1024).toFixed(1);
  console.log(`PACK OK :: ${manifest.channels.length} channels, ${totalEps} episodes, ${mb} MB -> ${OUT_ZIP}`);
}

main();
