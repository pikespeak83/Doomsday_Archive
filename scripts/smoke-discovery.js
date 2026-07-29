// Quick discovery loopback test (run: node scripts/smoke-discovery.js)
const d = require("../backend/discovery");

const responder = d.createResponder(() => ({ port: 8737, running: true, version: "1.0.0" }));
responder.start();

setTimeout(async () => {
  const hosts = await d.discoverHosts(1500);
  console.log("DISCOVERED:", JSON.stringify(hosts));
  responder.stop();
  process.exit(hosts.length ? 0 : 1);
}, 400);
