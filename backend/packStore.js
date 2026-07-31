// Broadcast pack: downloads the Broadcast-Pack.zip release asset into
// userData and extracts it so the TV app can tune in. Fully optional; when
// the grid is down everything fails soft and the TV shows NO CARRIER.
const fs = require("fs");
const path = require("path");
const https = require("https");
const { spawn } = require("child_process");

const RELEASES_URL = "https://api.github.com/repos/pikespeak83/Doomsday_Archive/releases/latest";
const ASSET_NAME = "Broadcast-Pack.zip";
const USER_AGENT = "doomsday-archive-pack";

function httpGetJson(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": USER_AGENT, Accept: "application/vnd.github+json" }, timeout: timeoutMs },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try { resolve(JSON.parse(data)); } catch (err) { reject(err); }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

function download(url, destPath, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error("too many redirects"));
    const req = https.get(
      url,
      { headers: { "User-Agent": USER_AGENT, Accept: "application/octet-stream" }, timeout: 120000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(download(res.headers.location, destPath, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(destPath)));
        file.on("error", (err) => fs.rm(destPath, { force: true }, () => reject(err)));
        res.on("error", (err) => {
          file.destroy();
          fs.rm(destPath, { force: true }, () => reject(err));
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

function extractZip(zipPath, destDir) {
  return new Promise((resolve, reject) => {
    // Windows 10+ bsdtar handles zip archives
    const child = spawn("tar", ["-xf", zipPath, "-C", destDir], { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`tar exit ${code}`))));
  });
}

function createPackStore({ packDir, onEvent }) {
  let busy = false;

  function emit(type, payload = {}) {
    try { onEvent?.({ type, ...payload }); } catch { /* renderer gone */ }
  }

  function getState() {
    try {
      const file = path.join(packDir, "manifest.json");
      if (!fs.existsSync(file)) return { installed: false, busy };
      const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
      return { installed: true, busy, ...manifest };
    } catch {
      return { installed: false, busy };
    }
  }

  async function install() {
    if (busy) return { ok: false, error: "already retrieving" };
    busy = true;
    emit("pack-downloading", {});
    try {
      const release = await httpGetJson(RELEASES_URL);
      const asset = (release.assets || []).find((a) => a.name === ASSET_NAME);
      if (!asset?.browser_download_url) throw new Error("no broadcast pack on the grid");

      const zipPath = path.join(packDir, "..", "broadcast-pack.zip.part");
      fs.mkdirSync(path.dirname(zipPath), { recursive: true });
      await download(asset.browser_download_url, zipPath);

      fs.rmSync(packDir, { recursive: true, force: true });
      fs.mkdirSync(packDir, { recursive: true });
      await extractZip(zipPath, packDir);
      fs.rmSync(zipPath, { force: true });

      if (!fs.existsSync(path.join(packDir, "manifest.json"))) throw new Error("pack manifest missing");
      emit("pack-ready", {});
      return { ok: true, state: getState() };
    } catch (err) {
      emit("pack-failed", { error: String(err.message || err) });
      return { ok: false, error: String(err.message || err) };
    } finally {
      busy = false;
    }
  }

  return { getState, install };
}

module.exports = { createPackStore };
