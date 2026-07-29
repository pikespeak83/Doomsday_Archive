const dgram = require("dgram");
const os = require("os");

const DISCOVERY_PORT = 8738;
const PROBE = "DA_DISCOVER_V1";

/**
 * Host side: answers UDP broadcast probes so field terminals can find this
 * node with zero configuration and zero internet.
 */
function createResponder(getInfo) {
  let socket = null;

  function start() {
    if (socket) return;
    socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    socket.on("message", (msg, rinfo) => {
      if (msg.toString() !== PROBE) return;
      try {
        const info = getInfo();
        const reply = Buffer.from(
          JSON.stringify({
            service: "doomsday-archive",
            name: os.hostname(),
            port: info.port,
            running: info.running,
            version: info.version || "1.0.0"
          })
        );
        socket.send(reply, rinfo.port, rinfo.address);
      } catch {
        // ignore malformed probes
      }
    });
    socket.on("error", () => {
      try { socket.close(); } catch { /* already closed */ }
      socket = null;
    });
    socket.bind(DISCOVERY_PORT);
  }

  function stop() {
    if (!socket) return;
    try { socket.close(); } catch { /* already closed */ }
    socket = null;
  }

  return { start, stop };
}

/**
 * Client side: broadcast a probe on every interface and collect host replies
 * for `windowMs`. Returns [{ address, name, port, running, version }].
 */
function discoverHosts(windowMs = 1600) {
  return new Promise((resolve) => {
    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    const found = new Map();

    socket.on("message", (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data?.service !== "doomsday-archive") return;
        found.set(`${rinfo.address}:${data.port}`, {
          address: rinfo.address,
          name: data.name,
          port: data.port,
          running: data.running !== false,
          version: data.version
        });
      } catch {
        // not ours
      }
    });

    socket.on("error", () => finish());

    socket.bind(0, () => {
      try {
        socket.setBroadcast(true);
        const probe = Buffer.from(PROBE);
        const targets = new Set(["255.255.255.255"]);
        const nets = os.networkInterfaces();
        for (const addrs of Object.values(nets)) {
          for (const addr of addrs || []) {
            if (addr.family === "IPv4" && !addr.internal) {
              // directed broadcast for each subnet as well
              const parts = addr.address.split(".").map(Number);
              const mask = addr.netmask.split(".").map(Number);
              const bcast = parts.map((p, i) => (p & mask[i]) | (~mask[i] & 255)).join(".");
              targets.add(bcast);
            }
          }
        }
        for (const target of targets) {
          socket.send(probe, DISCOVERY_PORT, target, () => {});
        }
      } catch {
        // some adapters refuse broadcast; the timer still resolves
      }
    });

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      try { socket.close(); } catch { /* already closed */ }
      resolve([...found.values()]);
    }
    setTimeout(finish, windowMs);
  });
}

module.exports = { createResponder, discoverHosts, DISCOVERY_PORT, PROBE };
