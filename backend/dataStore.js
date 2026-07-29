const { createJsonStore } = require("./configStore");

/**
 * Named JSON data stores for the Cerberus systems (personnel, missions,
 * research, comms, security). Each lives in its own file next to config.json
 * and ships with seed content so the apps feel alive on first boot.
 */

const SEEDS = {
  personnel: {
    records: [
      {
        id: "p1",
        name: "M. KANE",
        clearance: "LEVEL 5 :: OMEGA",
        status: "ACTIVE",
        photo: "",
        assignments: "HOST NODE CUSTODIAN, VAULT PRIME",
        associates: "R. VOSS, FIELD UNIT 7",
        skills: "ARCHIVAL SYSTEMS, HAM RADIO, WATER PURIFICATION",
        history: "Founding operator of the Cerberus archive. Present at first light.",
        updatedAt: 0
      },
      {
        id: "p2",
        name: "R. VOSS",
        clearance: "LEVEL 3",
        status: "ACTIVE",
        photo: "",
        assignments: "FIELD TERMINAL RELAY, PERIMETER SWEEPS",
        associates: "M. KANE",
        skills: "ELECTRONICS REPAIR, FORAGING, FIRST AID",
        history: "Recruited after the second brownout. Maintains the LAN relay ring.",
        updatedAt: 0
      },
      {
        id: "p3",
        name: "SUBJECT [REDACTED]",
        clearance: "LEVEL 1 :: PROVISIONAL",
        status: "UNKNOWN",
        photo: "",
        assignments: "[REDACTED]",
        associates: "[REDACTED]",
        skills: "UNVERIFIED",
        history: "File recovered from a water-damaged drive. Identity unconfirmed.",
        updatedAt: 0
      }
    ]
  },
  missions: {
    records: [
      {
        id: "m1",
        codename: "OPERATION LONG WINTER",
        status: "active",
        location: "GRID SECTOR 7, NORTH RIDGE",
        description: "Stage the archive host and confirm every field terminal in the shelter ring can reach it without grid power.",
        personnel: "M. KANE, R. VOSS",
        objectives: [
          { text: "Host node on battery + inverter for 24h", done: true },
          { text: "All field terminals paired and cleared", done: false },
          { text: "Full vault mirror to cold drive", done: false }
        ],
        attachments: [],
        updatedAt: 0
      },
      {
        id: "m2",
        codename: "OPERATION QUIET SHELF",
        status: "completed",
        location: "VAULT PRIME",
        description: "Catalogue the prepper library and field manuals into the standard archive folders.",
        personnel: "M. KANE",
        objectives: [
          { text: "Provision standard folder tree", done: true },
          { text: "Sort survival manuals by branch", done: true }
        ],
        attachments: [],
        updatedAt: 0
      },
      {
        id: "m3",
        codename: "OPERATION EMBER",
        status: "archived",
        location: "[REDACTED]",
        description: "Details sealed under crimson protocol. Access requires OMEGA clearance.",
        personnel: "[REDACTED]",
        objectives: [{ text: "[REDACTED]", done: true }],
        attachments: [],
        updatedAt: 0
      }
    ]
  },
  research: {
    records: [
      {
        id: "r1",
        category: "biological",
        title: "WATERBORNE PATHOGEN FIELD GUIDE",
        classification: "RESTRICTED",
        body: "Boil advisory thresholds, filtration media comparisons, and symptom onset tables for the six most common post-grid pathogens.",
        attachments: [],
        updatedAt: 0
      },
      {
        id: "r2",
        category: "weapons",
        title: "IMPROVISED DEFENSE SURVEY",
        classification: "CONFIDENTIAL",
        body: "Inventory of shelter-legal deterrents and maintenance schedules. See armory SOP in the Disaster Protocol Binder.",
        attachments: [],
        updatedAt: 0
      },
      {
        id: "r3",
        category: "technology",
        title: "LOW-POWER MESH RELAY NOTES",
        classification: "OPEN",
        body: "Test log for the battery LAN ring: consumption per node, antenna placement, and cold weather failure modes.",
        attachments: [],
        updatedAt: 0
      },
      {
        id: "r4",
        category: "artifacts",
        title: "RECOVERED MEDIA CACHE 001",
        classification: "RESTRICTED",
        body: "Salvaged drive platter, partially readable. Recovered fragments filed under 06) Important Identification Documents.",
        attachments: [],
        updatedAt: 0
      },
      {
        id: "r5",
        category: "experiments",
        title: "PANTRY ROTATION TRIAL B",
        classification: "OPEN",
        body: "90 day staple rotation using the Fallout Shelter Protocol schedule. Spoilage down 40 percent against control shelf.",
        attachments: [],
        updatedAt: 0
      }
    ]
  },
  comms: {
    emails: [
      {
        id: "e1",
        from: "VAULT PRIME",
        to: "ALL STATIONS",
        subject: "ARCHIVE NODE ONLINE",
        body: "Cerberus host node is live on the shelter LAN. Pair your field terminals and verify vault access. The grid is not coming back tonight; the archive is.",
        time: 0,
        read: true
      },
      {
        id: "e2",
        from: "R. VOSS",
        to: "VAULT PRIME",
        subject: "RELAY RING CHECK",
        body: "North relay holding at full signal. South antenna needs a re-aim after the wind. Will patch it at first light.",
        time: 0,
        read: true
      },
      {
        id: "e3",
        from: "[UNKNOWN ORIGIN]",
        to: "ANY RECEIVER",
        subject: "?????",
        body: "if you can read this the mesh is wider than we thought. do not answer on open channels. [MESSAGE FRAGMENT ENDS]",
        time: 0,
        read: false
      }
    ],
    intercepts: [
      {
        id: "i1",
        source: "SHORTWAVE 7.055 MHz",
        heard: "\"...repeat, the pass is CLEAR until the thaw. Bring the [REDACTED] and nothing else. Out.\"",
        time: 0
      },
      {
        id: "i2",
        source: "SCANNER :: CH 12",
        heard: "Automated beacon, repeating station ID every 90 seconds. No voice traffic. Signal bearing roughly north-northeast.",
        time: 0
      }
    ],
    stations: [
      { id: "s1", name: "VAULT PRIME LOOP", freq: "88.1 FM", note: "Archive announcements", file: "" },
      { id: "s2", name: "EMERGENCY BROADCAST", freq: "162.550 WX", note: "NOAA weather (when the towers hold)", file: "" },
      { id: "s3", name: "POLICE SCANNER", freq: "CH 12", note: "County dispatch, encrypted since the event", file: "" },
      { id: "s4", name: "NUMBERS STATION", freq: "7.055 SW", note: "Five-digit groups, source unknown", file: "" },
      { id: "s5", name: "DEAD AIR", freq: "104.7 FM", note: "Carrier only. Somebody left the transmitter on.", file: "" }
    ]
  },
  security: {
    doors: [
      { id: "d1", name: "MAIN BLAST DOOR", sealed: true },
      { id: "d2", name: "NORTH AIRLOCK", sealed: true },
      { id: "d3", name: "SOUTH AIRLOCK", sealed: true },
      { id: "d4", name: "ARMORY", sealed: true },
      { id: "d5", name: "PANTRY COLD STORE", sealed: false },
      { id: "d6", name: "COMMS MAST HATCH", sealed: true }
    ],
    alarm: "green",
    log: [
      { time: 0, text: "SECURITY CONSOLE INITIALIZED", level: "info" },
      { time: 0, text: "ALL DOOR SENSORS REPORTING", level: "info" },
      { time: 0, text: "PERIMETER SWEEP :: NO CONTACTS", level: "info" }
    ]
  }
};

const STORE_NAMES = Object.keys(SEEDS);
const stores = {};

function storeFor(name) {
  if (!STORE_NAMES.includes(name)) throw new Error(`Unknown data store: ${name}`);
  if (!stores[name]) {
    stores[name] = createJsonStore(`data-${name}.json`, SEEDS[name]);
  }
  return stores[name];
}

function getData(name) {
  return storeFor(name).read();
}

function saveData(name, value) {
  const store = storeFor(name);
  const merged = { ...SEEDS[name], ...(value || {}) };
  store.write(merged);
  return merged;
}

module.exports = { getData, saveData, STORE_NAMES };
