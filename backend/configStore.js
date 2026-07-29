const path = require("path");
const fs = require("fs");

function getDataDir() {
  try {
    const { app } = require("electron");
    if (app?.isPackaged) {
      return app.getPath("userData");
    }
  } catch {
    // not running under Electron
  }
  return path.join(__dirname, "..");
}

/** Tiny JSON-file store factory shared by the host and field apps. */
function createJsonStore(fileName, defaults) {
  const filePath = path.join(getDataDir(), fileName);

  function read() {
    if (!fs.existsSync(filePath)) {
      write({ ...defaults });
      return { ...defaults };
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) || {};
      return { ...defaults, ...parsed };
    } catch {
      return { ...defaults };
    }
  }

  function write(config) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");
  }

  return { read, write, filePath };
}

const hostDefaults = {
  /**
   * Storage the vault serves: [{ id, path, label }]. Linking a drive stores
   * "X:\\" so the ENTIRE drive is available, not a sub-folder.
   */
  archiveSources: [],
  /** LAN server port. */
  port: 8737,
  /** When true the LAN uplink starts automatically with the app. */
  sharingEnabled: true,
  /** When false, connected devices can browse but not download. */
  allowDownloads: true,
  uiSoundsEnabled: true,
  bootAnimationEnabled: true,
  /** Devices the host has approved: { id, name, token, approvedAt, lastSeen }. */
  approvedDevices: []
};

const hostStore = createJsonStore("config.json", hostDefaults);

function readConfig() {
  const config = hostStore.read();
  // migrate legacy single-root configs
  if (config.archiveRoot && !config.archiveSources?.length) {
    config.archiveSources = [
      { id: "src0", path: config.archiveRoot, label: config.archiveRoot }
    ];
    delete config.archiveRoot;
    hostStore.write(config);
  }
  return config;
}

function writeConfig(config) {
  hostStore.write(config);
}

module.exports = { createJsonStore, readConfig, writeConfig, hostDefaults };
