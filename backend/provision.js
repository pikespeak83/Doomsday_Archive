const path = require("path");
const fs = require("fs");
const { resolveVirtual } = require("./archiveStore");

/**
 * Provisions the standard Doomsday Archive folder taxonomy (roadmap phase 8)
 * into a linked source, plus a manifest so the layout is self-describing.
 */

const TAXONOMY = [
  "01) Before and During the Collapse/Emergency Binder",
  "01) Before and During the Collapse/Emergency Survival Videos",
  "01) Before and During the Collapse/Prepper Library",
  "02) After the Collapse/Rebuilding Civilization Videos",
  "02) After the Collapse/Rebuilding Civilization 101",
  "03) Emergency Preparedness Documents, Field Manuals, And How To's/Emergency Disasters/Man Made Disasters",
  "03) Emergency Preparedness Documents, Field Manuals, And How To's/Emergency Disasters/Misc. Disaster Documents",
  "03) Emergency Preparedness Documents, Field Manuals, And How To's/Emergency Disasters/Natural Disasters",
  "03) Emergency Preparedness Documents, Field Manuals, And How To's/Emergency Preparedness - Quick Guides & Checklists",
  "03) Emergency Preparedness Documents, Field Manuals, And How To's/Survival Field Manuals/Basic Civil Field Manuals",
  "03) Emergency Preparedness Documents, Field Manuals, And How To's/Survival Field Manuals/U.S. Army, Navy, Airforce, Special Ops Field Manuals",
  "03) Emergency Preparedness Documents, Field Manuals, And How To's/Survival Field Manuals/Pocket Guides",
  "04) Disaster Protocol Binder/Section #1 - Evacuation Plan",
  "04) Disaster Protocol Binder/Section #2 - Personal Documents",
  "04) Disaster Protocol Binder/Section #3 - Vital Documents",
  "04) Disaster Protocol Binder/Section #4 - Financial Documents",
  "04) Disaster Protocol Binder/Section #5 - Insurance Documents",
  "04) Disaster Protocol Binder/Section #6 - Standard Operating Procedures (SOP's)",
  "04) Disaster Protocol Binder/Section #7 - Checklists and Guides",
  "04) Disaster Protocol Binder/Section #8 - Vital Information Cards",
  "05) Fallout Shelter Protocol/Nuclear How To's and Manuals",
  "05) Fallout Shelter Protocol/Pantry Food Stock and Rotation Schedule",
  "05) Fallout Shelter Protocol/Storm - Fallout Shelter Videos",
  "05) Fallout Shelter Protocol/Protocols To Be Followed",
  "06) Important Identification Documents - Family Pictures/Family Pictures",
  "06) Important Identification Documents - Family Pictures/Headshots Of Family Members",
  "06) Important Identification Documents - Family Pictures/Important Documents",
  "07) SOP's and Checklists",
  "08) Disaster Forms 2025/Emergency - Evacuation Documents",
  "08) Disaster Forms 2025/ICS 200 forms",
  "08) Disaster Forms 2025/Incident Command System Setup"
];

const MANIFEST_NAME = "00) ARCHIVE MANIFEST.txt";

function provisionStandardFolders(sources, sourceId) {
  const { abs: rootAbs } = resolveVirtual(sources, sourceId);
  if (!fs.existsSync(rootAbs)) throw new Error("Source is offline");
  let created = 0;
  for (const rel of TAXONOMY) {
    const target = path.join(rootAbs, ...rel.split("/"));
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
      created += 1;
    }
  }
  const manifestPath = path.join(rootAbs, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) {
    const lines = [
      "DOOMSDAY ARCHIVE :: STANDARD FOLDER MANIFEST",
      "Provisioned by Project Cerberus host node.",
      "",
      "Layout:",
      ...TAXONOMY.map((t) => `  ${t.replace(/\//g, " \\ ")}`),
      "",
      "Drop documents, manuals, videos, and pictures into the matching folders.",
      "Keep metadata JSON files beside media so the archive stays self-describing."
    ];
    fs.writeFileSync(manifestPath, lines.join("\r\n"), "utf8");
    created += 1;
  }
  const metaPath = path.join(rootAbs, "archive-manifest.json");
  if (!fs.existsSync(metaPath)) {
    fs.writeFileSync(metaPath, JSON.stringify({
      schema: "doomsday-archive/1",
      provisionedAt: new Date().toISOString(),
      folders: TAXONOMY
    }, null, 2), "utf8");
    created += 1;
  }
  return { created, total: TAXONOMY.length };
}

module.exports = { provisionStandardFolders, TAXONOMY };
