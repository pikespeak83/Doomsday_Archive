const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { readConfig, writeConfig } = require("../backend/configStore");
const { createLanServer } = require("../backend/lanServer");
const { createResponder } = require("../backend/discovery");
const { listVirtual, resolveVirtual, sourceStats } = require("../backend/archiveStore");

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

const APP_DISPLAY_NAME = "Doomsday Archive";
app.setName(APP_DISPLAY_NAME);
if (process.platform === "win32") {
  app.setAppUserModelId("com.pikespeak83.doomsdayarchive");
}

// Temp-based profile dir avoids cache write issues on some Windows setups.
const profileDir = path.join(app.getPath("temp"), "doomsday-archive-profile");
const cacheDir = path.join(profileDir, "cache");
fs.mkdirSync(cacheDir, { recursive: true });
app.setPath("sessionData", path.join(profileDir, "session"));
app.setPath("cache", cacheDir);
app.commandLine.appendSwitch("disk-cache-dir", cacheDir);

let mainWindow = null;
let currentConfig = readConfig();
let isQuitting = false;
const pkg = require("../package.json");
const appVersion = String(pkg?.version || "0.0.0").trim() || "0.0.0";

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

const lan = createLanServer({
  getConfig: () => currentConfig,
  saveDevices: (devices) => {
    currentConfig = { ...currentConfig, approvedDevices: devices };
    writeConfig(currentConfig);
    sendToRenderer("lan:state", lan.getState());
  },
  onEvent: (event) => {
    sendToRenderer("lan:event", event);
    sendToRenderer("lan:state", lan.getState());
  }
});

const discovery = createResponder(() => ({
  port: currentConfig.port,
  running: lan.getState().running,
  version: appVersion
}));

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 640,
    frame: false,
    show: false,
    backgroundColor: "#020703",
    icon: path.join(__dirname, "..", "assets", "app-icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5178");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/** List mounted volumes via PowerShell, with a plain drive-letter fallback. */
function listDrives() {
  return new Promise((resolve) => {
    const fallback = () => {
      const drives = [];
      for (let i = 65; i <= 90; i += 1) {
        const letter = String.fromCharCode(i);
        if (fs.existsSync(`${letter}:\\`)) {
          drives.push({ letter, label: "", totalBytes: 0, freeBytes: 0, type: "Unknown" });
        }
      }
      resolve(drives);
    };
    if (process.platform !== "win32") return fallback();
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        "Get-Volume | Where-Object DriveLetter | Select-Object DriveLetter,FileSystemLabel,Size,SizeRemaining,DriveType | ConvertTo-Json -Compress"
      ],
      { timeout: 8000, windowsHide: true },
      (err, stdout) => {
        if (err || !stdout) return fallback();
        try {
          let vols = JSON.parse(stdout);
          if (!Array.isArray(vols)) vols = [vols];
          resolve(
            vols.map((v) => ({
              letter: String(v.DriveLetter || ""),
              label: String(v.FileSystemLabel || ""),
              totalBytes: Number(v.Size || 0),
              freeBytes: Number(v.SizeRemaining || 0),
              type: String(v.DriveType || "")
            }))
          );
        } catch {
          fallback();
        }
      }
    );
  });
}

// ------------------------------------------------------------------ IPC

ipcMain.handle("config:get", () => currentConfig);

ipcMain.handle("config:save", (_event, partial) => {
  currentConfig = { ...currentConfig, ...partial };
  writeConfig(currentConfig);
  return currentConfig;
});

ipcMain.handle("sys:info", () => ({
  hostname: os.hostname(),
  username: os.userInfo().username,
  platform: process.platform,
  version: appVersion,
  interfaces: lan.interfaces()
}));

