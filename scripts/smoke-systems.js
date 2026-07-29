const path = require("path");
const fs = require("fs");
const { getData, saveData } = require("../backend/dataStore");
const { searchArchive } = require("../backend/archiveSearch");
const { provisionStandardFolders } = require("../backend/provision");

const p = getData("personnel");
console.log("personnel seeds:", p.records.length);
const m = getData("missions");
console.log("mission seeds:", m.records.length, "active:", m.records.filter((r) => r.status === "active").length);

const tmp = path.join(__dirname, "..", "Temp", "provtest");
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(path.join(tmp, "sub"), { recursive: true });
fs.writeFileSync(path.join(tmp, "sub", "findme_alpha.txt"), "x");
const sources = [{ id: "t0", path: tmp, label: "TEST" }];

const s = searchArchive(sources, "findme");
console.log("search hits:", s.results.length, s.results[0]?.rel);

const prov = provisionStandardFolders(sources, "t0");
console.log("provisioned:", prov.created, "of", prov.total);
const again = provisionStandardFolders(sources, "t0");
console.log("idempotent second run created:", again.created);
console.log("manifest exists:", fs.existsSync(path.join(tmp, "00) ARCHIVE MANIFEST.txt")));

const saved = saveData("security", { ...getData("security"), alarm: "amber" });
console.log("security alarm saved:", saved.alarm);
saveData("security", { ...getData("security"), alarm: "green" });

fs.rmSync(tmp, { recursive: true, force: true });
console.log("BACKEND SMOKE OK");
