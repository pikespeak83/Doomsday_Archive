const fs = require("fs");
const path = require("path");
const https = require("https");
const { spawn } = require("child_process");
const { app, dialog } = require("electron");

const RELEASES_URL = "https://api.github.com/repos/pikespeak83/Doomsday_Archive/releases/latest";
const USER_AGENT = "doomsday-archive-updater";

/**
 * Grid-up bonus: when the app opens and the internet happens to exist, check
 * the GitHub repo for a newer release and offer to install it. When the grid
 * is down (or the repo has no releases) every step fails silently and the
 * app carries on fully offline.
 */
function createUpdater({ assetPrefix, currentVersion, onEvent }) {
  let busy = false;

  function emit(type, payload = {}) {
    try {
      onEvent?.({ type, ...payload });
    } catch {
      // renderer gone
    }
  }

  function httpGetJson(url, timeoutMs = 6000) {
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
        { headers: { "User-Agent": USER_AGENT, Accept: "application/octet-stream" }, timeout: 30000 },
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
          file.on("error", (err) => {
            fs.rm(destPath, { force: true }, () => reject(err));
          });
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

  function isNewer(remote, local) {
    const a = String(remote).replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
    const b = String(local).replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < 3; i += 1) {
      if ((a[i] || 0) > (b[i] || 0)) return true;
      if ((a[i] || 0) < (b[i] || 0)) return false;
    }
    return false;
  }

  /** Windows ships setup exes, Linux ships AppImages. */
  function assetExt() {
    return process.platform === "linux" ? ".AppImage" : ".exe";
  }

  /**
   * Windows hands off to the setup exe. On Linux the AppImage is the app, so
   * the new file is renamed over the running one (the kernel keeps the old
   * inode alive until exit) and the node relaunches from it.
   */
  function installAndRestart(destPath) {
    if (process.platform !== "linux") {
      const child = spawn(destPath, [], { detached: true, stdio: "ignore" });
      child.unref();
      setTimeout(() => app.quit(), 400);
      return;
    }
    fs.chmodSync(destPath, 0o755);
    const current = process.env.APPIMAGE;
    if (current) {
      fs.renameSync(destPath, current);
      app.relaunch({ execPath: current });
      setTimeout(() => app.quit(), 400);
      return;
    }
    // not running from an AppImage (unpacked or deb install): leave the file
    dialog.showMessageBox({
      type: "info",
      title: "TRANSFER COMPLETE",
      message: "UPDATE RETRIEVED.",
      detail: `The new node image is at ${destPath}. This install was not launched from an AppImage, so swap it in by hand.`,
      buttons: ["ACKNOWLEDGED"],
      noLink: true
    });
  }

  async function runCheck(parentWindow, manual) {
    if (busy) return { status: "busy" };
    if (!app.isPackaged && !manual) return { status: "dev" };
    busy = true;
    try {
      let release;
      try {
        release = await httpGetJson(RELEASES_URL);
      } catch {
        return { status: "offline" };
      }
      const remoteVersion = String(release.tag_name || release.name || "").trim();
      if (!remoteVersion || !isNewer(remoteVersion, currentVersion)) {
        return { status: "current", remoteVersion: remoteVersion || null };
      }
      if (!app.isPackaged) return { status: "dev", remoteVersion };

      const asset = (release.assets || []).find(
        (a) => a.name?.startsWith(assetPrefix) && a.name.endsWith(assetExt())
      );
      if (!asset?.browser_download_url) return { status: "current", remoteVersion };

      emit("update-found", { version: remoteVersion });
      const { response } = await dialog.showMessageBox(parentWindow, {
        type: "info",
        title: "INCOMING TRANSMISSION",
        message: `ARCHIVE UPDATE ${remoteVersion.toUpperCase()} DETECTED ON THE GRID.`,
        detail: "Retrieve and install now? The node restarts when the transfer completes. If the grid drops mid-transfer, nothing changes.",
        buttons: ["RETRIEVE + INSTALL", "NOT NOW"],
        defaultId: 0,
        cancelId: 1,
        noLink: true
      });
      if (response !== 0) {
        emit("update-skipped", { version: remoteVersion });
        return { status: "skipped", remoteVersion };
      }

      emit("update-downloading", { version: remoteVersion });
      const destPath = path.join(app.getPath("temp"), asset.name);
      await download(asset.browser_download_url, destPath);

      emit("update-ready", { version: remoteVersion });
      installAndRestart(destPath);
      return { status: "installing", remoteVersion };
    } catch {
      return { status: "offline" };
    } finally {
      busy = false;
    }
  }

  async function checkOnLaunch(parentWindow) {
    // silent on every failure path: grid-down is the normal state
    await runCheck(parentWindow, false);
  }

  function checkNow(parentWindow) {
    return runCheck(parentWindow, true);
  }

  return { checkOnLaunch, checkNow };
}

module.exports = { createUpdater };
