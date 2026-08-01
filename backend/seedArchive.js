const path = require("path");
const fs = require("fs");

/**
 * Phase 20: populate the archive. Seeds an in-universe "CERBERUS RECORDS"
 * tree (intelligence, dossiers, personnel, imagery, audio logs, briefings,
 * maps, schematics, memos, redacted files, timelines) so the OS feels like
 * a living world on first boot. Existing files are never overwritten; users
 * drop their own media into the same folders beside the metadata JSON.
 */

const SEED_VERSION = 1;
const MARKER = ".cerberus-seed.json";

/* ------------------------------------------------ svg helpers */

function svgShell(title, body) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640">',
    '<rect width="960" height="640" fill="#04120a"/>',
    '<g stroke="#1e4d2e" stroke-width="1" opacity="0.55">',
    ...Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${(i + 1) * 40}" x2="960" y2="${(i + 1) * 40}"/>`),
    ...Array.from({ length: 23 }, (_, i) => `<line x1="${(i + 1) * 40}" y1="0" x2="${(i + 1) * 40}" y2="640"/>`),
    "</g>",
    body,
    `<text x="16" y="28" fill="#b6ff6a" font-family="Consolas,monospace" font-size="18" letter-spacing="3">${title}</text>`,
    '<rect x="8" y="8" width="944" height="624" fill="none" stroke="#4f9a52" stroke-width="2"/>',
    "</svg>"
  ].join("\n");
}

const MONO = 'font-family="Consolas,monospace"';

function satFrame({ frame, sub, extras }) {
  return svgShell(`CLASSIFIED//ORBITAL :: CERBERUS-2 PASS ${frame}`, [
    // coastline-ish landmass
    '<path d="M 120 480 L 200 430 L 260 440 L 330 380 L 420 370 L 470 320 L 560 310 L 640 340 L 720 320 L 800 360 L 840 440 L 780 500 L 660 520 L 520 500 L 380 530 L 240 520 Z" fill="#0a2a16" stroke="#3f7a44" stroke-width="2"/>',
    '<path d="M 300 240 L 380 210 L 470 230 L 520 200 L 610 220 L 650 260 L 560 280 L 450 270 L 350 280 Z" fill="#0a2a16" stroke="#3f7a44" stroke-width="2"/>',
    // crosshair
    '<g stroke="#b6ff6a" stroke-width="1.5" fill="none">',
    '<circle cx="480" cy="330" r="60"/><circle cx="480" cy="330" r="6"/>',
    '<line x1="480" y1="250" x2="480" y2="290"/><line x1="480" y1="370" x2="480" y2="410"/>',
    '<line x1="400" y1="330" x2="440" y2="330"/><line x1="520" y1="330" x2="560" y2="330"/>',
    "</g>",
    extras,
    `<text x="16" y="600" fill="#7ddc65" ${MONO} font-size="14">${sub}</text>`,
    '<circle cx="920" cy="52" r="7" fill="#ff5f4f"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/></circle>',
    `<text x="864" y="57" fill="#ff5f4f" ${MONO} font-size="14">REC</text>`
  ].join("\n"));
}

/* ------------------------------------------------ content */

