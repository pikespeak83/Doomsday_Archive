const path = require("path");
const fs = require("fs");
const os = require("os");
const { Readable } = require("stream");
const { execFile } = require("child_process");
const { app, BrowserWindow, Menu, Notification, Tray, dialog, ipcMain, protocol, shell } = require("electron");
const { readConfig, writeConfig } = require("../backend/configStore");
const { createLanServer } = require("../backend/lanServer");
const { createResponder } = require("../backend/discovery");
const { createUpdater } = require("../backend/updater");
const { createPackStore } = require("../backend/packStore");
const { listVirtual, resolveVirtual, sourceStats, kindOf } = require("../backend/archiveStore");
const vaultOps = require("../backend/vaultOps");
const { hashPassword, verifyPassword } = require("../backend/passwordStore");
const { getData, saveData } = require("../backend/dataStore");
const { searchArchive } = require("../backend/archiveSearch");
const { provisionStandardFolders } = require("../backend/provision");
const { seedRecords } = require("../backend/seedArchive");

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

// vault:// streams media from linked sources; dabg:// serves the custom backdrop.
protocol.registerSchemesAsPrivileged([
  { scheme: "vault", privileges: { stream: true, supportFetchAPI: true, bypassCSP: true } },
  { scheme: "dabg", privileges: { stream: true, bypassCSP: true } }
]);

const APP_DISPLAY_NAME = "Doomsday Archive";
app.setName(APP_DISPLAY_NAME);
if (process.platform === "win32") {
  app.setAppUserModelId("com.pikespeak83.doomsdayarchive");
}

// Capture the real userData root FIRST: setPath("cache") below re-derives
// userData under the temp profile, which would drag every data dir with it.
const userDataDir = app.getPath("userData");

// Temp-based profile dir avoids cache write issues on some Windows setups.
const profileDir = path.join(app.getPath("temp"), "doomsday-archive-profile");
const cacheDir = path.join(profileDir, "cache");
fs.mkdirSync(cacheDir, { recursive: true });
app.setPath("sessionData", path.join(profileDir, "session"));
app.setPath("cache", cacheDir);
app.commandLine.appendSwitch("disk-cache-dir", cacheDir);

let mainWindow = null;
let updater = null;
let tray = null;
let currentConfig = readConfig();
let isQuitting = false;
let vaultUnlocked = false;
const pkg = require("../package.json");
const appVersion = String(pkg?.version || "0.0.0").trim() || "0.0.0";