ipcMain.handle("archive:pickFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Link storage to the Doomsday Archive",
    properties: ["openDirectory"]
  });
  if (result.canceled || !result.filePaths?.[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle("archive:listDrives", () => listDrives());

function nextSourceId() {
  const used = new Set((currentConfig.archiveSources || []).map((s) => s.id));
  let i = 0;
  while (used.has(`src${i}`)) i += 1;
  return `src${i}`;
}

function addSource(sourcePath, label) {
  const sources = [...(currentConfig.archiveSources || [])];
  if (sources.some((s) => path.resolve(s.path).toLowerCase() === path.resolve(sourcePath).toLowerCase())) {
    return currentConfig;
  }
  sources.push({ id: nextSourceId(), path: sourcePath, label: label || sourcePath });
  currentConfig = { ...currentConfig, archiveSources: sources };
  writeConfig(currentConfig);
  sendToRenderer("lan:state", lan.getState());
  return currentConfig;
}

ipcMain.handle("archive:addDrive", (_event, letter, label) => {
  const clean = String(letter || "").replace(/[^a-z]/gi, "").toUpperCase().slice(0, 1);
  if (!clean) return currentConfig;
  return addSource(`${clean}:\\`, label ? `${clean}: ${label}` : `${clean}: DRIVE`);
});

ipcMain.handle("archive:addFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Link a folder to the vault",
    properties: ["openDirectory"]
  });
  if (result.canceled || !result.filePaths?.[0]) return currentConfig;
  const folder = result.filePaths[0];
  return addSource(folder, folder);
});

ipcMain.handle("archive:removeSource", (_event, sourceId) => {
  const sources = (currentConfig.archiveSources || []).filter((s) => s.id !== sourceId);
  currentConfig = { ...currentConfig, archiveSources: sources };
  writeConfig(currentConfig);
  sendToRenderer("lan:state", lan.getState());
  return currentConfig;
});

ipcMain.handle("archive:browse", (_event, relPath) => {
  if (!currentConfig.archiveSources?.length) {
    return { path: "", entries: [], error: "no storage linked" };
  }
  try {
    return listVirtual(currentConfig.archiveSources, relPath || "");
  } catch (err) {
    return { path: "", entries: [], error: String(err.message || err) };
  }
});

ipcMain.handle("archive:stats", () => sourceStats(currentConfig.archiveSources));

ipcMain.handle("archive:openFile", (_event, relPath) => {
  try {
    const { abs } = resolveVirtual(currentConfig.archiveSources, relPath || "");
    shell.openPath(abs);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("lan:getState", () => lan.getState());

ipcMain.handle("lan:setSharing", async (_event, enabled) => {
  currentConfig = { ...currentConfig, sharingEnabled: Boolean(enabled) };
  writeConfig(currentConfig);
  if (enabled) await lan.start(currentConfig.port);
  else await lan.stop();
  return lan.getState();
});

ipcMain.handle("lan:restart", async () => {
  await lan.stop();
  if (currentConfig.sharingEnabled) await lan.start(currentConfig.port);
  return lan.getState();
});

ipcMain.handle("devices:approve", (_event, deviceId) => {
  lan.approve(deviceId);
  return lan.getState();
});

ipcMain.handle("devices:deny", (_event, deviceId) => {
  lan.deny(deviceId);
  return lan.getState();
});

ipcMain.handle("devices:revoke", (_event, deviceId) => {
  lan.revoke(deviceId);
  return lan.getState();
});

ipcMain.handle("portal:qr", async (_event, url) => {
  try {
    const QRCode = require("qrcode");
    return await QRCode.toDataURL(url, {
      margin: 1,
      color: { dark: "#7dff3fff", light: "#02070300" }
    });
  } catch {
    return null;
  }
});

ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle("window:close", () => {
  isQuitting = true;
  mainWindow?.close();
});

// ------------------------------------------------------------------ lifecycle

app.whenReady().then(async () => {
  createMainWindow();
  discovery.start();
  if (currentConfig.sharingEnabled) {
    await lan.start(currentConfig.port);
  }
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  isQuitting = true;
  discovery.stop();
  app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
});