function buildTree() {
  const D = "\r\n";
  const doc = (lines) => lines.join(D);
  const header = (klass, subject, refs) => [
    "DOOMSDAY CONTINUITY INITIATIVE :: PROJECT CERBERUS",
    `CLASSIFICATION: ${klass}`,
    `SUBJECT: ${subject}`,
    `REFERENCE: ${refs}`,
    "------------------------------------------------------------",
    ""
  ];

  return {
    "00) READ FIRST.txt": doc([
      "CERBERUS RECORDS :: ORIENTATION",
      "",
      "This drive is the classified records annex of the archive.",
      "Every section keeps a metadata.json file that describes the",
      "documents beside it. Drop your own media into the matching",
      "folder and add an entry to the JSON if you want the archive",
      "to stay self-describing.",
      "",
      "Sections:",
      "  01) INTELLIGENCE REPORTS   field and signal intelligence",
      "  02) MISSION DOSSIERS       operation folders",
      "  03) PERSONNEL FILES        staff jackets",
      "  04) SATELLITE IMAGERY      orbital frames from CERBERUS birds",
      "  05) AUDIO LOGS             recovered recordings + transcripts",
      "  06) VIDEO BRIEFINGS        see the BROADCAST console",
      "  07) MAPS                   sector and route charts",
      "  08) TECHNICAL SCHEMATICS   hardware drawings",
      "  09) CLASSIFIED MEMOS       internal traffic",
      "  10) REDACTED DOCUMENTS     released under continuity order 9",
      "  11) INCIDENT TIMELINES     reconstructed event chains",
      "",
      "Nothing in this annex leaves the shelter net. DCI directive 4-A."
    ]),

    "01) INTELLIGENCE REPORTS": {
      "metadata.json": JSON.stringify({
        section: "INTELLIGENCE REPORTS",
        classification: "SECRET//SHELTER",
        updated: "2026-07-30",
        files: [
          { file: "intrep-0041-relay-hill-7.txt", title: "INTREP 0041: Relay Hill 7", summary: "Unattended relay still transmitting on schedule." },
          { file: "intrep-0042-market-contact.txt", title: "INTREP 0042: Market contact", summary: "Trader network active east of sector 5." },
          { file: "intrep-0043-signal-survey.txt", title: "INTREP 0043: Airwave survey", summary: "Weekly sweep of the usable spectrum." },
          { file: "intrep-0044-convoy-sighting.txt", title: "INTREP 0044: Convoy sighting", summary: "Three vehicles moving NNE, origin unknown." }
        ]
      }, null, 2),
      "intrep-0041-relay-hill-7.txt": doc([
        ...header("SECRET//SHELTER", "RELAY HILL 7 STATUS", "INTREP 0041 / AUDIO LOG 113"),
        "1. The automated relay on Hill 7 continues to key up every six",
        "   hours, thirteen seconds of carrier, then silence. Battery",
        "   telemetry suggests the solar feed survived the winter.",
        "",
        "2. The message fragment matches AUDIO LOG 113 in the annex:",
        '   "We left the door open. Bring the dog."',
        "",
        "3. ASSESSMENT: whoever set the relay expected someone specific",
        "   to hear it. Recommend a two-person walk-out when the roads",
        "   clear. Take the dog.",
        "",
        "FILED BY: M. KANE"
      ]),
      "intrep-0042-market-contact.txt": doc([
        ...header("SECRET//SHELTER", "TRADER NETWORK, SECTOR 5 EAST", "INTREP 0042"),
        "1. Second confirmed contact with the barter caravan operating",
        "   east of sector 5. They accept water filters, batteries, and",
        "   working radios. They will not discuss where they winter.",
        "",
        "2. Their scout knew our callsign before we gave it. Either the",
        "   airwaves leak more than we think or someone is talking.",
        "",
        "3. ASSESSMENT: keep trading, keep counting their rifles.",
        "",
        "FILED BY: R. VOSS"
      ]),
      "intrep-0043-signal-survey.txt": doc([
        ...header("CONFIDENTIAL", "WEEKLY AIRWAVE SURVEY", "INTREP 0043"),
        "USABLE TRAFFIC THIS WEEK:",
        "  88.1 FM   VAULT PRIME LOOP        nominal",
        "  6.840 MHz numbers station          returned after 9 days dark",
        "  27.185    CB chatter               two parties, crop talk",
        "  152.30    unknown digital burst    1.2 s, repeats at 0300",
        "",
        "The 0300 burst is new. It is not one of ours. Decode attempts",
        "continue on the SIGNAL INTERCEPT console.",
        "",
        "FILED BY: COMMS WATCH"
      ]),
      "intrep-0044-convoy-sighting.txt": doc([
        ...header("SECRET//SHELTER", "UNIDENTIFIED CONVOY", "INTREP 0044 / FRAME 311"),
        "1. CERBERUS-2 frame 311 caught three vehicles in column on the",
        "   old state route, heading NNE at an estimated 40 km/h.",
        "",
        "2. Spacing is disciplined. Lead vehicle is tracked. This is a",
        "   unit, not a family.",
        "",
        "3. ASSESSMENT: they pass 60 km from VAULT PRIME at closest",
        "   approach. No action. Log and watch.",
        "",
        "FILED BY: M. KANE"
      ])
    },

    "02) MISSION DOSSIERS": {
      "metadata.json": JSON.stringify({
        section: "MISSION DOSSIERS",
        classification: "SECRET//SHELTER",
        updated: "2026-07-30",
        files: [
          { file: "dossier-long-winter.txt", title: "OPERATION LONG WINTER", summary: "Food security through the first winter." },
          { file: "dossier-quiet-shelf.txt", title: "OPERATION QUIET SHELF", summary: "Recovery of the flooded lower archive." },
          { file: "dossier-ember.txt", title: "OPERATION EMBER", summary: "Details sealed under continuity order 9." }
        ]
      }, null, 2),
      "dossier-long-winter.txt": doc([
        ...header("SECRET//SHELTER", "OPERATION LONG WINTER", "MISSION BOARD ID LONG WINTER"),
        "OBJECTIVE: carry every resident through the first winter with",
        "zero ration failures and zero cold casualties.",
        "",
        "PERSONNEL: M. KANE (lead), R. VOSS (life support)",
        "",
        "PHASES:",
        "  1. Inventory and triage of all stores        COMPLETE",
        "  2. Greenhouse heat loop from generator waste  COMPLETE",
        "  3. Rotation schedule, 90 day depth            ACTIVE",
        "  4. Spring planting readiness                  PENDING",
        "",
        "NOTES: see AUDIO LOG 047 for germination results. Kane still",
        "owes Voss ten cans and the ledger does not forget."
      ]),
      "dossier-quiet-shelf.txt": doc([
        ...header("SECRET//SHELTER", "OPERATION QUIET SHELF", "MISSION BOARD ID QUIET SHELF"),
        "OBJECTIVE: pump out, dry, and recover the flooded lower archive",
        "shelf without losing a single irreplaceable document.",
        "",
        "PERSONNEL: M. KANE",
        "",
        "STATUS: water level fell 40 cm after the intake patch. Paper",
        "losses so far limited to duplicates. The smell is its own",
        "incident report.",
        "",
        "NOTES: dehumidifier draw is visible on the power console every",
        "night shift. Do not let it trip the aux bus again."
      ]),
      "dossier-ember.txt": doc([
        ...header("TOP SECRET//ORDER 9", "OPERATION EMBER", "MISSION BOARD ID EMBER"),
        "OBJECTIVE: [REDACTED UNDER CONTINUITY ORDER 9]",
        "",
        "PERSONNEL: [REDACTED]",
        "",
        "STATUS: ████████████████████████████████████████",
        "        ████████████████████████",
        "",
        "The only unredacted line in this dossier, by direction of the",
        "custodian: if EMBER goes active, the BROADCAST console carries",
        "the recall signal on channel 1."
      ])
    },

    "03) PERSONNEL FILES": {
      "metadata.json": JSON.stringify({
        section: "PERSONNEL FILES",
        classification: "CONFIDENTIAL",
        updated: "2026-07-30",
        files: [
          { file: "jacket-kane-m.txt", title: "KANE, M.", summary: "Custodian, archive operations." },
          { file: "jacket-voss-r.txt", title: "VOSS, R.", summary: "Life support and research lead." },
          { file: "jacket-subject-redacted.txt", title: "SUBJECT [REDACTED]", summary: "File sealed. Order 9." }
        ]
      }, null, 2),
      "jacket-kane-m.txt": doc([
        ...header("CONFIDENTIAL", "PERSONNEL JACKET: KANE, M.", "PN-0001"),
        "ROLE: custodian, archive operations, mission lead",
        "CLEARANCE: ORDER 9 custodian key holder",
        "",
        "SKILLS: logistics, small engine repair, cold weather ops,",
        "stubbornness rated exceptional by two separate review boards.",
        "",
        "MEDICAL: left shoulder, old injury, flares in the damp.",
        "",
        "REVIEW NOTE: Kane counts everything twice and people first."
      ]),
      "jacket-voss-r.txt": doc([
        ...header("CONFIDENTIAL", "PERSONNEL JACKET: VOSS, R.", "PN-0002"),
        "ROLE: life support systems, research wing lead",
        "CLEARANCE: SECRET//SHELTER",
        "",
        "SKILLS: hydroponics, water chemistry, radio repair, wins",
        "arguments with spreadsheets.",
        "",
        "MEDICAL: corrective lenses. Spares in stores, bin 14.",
        "",
        "REVIEW NOTE: optimism is not a defect. It is load bearing."
      ]),
      "jacket-subject-redacted.txt": doc([
        ...header("TOP SECRET//ORDER 9", "PERSONNEL JACKET: SUBJECT [REDACTED]", "PN-0009"),
        "ROLE: ████████████████████",
        "CLEARANCE: ████████",
        "",
        "HISTORY: ████████████████████████████████████████████",
        "█████████████████████████████████ arrived with the dog.",
        "",
        "REVIEW NOTE: the dog stays. That part is not negotiable."
      ])
    },

    "04) SATELLITE IMAGERY": {
      "metadata.json": JSON.stringify({
        section: "SATELLITE IMAGERY",
        classification: "SECRET//ORBITAL",
        updated: "2026-07-30",
        files: [
          { file: "frame-217-sector-grid.svg", title: "Frame 217", summary: "Routine pass over sector 7, relay site marked." },
          { file: "frame-218-thermal-anomaly.svg", title: "Frame 218", summary: "Thermal anomaly, source unidentified." },
          { file: "frame-311-convoy.svg", title: "Frame 311", summary: "Three vehicle convoy on the old state route." }
        ]
      }, null, 2),
      "frame-217-sector-grid.svg": satFrame({
        frame: "217",
        sub: "SECTOR 7 :: ROUTINE PASS :: 2026-07-12 06:41Z :: RES 4.2M",
        extras: [
          `<circle cx="560" cy="280" r="10" fill="none" stroke="#ffd23f" stroke-width="2"/>`,
          `<text x="576" y="272" fill="#ffd23f" ${MONO} font-size="14">RELAY HILL 7</text>`,
          `<text x="576" y="290" fill="#7ddc65" ${MONO} font-size="12">CARRIER ACTIVE</text>`
        ].join("\n")
      }),
      "frame-218-thermal-anomaly.svg": satFrame({
        frame: "218",
        sub: "SECTOR 7 :: THERMAL BAND :: 2026-07-12 06:43Z :: DELTA 41.2C",
        extras: [
          '<ellipse cx="640" cy="430" rx="34" ry="22" fill="#ff5f4f" opacity="0.55"/>',
          '<ellipse cx="640" cy="430" rx="60" ry="40" fill="none" stroke="#ff5f4f" stroke-dasharray="6 4"/>',
          `<text x="590" y="386" fill="#ff5f4f" ${MONO} font-size="14">THERMAL ANOMALY</text>`,
          `<text x="590" y="404" fill="#ff9f92" ${MONO} font-size="12">SOURCE UNIDENTIFIED</text>`
        ].join("\n")
      }),
      "frame-311-convoy.svg": satFrame({
        frame: "311",
        sub: "OLD STATE ROUTE :: 2026-07-28 17:12Z :: TRACKING 3 VEHICLES",
        extras: [
          '<path d="M 160 560 C 320 480 520 470 820 380" fill="none" stroke="#5d8a60" stroke-width="4" stroke-dasharray="12 8"/>',
          '<rect x="470" y="452" width="18" height="10" fill="#ffd23f" transform="rotate(-12 479 457)"/>',
          '<rect x="510" y="440" width="18" height="10" fill="#ffd23f" transform="rotate(-12 519 445)"/>',
          '<rect x="550" y="428" width="18" height="10" fill="#ffd23f" transform="rotate(-12 559 433)"/>',
          `<text x="470" y="420" fill="#ffd23f" ${MONO} font-size="14">CONVOY :: HDG NNE :: 40 KM/H</text>`
        ].join("\n")
      })
    },

    "05) AUDIO LOGS": {
      "metadata.json": JSON.stringify({
        section: "AUDIO LOGS",
        classification: "CONFIDENTIAL",
        updated: "2026-07-30",
        files: [
          { file: "log-001-kane.ogg", title: "LOG 001: Kane", summary: "Day 40 status. Transcript beside it.", transcript: "log-001-transcript.txt" },
          { file: "log-047-voss.ogg", title: "LOG 047: Voss", summary: "Seed bank germination results.", transcript: "log-047-transcript.txt" },
          { file: "log-113-unknown.ogg", title: "LOG 113: Unknown", summary: "Recovered from Relay Hill 7.", transcript: "log-113-transcript.txt" }
        ]
      }, null, 2),
      "log-001-transcript.txt": doc([
        "TRANSCRIPT :: AUDIO LOG 001 :: SPEAKER: KANE, M.",
        "",
        '"Archive log zero zero one. Kane reporting. Day forty since',
        "lockdown. The lower shelf flooding has stopped. Rations hold",
        "at sixty percent. Voss thinks the water reclaimer is fine.",
        'I think Voss is an optimist. End log."'
      ]),
      "log-047-transcript.txt": doc([
        "TRANSCRIPT :: AUDIO LOG 047 :: SPEAKER: VOSS, R.",
        "",
        '"Research log forty seven. Voss. Germination test on the seed',
        "bank came back at ninety two percent viability. If surface",
        "readings keep falling, we plant in the spring. Kane owes me",
        'ten cans. End log."'
      ]),
      "log-113-transcript.txt": doc([
        "TRANSCRIPT :: AUDIO LOG 113 :: SPEAKER: UNKNOWN",
        "RECOVERED: Relay Hill 7 automated repeater",
        "",
        '"If anyone receives this, the relay on hill seven is still',
        "transmitting. We left the door open. Bring the dog. Repeat.",
        'Bring the dog."',
        "",
        "ANALYST NOTE: see INTREP 0041. The repeater still keys up",
        "every six hours."
      ])
    },

    "06) VIDEO BRIEFINGS": {
      "metadata.json": JSON.stringify({
        section: "VIDEO BRIEFINGS",
        classification: "UNCLASSIFIED",
        updated: "2026-07-30",
        files: [
          { file: "briefing-index.txt", title: "Briefing index", summary: "Where the moving pictures live." }
        ]
      }, null, 2),
      "briefing-index.txt": doc([
        "VIDEO BRIEFINGS :: INDEX",
        "",
        "Recovered civil defense and training reels are broadcast on the",
        "BROADCAST console (desktop icon: BROADCAST), running as live",
        "channels:",
        "",
        "  CH-1  VAULT-TEC TRAINING     induction and drill reels",
        "  CH-2  AMERICA PSA            civil defense announcements",
        "  CH-3  CORPORATE LIFE         workplace conduct films",
        "  CH-4  VAULT BOY ORIGINS      orientation shorts",
        "",
        "The host node retrieves the broadcast archive once from the",
        "grid; field terminals stream it over the shelter net.",
        "",
        "Drop your own briefing files (mp4, webm) into this folder to",
        "keep them beside the metadata."
      ])
    },

    "07) MAPS": {
      "metadata.json": JSON.stringify({
        section: "MAPS",
        classification: "CONFIDENTIAL",
        updated: "2026-07-30",
        files: [
          { file: "sector-map-vault-prime.svg", title: "Sector map", summary: "Nine sector grid around VAULT PRIME." },
          { file: "fallback-routes.svg", title: "Fallback routes", summary: "Routes A, B, C with waypoints." }
        ]
      }, null, 2),
      "sector-map-vault-prime.svg": svgShell("CONFIDENTIAL :: SECTOR MAP :: VAULT PRIME", [
        '<g stroke="#4f9a52" stroke-width="1.5" fill="none">',
        '<line x1="330" y1="60" x2="330" y2="580"/><line x1="630" y1="60" x2="630" y2="580"/>',
        '<line x1="40" y1="230" x2="920" y2="230"/><line x1="40" y1="410" x2="920" y2="410"/>',
        "</g>",
        ...[["1", 180, 150], ["2", 480, 150], ["3", 780, 150], ["4", 180, 330], ["5", 480, 330], ["6", 780, 330], ["7", 180, 510], ["8", 480, 510], ["9", 780, 510]]
          .map(([n, x, y]) => `<text x="${x}" y="${y}" fill="#2f6b3a" ${MONO} font-size="46" text-anchor="middle">S${n}</text>`),
        '<path d="M 480 330 l 10 22 24 3 -17 17 4 24 -21 -11 -21 11 4 -24 -17 -17 24 -3 Z" fill="#ffd23f" transform="translate(0,-24)"/>',
        `<text x="480" y="382" fill="#ffd23f" ${MONO} font-size="16" text-anchor="middle">VAULT PRIME</text>`,
        '<circle cx="220" cy="480" r="8" fill="none" stroke="#7ddc65" stroke-width="2"/>',
        `<text x="236" y="485" fill="#7ddc65" ${MONO} font-size="14">WATER SOURCE</text>`,
        '<circle cx="700" cy="160" r="9" fill="none" stroke="#ffd23f" stroke-width="2"/>',
        `<text x="716" y="165" fill="#ffd23f" ${MONO} font-size="14">RELAY HILL 7</text>`,
        '<g fill="none" stroke="#ff5f4f" stroke-width="2"><rect x="660" y="440" width="180" height="110"/><line x1="660" y1="440" x2="840" y2="550"/><line x1="840" y1="440" x2="660" y2="550"/></g>',
        `<text x="750" y="430" fill="#ff5f4f" ${MONO} font-size="14" text-anchor="middle">DO NOT ENTER :: S9 EAST</text>`
      ].join("\n")),
      "fallback-routes.svg": svgShell("CONFIDENTIAL :: FALLBACK ROUTES", [
        '<path d="M 480 330 C 380 260 260 240 140 160" fill="none" stroke="#b6ff6a" stroke-width="3" stroke-dasharray="10 6"/>',
        '<path d="M 480 330 C 560 420 700 460 830 520" fill="none" stroke="#ffd23f" stroke-width="3" stroke-dasharray="10 6"/>',
        '<path d="M 480 330 C 460 460 380 520 250 560" fill="none" stroke="#7ddc65" stroke-width="3" stroke-dasharray="4 6"/>',
        '<circle cx="480" cy="330" r="10" fill="#ffd23f"/>',
        `<text x="498" y="324" fill="#ffd23f" ${MONO} font-size="15">VAULT PRIME</text>`,
        `<text x="120" y="140" fill="#b6ff6a" ${MONO} font-size="15">ROUTE A :: NORTH CACHE (36 KM)</text>`,
        `<text x="600" y="548" fill="#ffd23f" ${MONO} font-size="15">ROUTE B :: RIVER CROSSING (52 KM)</text>`,
        `<text x="90" y="596" fill="#7ddc65" ${MONO} font-size="15">ROUTE C :: FOOT ONLY, WINTER UNSAFE</text>`,
        ...[[300, 250, "WP-1"], [200, 190, "WP-2"], [640, 430, "WP-3"], [760, 490, "WP-4"]]
          .map(([x, y, t]) => `<g><rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="none" stroke="#eaffdc" stroke-width="2"/><text x="${x + 12}" y="${y + 5}" fill="#eaffdc" ${MONO} font-size="13">${t}</text></g>`)
      ].join("\n"))
    },

    "08) TECHNICAL SCHEMATICS": {
      "metadata.json": JSON.stringify({
        section: "TECHNICAL SCHEMATICS",
        classification: "SECRET//SHELTER",
        updated: "2026-07-30",
        files: [
          { file: "cerberus-bird-schematic.svg", title: "CERBERUS satellite", summary: "Orbital asset, general arrangement." },
          { file: "shelter-cross-section.svg", title: "Shelter cross section", summary: "Levels L1 to L3 with utilities." }
        ]
      }, null, 2),
      "cerberus-bird-schematic.svg": svgShell("SECRET//SHELTER :: CERBERUS BIRD :: GENERAL ARRANGEMENT", [
        '<g stroke="#b6ff6a" stroke-width="2" fill="none">',
        '<rect x="420" y="260" width="120" height="140"/>',
        '<rect x="180" y="290" width="220" height="80"/><rect x="560" y="290" width="220" height="80"/>',
        ...Array.from({ length: 5 }, (_, i) => `<line x1="${224 + i * 40}" y1="290" x2="${224 + i * 40}" y2="370"/>`),
        ...Array.from({ length: 5 }, (_, i) => `<line x1="${604 + i * 40}" y1="290" x2="${604 + i * 40}" y2="370"/>`),
        '<circle cx="480" cy="470" r="46"/><line x1="480" y1="400" x2="480" y2="424"/>',
        '<path d="M 452 470 A 28 28 0 0 1 508 470" />',
        "</g>",
        `<text x="480" y="240" fill="#b6ff6a" ${MONO} font-size="14" text-anchor="middle">SENSOR BUS</text>`,
        `<text x="290" y="278" fill="#7ddc65" ${MONO} font-size="13" text-anchor="middle">SOLAR ARRAY PORT</text>`,
        `<text x="670" y="278" fill="#7ddc65" ${MONO} font-size="13" text-anchor="middle">SOLAR ARRAY STBD</text>`,
        `<text x="480" y="545" fill="#7ddc65" ${MONO} font-size="13" text-anchor="middle">DOWNLINK DISH :: 2.2 GHZ</text>`,
        `<text x="60" y="600" fill="#5d8a60" ${MONO} font-size="12">NOTE: CERBERUS-3 FLIES WITH A CRACKED PORT ARRAY. POWER BUDGET IN DEGRADED TABLE.</text>`
      ].join("\n")),
      "shelter-cross-section.svg": svgShell("SECRET//SHELTER :: VAULT PRIME :: CROSS SECTION", [
        '<rect x="120" y="120" width="720" height="60" fill="#0a2a16" stroke="#4f9a52"/>',
        `<text x="480" y="158" fill="#7ddc65" ${MONO} font-size="15" text-anchor="middle">SURFACE STRUCTURE :: DECOY BARN</text>`,
        '<g stroke="#b6ff6a" stroke-width="2" fill="none">',
        '<rect x="200" y="220" width="560" height="90"/><rect x="200" y="330" width="560" height="90"/><rect x="200" y="440" width="560" height="90"/>',
        '<line x1="300" y1="180" x2="300" y2="220"/><line x1="660" y1="180" x2="660" y2="530"/>',
        "</g>",
        `<text x="220" y="250" fill="#eaffdc" ${MONO} font-size="14">L1 :: OPS, COMMS, ARCHIVE READING ROOM</text>`,
        `<text x="220" y="360" fill="#eaffdc" ${MONO} font-size="14">L2 :: QUARTERS, GALLEY, MED BAY</text>`,
        `<text x="220" y="470" fill="#eaffdc" ${MONO} font-size="14">L3 :: STORES, WATER RECLAIMER, GENERATOR</text>`,
        `<text x="300" y="205" fill="#7ddc65" ${MONO} font-size="12" transform="rotate(-90 296 214)"></text>`,
        `<text x="676" y="205" fill="#7ddc65" ${MONO} font-size="12">AIR SHAFT</text>`,
        `<text x="246" y="205" fill="#7ddc65" ${MONO} font-size="12">STAIR</text>`,
        `<text x="60" y="600" fill="#5d8a60" ${MONO} font-size="12">LOWER SHELF (L3 SOUTH) FLOOD DAMAGE MARKED IN OPERATION QUIET SHELF DOSSIER.</text>`
      ].join("\n"))
    },

    "09) CLASSIFIED MEMOS": {
      "metadata.json": JSON.stringify({
        section: "CLASSIFIED MEMOS",
        classification: "SECRET//SHELTER",
        updated: "2026-07-30",
        files: [
          { file: "memo-014-rationing.txt", title: "MEMO 014", summary: "Ration policy, revision two." },
          { file: "memo-019-radio-discipline.txt", title: "MEMO 019", summary: "Radio discipline reminder." },
          { file: "memo-021-the-dog.txt", title: "MEMO 021", summary: "Regarding the dog." },
          { file: "memo-027-order-9.txt", title: "MEMO 027", summary: "Continuity order 9 scope." }
        ]
      }, null, 2),
      "memo-014-rationing.txt": doc([
        ...header("CONFIDENTIAL", "RATION POLICY, REVISION TWO", "MEMO 014"),
        "Effective immediately, coffee is a morale item, not a food",
        "item, and is issued on the morale schedule. The custodian is",
        "aware this is the least popular decision since lockdown and",
        "stands by it.",
        "",
        "M. KANE, CUSTODIAN"
      ]),
      "memo-019-radio-discipline.txt": doc([
        ...header("SECRET//SHELTER", "RADIO DISCIPLINE", "MEMO 019"),
        "Somebody answered the caravan scout on an open channel using",
        "our internal callsign. See INTREP 0042 for why that matters.",
        "",
        "From today: outside traffic goes through the COMMS console",
        "only, and coded phrases stay off the shelter chat. The",
        "intercept watch reads everything. That is its job.",
        "",
        "COMMS WATCH"
      ]),
      "memo-021-the-dog.txt": doc([
        ...header("CONFIDENTIAL", "REGARDING THE DOG", "MEMO 021"),
        "The dog found the L3 damp patch two days before the humidity",
        "sensors did. The dog is hereby appointed auxiliary sensor,",
        "grade one, with back pay in jerky.",
        "",
        "This memo is official. Stop asking.",
        "",
        "M. KANE, CUSTODIAN"
      ]),
      "memo-027-order-9.txt": doc([
        ...header("TOP SECRET//ORDER 9", "CONTINUITY ORDER 9, SCOPE", "MEMO 027"),
        "Order 9 material is sealed to the custodian key. It covers:",
        "",
        "  1. OPERATION EMBER, all phases",
        "  2. Subject [REDACTED], personnel jacket PN-0009",
        "  3. ████████████████████████████",
        "",
        "Requests to unseal go in writing to the custodian, who will",
        "say no in writing."
      ])
    },

    "10) REDACTED DOCUMENTS": {
      "metadata.json": JSON.stringify({
        section: "REDACTED DOCUMENTS",
        classification: "RELEASED//SANITIZED",
        updated: "2026-07-30",
        files: [
          { file: "release-0003-ember-fragment.txt", title: "RELEASE 0003", summary: "Ember fragment, heavily sanitized." },
          { file: "release-0007-arrival-report.txt", title: "RELEASE 0007", summary: "Arrival report, subject redacted." }
        ]
      }, null, 2),
      "release-0003-ember-fragment.txt": doc([
        ...header("RELEASED//SANITIZED", "EMBER FRAGMENT", "RELEASE 0003 / ORDER 9"),
        "Page 4 of 11. Released under review, all other pages withheld.",
        "",
        "...and if ████████ fails, the ████████████ at ██████████",
        "will still carry the recall. The dog knows the route even if",
        "████████████████. Provisions for ██ persons were cached at",
        "██████████ against this exact day.",
        "",
        "We did not build this place to hide. We built it to come back.",
        "",
        "[REMAINDER WITHHELD]"
      ]),
      "release-0007-arrival-report.txt": doc([
        ...header("RELEASED//SANITIZED", "ARRIVAL REPORT", "RELEASE 0007 / PN-0009"),
        "At 0520 the perimeter sensors tripped on the north approach.",
        "One adult, one dog, no vehicle. The adult knew the outer gate",
        "code from ██████████████████ and asked for ████████ by name.",
        "",
        "Quarantine was uneventful. The dog cleared screening first",
        "and has made no secret of its opinion of the galley.",
        "",
        "Identity withheld under Order 9. See PN-0009."
      ])
    },

    "11) INCIDENT TIMELINES": {
      "metadata.json": JSON.stringify({
        section: "INCIDENT TIMELINES",
        classification: "CONFIDENTIAL",
        updated: "2026-07-30",
        files: [
          { file: "timeline-lower-shelf-flood.txt", title: "Lower shelf flood", summary: "Reconstructed event chain, L3 south." },
          { file: "timeline-blackout-night.txt", title: "Blackout night", summary: "The night the aux bus tripped." }
        ]
      }, null, 2),
      "timeline-lower-shelf-flood.txt": doc([
        ...header("CONFIDENTIAL", "INCIDENT TIMELINE: LOWER SHELF FLOOD", "IT-0001"),
        "DAY 31  2140  dog refuses to leave L3 south corridor",
        "DAY 31  2205  Kane logs 'damp smell' in the night book",
        "DAY 33  0600  humidity sensor L3-S finally alarms",
        "DAY 33  0615  intake seam found weeping above shelf row C",
        "DAY 33  0700  OPERATION QUIET SHELF opened on mission board",
        "DAY 34  1300  patch applied, pump running",
        "DAY 40  0900  water level down 40 cm, losses: duplicates only",
        "",
        "LESSON: trust the dog. See MEMO 021."
      ]),
      "timeline-blackout-night.txt": doc([
        ...header("CONFIDENTIAL", "INCIDENT TIMELINE: BLACKOUT NIGHT", "IT-0002"),
        "DAY 36  0212  dehumidifier spikes the aux bus, breaker trips",
        "DAY 36  0212  L2 and L3 lighting drops, archive stays up",
        "DAY 36  0214  generator auto-start: FAILED, choke stuck",
        "DAY 36  0219  Voss starts it by hand, third pull",
        "DAY 36  0230  power restored, ration freezer never passed 4 C",
        "DAY 36  0800  choke linkage cleaned, retest OK",
        "",
        "LESSON: the aux bus load table is not a suggestion.",
        "See OPERATION QUIET SHELF dossier, power note."
      ])
    }
  };
}

