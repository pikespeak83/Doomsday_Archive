const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const express = require("express");
const { listDir, resolveSafe, rootStats } = require("./archiveStore");

/**
 * LAN uplink server.
 * Serves the browser portal to other devices in the house over the local
 * network (ethernet, switch, or the host's mobile hotspot). No internet used.
 *
 * Access model:
 *  - a device POSTs /api/access/request with a self-generated deviceId + name
 *  - the host approves or denies it inside the desktop app
 *  - approved devices receive a bearer token, persisted in config
 */
function createLanServer({ getConfig, saveDevices, onEvent }) {
  let server = null;
  let currentPort = null;

  /** deviceId -> { id, name, requestedAt, remote } */
  const pending = new Map();
  /** deviceId -> denial timestamp, cleared on new request after cooldown */
  const denied = new Map();

  const portalHtml = fs.readFileSync(path.join(__dirname, "portal", "index.html"), "utf8");

  function approvedList() {
    return Array.isArray(getConfig().approvedDevices) ? getConfig().approvedDevices : [];
  }

  function findByToken(token) {
    if (!token) return null;
    return approvedList().find((d) => d.token === token) || null;
  }

  function findApproved(deviceId) {
    return approvedList().find((d) => d.id === deviceId) || null;
  }

  function emit(type, payload) {
    try {
      onEvent?.({ type, ...payload });
    } catch {
      // renderer might be gone
    }
  }

  function buildApp() {
    const app = express();
    app.disable("x-powered-by");
    app.use(express.json({ limit: "64kb" }));

    // Static assets (fonts, sounds) for the portal, from dist in prod or public in dev.
    const assetCandidates = [
      path.join(__dirname, "..", "dist", "assets"),
      path.join(__dirname, "..", "public", "assets")
    ];
    for (const dir of assetCandidates) {
      if (fs.existsSync(dir)) {
        app.use("/assets", express.static(dir, { fallthrough: true }));
      }
    }

    app.get("/", (_req, res) => {
      const html = portalHtml
        .replaceAll("__HOST_NAME__", os.hostname())
        .replaceAll("__ARCHIVE_NAME__", "DOOMSDAY ARCHIVE");
      res.type("html").send(html);
    });

    app.get("/api/ping", (_req, res) => {
      res.json({ ok: true, host: os.hostname(), service: "doomsday-archive" });
    });

    app.post("/api/access/request", (req, res) => {
      const deviceId = String(req.body?.deviceId || "").slice(0, 64);
      const name = String(req.body?.name || "").trim().slice(0, 40);
      if (!/^[a-f0-9-]{8,64}$/i.test(deviceId) || !name) {
        return res.status(400).json({ error: "bad request" });
      }
      const existing = findApproved(deviceId);
      if (existing) {
        return res.json({ status: "approved", token: existing.token });
      }
      const deniedAt = denied.get(deviceId);
      if (deniedAt && Date.now() - deniedAt < 15_000) {
        return res.json({ status: "denied" });
      }
      denied.delete(deviceId);
      if (!pending.has(deviceId)) {
        pending.set(deviceId, {
          id: deviceId,
          name,
          requestedAt: Date.now(),
          remote: req.socket.remoteAddress || ""
        });
        emit("access-request", { device: pending.get(deviceId) });
      }
      res.json({ status: "pending" });
    });

    app.get("/api/access/state", (req, res) => {
      const deviceId = String(req.query.deviceId || "");
      const approved = findApproved(deviceId);
      if (approved) {
        approved.lastSeen = Date.now();
        saveDevices(approvedList());
        return res.json({ status: "approved", token: approved.token, host: os.hostname() });
      }
      if (pending.has(deviceId)) return res.json({ status: "pending" });
      if (denied.has(deviceId)) return res.json({ status: "denied" });
      return res.json({ status: "unknown" });
    });

    // Everything below requires an approved token.
    app.use("/api/files", requireToken);
    app.use("/api/download", requireToken);

    function requireToken(req, res, next) {
      const token =
        req.get("x-archive-token") || String(req.query.token || "");
      const device = findByToken(token);
      if (!device) return res.status(401).json({ error: "not approved" });
      device.lastSeen = Date.now();
      req.archiveDevice = device;
      next();
    }

    app.get("/api/files", (req, res) => {
      const cfg = getConfig();
      if (!cfg.archiveRoot) return res.status(503).json({ error: "no storage linked" });
      try {
        const listing = listDir(cfg.archiveRoot, String(req.query.path || ""));
        res.json({ ...listing, allowDownloads: cfg.allowDownloads !== false });
      } catch (err) {
        res.status(400).json({ error: String(err.message || err) });
      }
    });

    app.get("/api/download", (req, res) => {
      const cfg = getConfig();
      if (!cfg.archiveRoot) return res.status(503).json({ error: "no storage linked" });
      if (cfg.allowDownloads === false) return res.status(403).json({ error: "downloads disabled by host" });
      try {
        const abs = resolveSafe(cfg.archiveRoot, String(req.query.path || ""));
        const stat = fs.statSync(abs);
        if (!stat.isFile()) return res.status(400).json({ error: "not a file" });
        const inline = String(req.query.inline || "") === "1";
        if (!inline) {
          res.setHeader(
            "Content-Disposition",
            `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(abs))}`
          );
        }
        emit("download", {
          device: { id: req.archiveDevice.id, name: req.archiveDevice.name },
          file: path.basename(abs)
        });
        // res.sendFile handles Range requests, so audio/video seek works.
        res.sendFile(abs);
      } catch (err) {
        res.status(400).json({ error: String(err.message || err) });
      }
    });

    app.use((_req, res) => res.status(404).json({ error: "not found" }));
    return app;
  }

  function interfaces() {
    const out = [];
    const nets = os.networkInterfaces();
    for (const [name, addrs] of Object.entries(nets)) {
      for (const addr of addrs || []) {
        if (addr.family === "IPv4" && !addr.internal) {
          out.push({ name, address: addr.address });
        }
      }
    }
    return out;
  }

  function start(port) {
    return new Promise((resolve) => {
      if (server) return resolve(getState());
      const app = buildApp();
      const srv = app.listen(port, "0.0.0.0", () => {
        server = srv;
        currentPort = port;
        emit("server", { running: true, port });
        resolve(getState());
      });
      srv.on("error", (err) => {
        emit("server-error", { message: String(err.message || err) });
        server = null;
        currentPort = null;
        resolve(getState());
      });
    });
  }

  function stop() {
    return new Promise((resolve) => {
      if (!server) return resolve(getState());
      server.close(() => {
        server = null;
        currentPort = null;
        emit("server", { running: false });
        resolve(getState());
      });
      // drop keep-alive connections so close() actually finishes
      server.closeAllConnections?.();
    });
  }

  function approve(deviceId) {
    const request = pending.get(deviceId);
    if (!request) return null;
    pending.delete(deviceId);
    denied.delete(deviceId);
    const device = {
      id: request.id,
      name: request.name,
      token: crypto.randomUUID(),
      approvedAt: Date.now(),
      lastSeen: 0
    };
    const list = approvedList().filter((d) => d.id !== deviceId);
    list.push(device);
    saveDevices(list);
    emit("device-approved", { device: { id: device.id, name: device.name } });
    return device;
  }

  function deny(deviceId) {
    pending.delete(deviceId);
    denied.set(deviceId, Date.now());
    emit("device-denied", { deviceId });
  }

  function revoke(deviceId) {
    const list = approvedList().filter((d) => d.id !== deviceId);
    saveDevices(list);
    emit("device-revoked", { deviceId });
  }

  function getState() {
    const cfg = getConfig();
    return {
      running: Boolean(server),
      port: currentPort || cfg.port,
      interfaces: interfaces(),
      pending: [...pending.values()],
      approved: approvedList().map(({ token, ...rest }) => rest),
      archiveRoot: cfg.archiveRoot,
      archiveStats: rootStats(cfg.archiveRoot),
      allowDownloads: cfg.allowDownloads !== false
    };
  }

  return { start, stop, approve, deny, revoke, getState, interfaces };
}

module.exports = { createLanServer };