function notifyWindows(title, body) {
  if (currentConfig.notificationsEnabled === false) return;
  if (!Notification.isSupported()) return;
  try {
    new Notification({ title, body, icon: path.join(__dirname, "..", "assets", "app-icon.png") }).show();
  } catch {
    // notifications unavailable
  }
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

const lan = createLanServer({
  getConfig: () => currentConfig,
  chatMediaDir: path.join(userDataDir, "chat-media"),
  packDir: path.join(userDataDir, "broadcast-pack"),
  saveDevices: (devices) => {
    currentConfig = { ...currentConfig, approvedDevices: devices };
    writeConfig(currentConfig);
    sendToRenderer("lan:state", lan.getState());
  },
  onEvent: (event) => {
    sendToRenderer("lan:event", event);
    sendToRenderer("lan:state", lan.getState());
    if (event.type === "access-request" && (!mainWindow || !mainWindow.isVisible() || !mainWindow.isFocused())) {
      notifyWindows("Doomsday Archive", `Access request from ${event.device?.name || "unknown device"}`);
    }
  }
});

const discovery = createResponder(() => ({
  port: currentConfig.port,
  running: lan.getState().running,
  version: appVersion
}));

/** Phase 20: keep a seeded CERBERUS RECORDS source so the world has content. */
const recordsBaseDir = path.join(userDataDir, "records");
function ensureRecordsSource() {
  try {
    const recordsDir = recordsBaseDir;
    const audioDir = app.isPackaged
      ? path.join(app.getAppPath(), "dist", "assets", "seed", "audio")
      : path.join(__dirname, "..", "public", "assets", "seed", "audio");
    seedRecords(recordsDir, audioDir);
    const sources = currentConfig.archiveSources || [];
    // Self-heal: earlier builds registered this source under a temp profile path.
    const stale = sources.find(
      (s) => s.label === "CERBERUS RECORDS" && path.resolve(s.path).toLowerCase() !== recordsDir.toLowerCase()
    );
    if (stale) {
      currentConfig = {
        ...currentConfig,
        archiveSources: sources.map((s) => (s.id === stale.id ? { ...s, path: recordsDir } : s))
      };
      writeConfig(currentConfig);
      return;
    }
    const present = sources.some((s) => path.resolve(s.path).toLowerCase() === recordsDir.toLowerCase());
    if (!present) {
      const used = new Set(sources.map((s) => s.id));
      let i = 0;
      while (used.has(`src${i}`)) i += 1;
      currentConfig = {
        ...currentConfig,
        archiveSources: [...sources, { id: `src${i}`, path: recordsDir, label: "CERBERUS RECORDS" }]
      };
      writeConfig(currentConfig);
    }
  } catch (err) {
    console.error("records seed failed:", err);
  }
}

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

  if (!app.isPackaged) {
    // dev aid: report whether the UI actually rendered (visible in the dev terminal)
    mainWindow.webContents.on("did-finish-load", () => {
      let tries = 0;
      const probeOnce = async () => {
        tries += 1;
        try {
          const probe = await mainWindow.webContents.executeJavaScript(
            "(() => ({ topbar: !!document.querySelector('.topbar'), boot: !!document.querySelector('.boot'), icons: document.querySelectorAll('.desk-icon').length, err: window.__lastError || null }))()"
          );
          if ((probe.topbar || probe.err) || tries >= 12) {
            console.log("[ui-probe host]", JSON.stringify(probe));
            return;
          }
          setTimeout(probeOnce, 2500);
        } catch (err) {
          console.log("[ui-probe host] failed:", String(err.message || err));
        }
      };
      setTimeout(probeOnce, 2500);
    });
  }

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5178");
  }

  mainWindow.on("close", (event) => {
    if (currentConfig.runInTray && !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      notifyWindows("Doomsday Archive", "Still transmitting from the tray. The vault stays open.");
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  if (tray) return;
  try {
    tray = new Tray(path.join(__dirname, "..", "assets", "app-icon.ico"));
    tray.setToolTip("Doomsday Archive");
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: "Open Archive Terminal", click: () => wakeWindow() },
      { type: "separator" },
      {
        label: "Quit (stops the uplink)",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]));
    tray.on("double-click", () => wakeWindow());
  } catch {
    tray = null;
  }
}

function destroyTray() {
  tray?.destroy();
  tray = null;
}

function wakeWindow() {
  if (!mainWindow) {
    createMainWindow();
    return;
  }
  mainWindow.show();
  mainWindow.focus();
  sendToRenderer("os:wake", {});
}

/** Stream a vault file with HTTP Range support so video seeking works. */
const MIME_TYPES = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
  bmp: "image/bmp", svg: "image/svg+xml", ico: "image/x-icon", avif: "image/avif",
  mp4: "video/mp4", webm: "video/webm", mkv: "video/x-matroska", mov: "video/quicktime", m4v: "video/mp4", avi: "video/x-msvideo",
  mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav", flac: "audio/flac", m4a: "audio/mp4", opus: "audio/opus",
  txt: "text/plain", md: "text/plain", log: "text/plain", json: "application/json", csv: "text/csv",
  xml: "application/xml", yml: "text/plain", yaml: "text/plain", ini: "text/plain", cfg: "text/plain",
  html: "text/html", htm: "text/html", pdf: "application/pdf"
};

function contentTypeFor(abs) {
  return MIME_TYPES[path.extname(abs).slice(1).toLowerCase()] || "application/octet-stream";
}

function serveVaultFile(request, abs) {
  const stat = fs.statSync(abs);
  if (!stat.isFile()) return new Response("not a file", { status: 400 });
  const type = contentTypeFor(abs);
  const range = request.headers.get("range");
  const total = stat.size;
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    let start = match?.[1] ? parseInt(match[1], 10) : 0;
    let end = match?.[2] ? parseInt(match[2], 10) : total - 1;
    if (Number.isNaN(start) || start < 0) start = 0;
    if (Number.isNaN(end) || end >= total) end = total - 1;
    if (start > end) return new Response(null, { status: 416 });
    return new Response(Readable.toWeb(fs.createReadStream(abs, { start, end })), {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(end - start + 1)
      }
    });
  }
  return new Response(Readable.toWeb(fs.createReadStream(abs)), {
    status: 200,
    headers: { "Content-Type": type, "Content-Length": String(total), "Accept-Ranges": "bytes" }
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
  if ("runInTray" in partial) {
    if (partial.runInTray) createTray();
    else destroyTray();
  }
  if ("startWithPc" in partial) {
    try {
      app.setLoginItemSettings({ openAtLogin: Boolean(partial.startWithPc) });
    } catch {
      // unsupported environment
    }
  }
  return currentConfig;
});