/* ------------------------------------------------ writer */

function writeTree(dir, tree) {
  let created = 0;
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, value] of Object.entries(tree)) {
    const target = path.join(dir, name);
    if (typeof value === "string") {
      if (!fs.existsSync(target)) {
        fs.writeFileSync(target, value, "utf8");
        created += 1;
      }
    } else {
      created += writeTree(target, value);
    }
  }
  return created;
}

/**
 * Seeds the records tree into `dir`. `audioDir` holds the bundled audio log
 * oggs (copied beside their transcripts). Safe to call every launch; a
 * marker file makes reruns cheap and user files are never overwritten.
 */
function seedRecords(dir, audioDir) {
  const markerPath = path.join(dir, MARKER);
  try {
    const marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
    if (marker.version >= SEED_VERSION) return { ok: true, created: 0, skipped: true };
  } catch {
    // no marker yet
  }
  let created = writeTree(dir, buildTree());
  const audioTarget = path.join(dir, "05) AUDIO LOGS");
  for (const name of ["log-001-kane.ogg", "log-047-voss.ogg", "log-113-unknown.ogg"]) {
    const src = path.join(audioDir, name);
    const dst = path.join(audioTarget, name);
    try {
      if (fs.existsSync(src) && !fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
        created += 1;
      }
    } catch {
      // asar copy can fail on exotic installs; transcripts still tell the story
    }
  }
  fs.writeFileSync(markerPath, JSON.stringify({ version: SEED_VERSION, seededAt: new Date().toISOString() }, null, 2), "utf8");
  return { ok: true, created, skipped: false };
}

module.exports = { seedRecords, SEED_VERSION };
