const path = require("path");
const fs = require("fs");

function getConfigPath() {
  try {
    const { app } = require("electron");
    if (app?.isPackaged) {
      return path.join(app.getPath("userData"), "config.json");
    }
  } catch {
    // not running under Electron
  }
  return path.join(process.cwd(), "config.json");
}

const defaultConfig = {
  /** Absolute path of the linked storage device or folder the archive serves from. */
  archiveRoot: "",
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

function readConfig() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    writeConfig(defaultConfig);
    return { ...defaultConfig };
  }
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw) || {};
    return { ...defaultConfig, ...parsed };
  } catch {
    return { ...defaultConfig };
  }
}

function writeConfig(config) {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

module.exports = { readConfig, writeConfig, defaultConfig, getConfigPath };
