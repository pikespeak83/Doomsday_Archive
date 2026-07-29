// Temporary smoke test for the LAN server (run: node scripts/smoke-lan.js)
const { createLanServer } = require("../backend/lanServer");
const { hashPassword } = require("../backend/passwordStore");

const secret = hashPassword("test-pass-123");
const config = {
  approvedDevices: [],
  archiveSources: [{ id: "src0", path: process.cwd(), label: "PROJECT" }],
  port: 8737,
  allowDownloads: true,
  passwordHash: secret.hash,
  passwordSalt: secret.salt
};

const srv = createLanServer({
  getConfig: () => config,
  saveDevices: (devices) => { config.approvedDevices = devices; },
  onEvent: (e) => console.log("EVT", e.type)
});

srv.start(8737).then(async (state) => {
  console.log("started", state.running, "port", state.port);
  const ping = await fetch("http://127.0.0.1:8737/api/ping").then((r) => r.json());
  console.log("ping", JSON.stringify(ping));
  const portal = await fetch("http://127.0.0.1:8737/").then((r) => r.text());
  console.log("portal ok:", portal.includes("DOOMSDAY ARCHIVE"));

  const deviceId = "aaaabbbb-1111-2222-3333-444455556666";
  const badPass = await fetch("http://127.0.0.1:8737/api/access/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, name: "TEST-DEVICE", password: "wrong" })
  });
  console.log("bad passphrase status", badPass.status, (await badPass.json()).status);

  const req = await fetch("http://127.0.0.1:8737/api/access/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, name: "TEST-DEVICE", password: "test-pass-123" })
  }).then((r) => r.json());
  console.log("request", JSON.stringify(req));

  const stateBefore = await fetch(`http://127.0.0.1:8737/api/access/state?deviceId=${deviceId}`).then((r) => r.json());
  console.log("state before approve:", stateBefore.status);

  const dev = srv.approve(deviceId);
  console.log("approved token?", Boolean(dev?.token));

  const stateAfter = await fetch(`http://127.0.0.1:8737/api/access/state?deviceId=${deviceId}`).then((r) => r.json());
  console.log("state after approve:", stateAfter.status, "token match:", stateAfter.token === dev.token);

  const files = await fetch("http://127.0.0.1:8737/api/files?path=", {
    headers: { "x-archive-token": dev.token }
  }).then((r) => r.json());
  console.log("root entries (sources)", files.entries?.length, JSON.stringify(files.entries));

  const inside = await fetch("http://127.0.0.1:8737/api/files?path=src0", {
    headers: { "x-archive-token": dev.token }
  }).then((r) => r.json());
  console.log("src0 entries", inside.entries?.length);

  const noauth = await fetch("http://127.0.0.1:8737/api/files?path=");
  console.log("noauth status", noauth.status);

  const trav = await fetch(
    `http://127.0.0.1:8737/api/download?path=src0%2F..%5C..%5Cwindows%5Cwin.ini&token=${dev.token}`
  );
  console.log("traversal status", trav.status);

  const dl = await fetch(`http://127.0.0.1:8737/api/download?path=src0%2Fpackage.json&token=${dev.token}`);
  console.log("download status", dl.status, "disposition:", dl.headers.get("content-disposition"));

  srv.setBroadcast({ active: true, path: "src0/fake.mp4", name: "fake.mp4", kind: "video", startedAt: Date.now() });
  const feed = await fetch(`http://127.0.0.1:8737/api/broadcast/state?token=${dev.token}`).then((r) => r.json());
  console.log("broadcast active:", feed.active, "kind:", feed.kind, "serverNow:", typeof feed.serverNow);
  srv.setBroadcast(null);
  const feedOff = await fetch(`http://127.0.0.1:8737/api/broadcast/state?token=${dev.token}`).then((r) => r.json());
  console.log("broadcast off:", feedOff.active === false);

  srv.revoke(deviceId);
  const revoked = await fetch("http://127.0.0.1:8737/api/files?path=", {
    headers: { "x-archive-token": dev.token }
  });
  console.log("after revoke status", revoked.status);

  await srv.stop();
  console.log("SMOKE OK");
  process.exit(0);
}).catch((err) => {
  console.error("SMOKE FAIL", err);
  process.exit(1);
});
