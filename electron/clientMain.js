const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { createJsonStore } = require("../backend/configStore");
const { discoverHosts } = require("../backend/discovery");
const { createUpdater } = require("../backend/updater");

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

const APP_DISPLAY_NAME = "Doomsday Field Terminal";
app.setName(APP_DISPLAY_NAME);
if (process.platform === "win32") {
  app.setAppUserModelId("com.pikespeak83.doomsdayfield");
}

const profileDir = path.join(app.getPath("temp"), "doomsday-field-profile");
const cacheDir = path.join(profileDir, "cache");
fs.mkdirSync(cacheDir, { recursive: true });
app.setPath("sessionData", path.join(profileDir, "session"));
app.setPath("cache", cacheDir);
app.commandLine.appendSwitch("disk-cache-dir", cacheDir);

const fieldDefaults = {
  deviceId: "",
  deviceName: os.hostname(),
  hostAddress: "",
  hostPort: 8737,
  token: "",
  uiSoundsEnabled: true,
  bootAnimationEnabled: true
};

const store = createJsonStore("field-config.json", fieldDefaults);
let currentConfig = store.read();
if (!currentConfig.deviceId) {
  currentConfig = { ...currentConfig, deviceId: crypto.randomUUID() };
  store.write(currentConfig);
}

let mainWindow = null;
const pkg = require("../package.json");
const appVersion = String(pkg?.version || "0.0.0").trim() || "0.0.0";

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 940,
    minHeight: 620,
    frame: false,
    show: false,
    backgroundColor: "#020703",
    icon: path.join(__dirname, "..", "assets", "app-icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "clientPreload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  if (!app.isPackaged) {
    // dev aid: report whether the UI actually rendered (visible in the dev terminal)
    mainWindow.webContents.on("did-finish-load", () => {
      setTimeout(async () => {
        try {
          const probe = await mainWindow.webContents.executeJavaScript(
            "(() => ({ topbar: !!document.querySelector('.topbar'), boot: !!document.querySelector('.boot'), connect: !!document.querySelector('.connect-wrap'), err: window.__lastError || null }))()"
          );
          console.log("[ui-probe field]", JSON.stringify(probe));
        } catch (err) {
          console.log("[ui-probe field] failed:", String(err.message || err));
        }
      }, 2500);
    });
  }

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "client.html"));
  } else {
    mainWindow.loadURL("http://localhost:5178/client.html");
  }

  // stream downloads into Downloads/Doomsday Archive with progress events
  mainWindow.webContents.session.on("will-download", (_event, item) => {
    const dir = path.join(app.getPath("downloads"), "Doomsday Archive");
    fs.mkdirSync(dir, { recursive: true });
    const savePath = uniquePath(dir, item.getFilename());
    item.setSavePath(savePath);
    const file = path.basename(savePath);
    item.on("updated", (_e, state) => {
      sendToRenderer("field:download", {
        file,
        state,
        received: item.getReceivedBytes(),
        total: item.getTotalBytes()
      });
    });
    item.once("done", (_e, state) => {
      sendToRenderer("field:download", {
        file,
        state,
        received: item.getReceivedBytes(),
        total: item.getTotalBytes(),
        done: true,
        path: savePath
      });
    });
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function uniquePath(dir, name) {
  let candidate = path.join(dir, name);
  if (!fs.existsSync(candidate)) return candidate;
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  let i = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${base} (${i})${ext}`);
    i += 1;
  }
  return candidate;
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

// ------------------------------------------------------------------ IPC

ipcMain.handle("config:get", () => currentConfig);

ipcMain.handle("config:save", (_event, partial) => {
  currentConfig = { ...currentConfig, ...partial };
  store.write(currentConfig);
  return currentConfig;
});

ipcMain.handle("sys:info", () => ({
  hostname: os.hostname(),
  username: os.userInfo().username,
  platform: process.platform,
  version: appVersion
}));

ipcMain.handle("field:discover", async () => discoverHosts(1800));

ipcMain.handle("field:download", (_event, url) => {
  if (!/^http:\/\/[a-z0-9.\-:]+\/api\/download\?/i.test(String(url))) return false;
  mainWindow?.webContents.downloadURL(String(url));
  return true;
});

ipcMain.handle("field:openDownloads", () => {
  const dir = path.join(app.getPath("downloads"), "Doomsday Archive");
  fs.mkdirSync(dir, { recursive: true });
  shell.openPath(dir);
  return true;
});

ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle("window:close", () => mainWindow?.close());

// ------------------------------------------------------------------ lifecycle

app.whenReady().then(() => {
  createMainWindow();
  const updater = createUpdater({
    assetPrefix: "Doomsday-Field-Terminal-Setup",
    currentVersion: appVersion,
    onEvent: (event) => sendToRenderer("field:update", event)
  });
  void updater.checkOnLaunch(mainWindow);
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