ipcMain.handle("sys:info", () => ({
  hostname: os.hostname(),
  username: os.userInfo().username,
  platform: process.platform,
  version: appVersion,
  interfaces: lan.interfaces()
}));

ipcMain.handle("update:check", () => (updater ? updater.checkNow(mainWindow) : { status: "busy" }));

const packStore = createPackStore({
  packDir: path.join(app.getPath("userData"), "broadcast-pack"),
  onEvent: (event) => sendToRenderer("lan:event", event)
});
ipcMain.handle("pack:state", () => packStore.getState());
ipcMain.handle("pack:install", () => packStore.install());

ipcMain.handle("alert:set", (_e, level) => {
  lan.setAlert(level);
  return lan.getAlert();
});

ipcMain.handle("shell:openExternal", (_e, url) => {
  const target = String(url || "");
  if (!/^https:\/\//i.test(target)) return false;
  shell.openExternal(target);
  return true;
});

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

// ---- vault write operations (host only)

function vaultOp(fn) {
  try {
    return { ok: Boolean(fn()) };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

ipcMain.handle("vault:mkdir", (_e, parentRel, name) =>
  vaultOp(() => vaultOps.makeFolder(currentConfig.archiveSources, parentRel, name)));
ipcMain.handle("vault:newFile", (_e, parentRel, name) =>
  vaultOp(() => vaultOps.makeFile(currentConfig.archiveSources, parentRel, name)));
ipcMain.handle("vault:rename", (_e, relPath, newName) =>
  vaultOp(() => vaultOps.renameEntry(currentConfig.archiveSources, relPath, newName)));
ipcMain.handle("vault:move", (_e, fromRel, toDirRel) =>
  vaultOp(() => vaultOps.moveEntry(currentConfig.archiveSources, fromRel, toDirRel)));
ipcMain.handle("vault:copy", (_e, fromRel, toDirRel) =>
  vaultOp(() => vaultOps.copyEntry(currentConfig.archiveSources, fromRel, toDirRel)));
ipcMain.handle("vault:delete", async (_e, relPath) => {
  try {
    await vaultOps.deleteEntry(currentConfig.archiveSources, relPath);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

// ---- security (vault passphrase)

ipcMain.handle("security:getState", () => ({
  passwordSet: Boolean(currentConfig.passwordHash),
  unlocked: vaultUnlocked || !currentConfig.passwordHash
}));

ipcMain.handle("security:unlock", (_event, password) => {
  const ok = verifyPassword(password, currentConfig.passwordHash, currentConfig.passwordSalt);
  if (ok) vaultUnlocked = true;
  return { ok };
});

ipcMain.handle("security:setPassword", (_event, currentPassword, newPassword) => {
  if (currentConfig.passwordHash &&
      !verifyPassword(currentPassword, currentConfig.passwordHash, currentConfig.passwordSalt)) {
    return { ok: false, error: "current passphrase is wrong" };
  }
  const clean = String(newPassword || "");
  if (clean.length < 4) return { ok: false, error: "passphrase must be at least 4 characters" };
  const { hash, salt } = hashPassword(clean);
  currentConfig = { ...currentConfig, passwordHash: hash, passwordSalt: salt };
  writeConfig(currentConfig);
  vaultUnlocked = true;
  return { ok: true };
});

ipcMain.handle("security:clearPassword", (_event, currentPassword) => {
  if (currentConfig.passwordHash &&
      !verifyPassword(currentPassword, currentConfig.passwordHash, currentConfig.passwordSalt)) {
    return { ok: false, error: "current passphrase is wrong" };
  }
  currentConfig = { ...currentConfig, passwordHash: "", passwordSalt: "" };
  writeConfig(currentConfig);
  vaultUnlocked = true;
  return { ok: true };
});

// ---- cerberus systems (personnel, missions, research, comms, security)

ipcMain.handle("data:get", (_event, name) => {
  try {
    return getData(String(name || ""));
  } catch (err) {
    return { error: String(err.message || err) };
  }
});

ipcMain.handle("data:save", (_event, name, value) => {
  try {
    return saveData(String(name || ""), value);
  } catch (err) {
    return { error: String(err.message || err) };
  }
});

ipcMain.handle("archive:search", (_event, query) => {
  try {
    return searchArchive(currentConfig.archiveSources || [], query);
  } catch (err) {
    return { results: [], truncated: false, error: String(err.message || err) };
  }
});

ipcMain.handle("archive:provision", (_event, sourceId) => {
  try {
    return { ok: true, ...provisionStandardFolders(currentConfig.archiveSources || [], sourceId) };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle("terminal:runBat", (_event, relPath) => {
  return new Promise((resolve) => {
    try {
      const { abs } = resolveVirtual(currentConfig.archiveSources || [], relPath || "");
      const ext = path.extname(abs).toLowerCase();
      if (ext !== ".bat" && ext !== ".cmd") {
        return resolve({ ok: false, error: "only .bat and .cmd files can be executed" });
      }
      if (!fs.existsSync(abs)) return resolve({ ok: false, error: "file not found" });
      execFile(
        "cmd.exe",
        ["/d", "/s", "/c", abs],
        { cwd: path.dirname(abs), timeout: 30000, windowsHide: true, maxBuffer: 512 * 1024 },
        (err, stdout, stderr) => {
          const output = `${stdout || ""}${stderr ? `\n${stderr}` : ""}`.trim();
          resolve({ ok: !err, code: err?.code ?? 0, output: output.slice(0, 20000) });
        }
      );
    } catch (err) {
      resolve({ ok: false, error: String(err.message || err) });
    }
  });
});

ipcMain.handle("personnel:pickPhoto", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Attach a dossier photo",
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"] }]
  });
  if (result.canceled || !result.filePaths?.[0]) return null;
  try {
    const file = result.filePaths[0];
    const stat = fs.statSync(file);
    if (stat.size > 3 * 1024 * 1024) return { error: "photo must be under 3 MB" };
    const ext = path.extname(file).slice(1).toLowerCase();
    const mime = ext === "jpg" ? "jpeg" : ext;
    return { dataUrl: `data:image/${mime};base64,${fs.readFileSync(file).toString("base64")}` };
  } catch (err) {
    return { error: String(err.message || err) };
  }
});

// ---- oracle (offline assistant; local LLM preferred, cloud keys optional)

const ORACLE_URL = "http://127.0.0.1:11434";
const ORACLE_SYSTEM = "You are ORACLE, the terse AI core of an offline doomsday archive vault called Project Cerberus. Answer in short, clipped, terminal-style sentences. Stay in character.";

async function fetchJson(url, options = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function ollamaStatus() {
  try {
    const res = await fetchJson(`${ORACLE_URL}/api/tags`, {}, 1200);
    const models = (res.body.models || []).map((m) => m.name);
    return { online: res.ok && models.length > 0, models };
  } catch {
    return { online: false, models: [] };
  }
}

async function resolveProvider() {
  const pref = currentConfig.aiProvider || "auto";
  const hasOpenai = Boolean(currentConfig.openaiKey);
  const hasGoogle = Boolean(currentConfig.googleKey);
  if (pref === "openai") return hasOpenai ? { provider: "openai" } : { provider: "none", reason: "no OpenAI key" };
  if (pref === "google") return hasGoogle ? { provider: "google" } : { provider: "none", reason: "no Google key" };
  if (pref === "off") return { provider: "none", reason: "disabled" };
  const local = await ollamaStatus();
  if (pref === "ollama") {
    return local.online ? { provider: "ollama", models: local.models } : { provider: "none", reason: "Ollama not running" };
  }
  // auto: local first, then whichever key exists
  if (local.online) return { provider: "ollama", models: local.models };
  if (hasOpenai) return { provider: "openai" };
  if (hasGoogle) return { provider: "google" };
  return { provider: "none", reason: "no local LLM or API keys" };
}

ipcMain.handle("oracle:status", async () => {
  const resolved = await resolveProvider();
  return {
    online: resolved.provider !== "none",
    provider: resolved.provider,
    models: resolved.models || [],
    model:
      resolved.provider === "ollama" ? (resolved.models || [])[0]
      : resolved.provider === "openai" ? (currentConfig.openaiModel || "gpt-4o-mini")
      : resolved.provider === "google" ? (currentConfig.googleModel || "gemini-2.0-flash")
      : "",
    reason: resolved.reason || ""
  };
});

ipcMain.handle("oracle:ask", async (_event, prompt) => {
  const clean = String(prompt || "").slice(0, 4000);
  const resolved = await resolveProvider();
  try {
    if (resolved.provider === "ollama") {
      const res = await fetchJson(`${ORACLE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: (resolved.models || [])[0],
          prompt: clean,
          stream: false,
          options: { num_predict: 400 },
          system: ORACLE_SYSTEM
        })
      });
      if (!res.ok) return { ok: false, error: `Ollama error ${res.status}` };
      return { ok: true, text: String(res.body.response || "").trim(), provider: "ollama" };
    }
    if (resolved.provider === "openai") {
      const model = currentConfig.openaiModel || "gpt-4o-mini";
      const res = await fetchJson("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentConfig.openaiKey}`
        },
        body: JSON.stringify({
          model,
          max_tokens: 500,
          messages: [
            { role: "system", content: ORACLE_SYSTEM },
            { role: "user", content: clean }
          ]
        })
      });
      if (!res.ok) {
        return { ok: false, error: res.body?.error?.message || `OpenAI error ${res.status}` };
      }
      return { ok: true, text: String(res.body.choices?.[0]?.message?.content || "").trim(), provider: "openai" };
    }
    if (resolved.provider === "google") {
      const model = currentConfig.googleModel || "gemini-2.0-flash";
      const res = await fetchJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(currentConfig.googleKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: ORACLE_SYSTEM }] },
            contents: [{ role: "user", parts: [{ text: clean }] }],
            generationConfig: { maxOutputTokens: 500 }
          })
        }
      );
      if (!res.ok) {
        return { ok: false, error: res.body?.error?.message || `Google error ${res.status}` };
      }
      const text = (res.body.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
      return { ok: true, text, provider: "google" };
    }
    return { ok: false, error: resolved.reason || "no AI provider available" };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

// ---- desktop background

ipcMain.handle("settings:pickBackgroundImage", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Choose a desktop backdrop",
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp"] }]
  });
  if (result.canceled || !result.filePaths?.[0]) return null;
  currentConfig = { ...currentConfig, backgroundImage: result.filePaths[0], desktopBackground: "image" };
  writeConfig(currentConfig);
  return currentConfig;
});

// ---- live media feed

ipcMain.handle("feed:start", (_event, relPath) => {
  try {
    const { abs } = resolveVirtual(currentConfig.archiveSources, relPath || "");
    const stat = fs.statSync(abs);
    if (!stat.isFile()) return { ok: false, error: "not a file" };
    const kind = kindOf(path.extname(abs).slice(1));
    if (kind !== "video" && kind !== "audio") {
      return { ok: false, error: "only video or audio can be broadcast" };
    }
    lan.setBroadcast({
      path: String(relPath).replace(/\\/g, "/"),
      name: path.basename(abs),
      kind,
      startedAt: Date.now()
    });
    sendToRenderer("lan:state", lan.getState());
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle("feed:stop", () => {
  lan.setBroadcast(null);
  sendToRenderer("lan:state", lan.getState());
  return { ok: true };
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
  if (currentConfig.runInTray) {
    mainWindow?.hide();
    notifyWindows("Doomsday Archive", "Still transmitting from the tray. The vault stays open.");
    return;
  }
  isQuitting = true;
  mainWindow?.close();
});

// ------------------------------------------------------------------ lifecycle

app.whenReady().then(async () => {
  ensureRecordsSource();
  protocol.handle("vault", (request) => {
    try {
      const url = new URL(request.url);
      const rel = `${url.hostname}${decodeURIComponent(url.pathname)}`;
      const { abs } = resolveVirtual(currentConfig.archiveSources, rel);
      return serveVaultFile(request, abs);
    } catch (err) {
      return new Response(String(err.message || err), { status: 400 });
    }
  });

  protocol.handle("dabg", (request) => {
    try {
      if (!currentConfig.backgroundImage || !fs.existsSync(currentConfig.backgroundImage)) {
        return new Response("no backdrop", { status: 404 });
      }
      return serveVaultFile(request, currentConfig.backgroundImage);
    } catch (err) {
      return new Response(String(err.message || err), { status: 400 });
    }
  });

  createMainWindow();
  discovery.start();
  if (currentConfig.runInTray) createTray();
  try {
    app.setLoginItemSettings({ openAtLogin: Boolean(currentConfig.startWithPc) });
  } catch {
    // unsupported environment
  }
  if (currentConfig.sharingEnabled) {
    await lan.start(currentConfig.port);
  }
  updater = createUpdater({
    assetPrefix: "Doomsday-Archive-Setup",
    currentVersion: appVersion,
    onEvent: (event) => sendToRenderer("lan:event", event)
  });
  void updater.checkOnLaunch(mainWindow);
});

app.on("second-instance", () => {
  wakeWindow();
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (currentConfig.runInTray && !isQuitting) return;
  isQuitting = true;
  discovery.stop();
  destroyTray();
  app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
});
