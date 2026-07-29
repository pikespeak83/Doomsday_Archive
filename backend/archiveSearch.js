const path = require("path");
const fs = require("fs");
const { resolveVirtual, kindOf } = require("./archiveStore");

/**
 * Recursive filename search across every linked source. Time-budgeted and
 * depth-limited so a full-drive source cannot hang the host.
 */

const SKIP_DIRS = new Set([
  "node_modules", ".git", "windows", "program files", "program files (x86)",
  "programdata", "appdata", "$recycle.bin", "system volume information",
  "recovery", "perflogs", "msocache"
]);

function searchArchive(sources, query, opts = {}) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return { results: [], truncated: false };
  const maxResults = opts.maxResults || 200;
  const maxDepth = opts.maxDepth || 8;
  const deadline = Date.now() + (opts.budgetMs || 5000);
  const results = [];
  let truncated = false;

  for (const source of sources || []) {
    if (results.length >= maxResults || Date.now() > deadline) { truncated = true; break; }
    let rootAbs;
    try {
      rootAbs = resolveVirtual(sources, source.id).abs;
    } catch {
      continue;
    }
    walk(rootAbs, source.id, 0);
  }

  function walk(dirAbs, relBase, depth) {
    if (results.length >= maxResults || Date.now() > deadline) { truncated = true; return; }
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dirAbs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= maxResults || Date.now() > deadline) { truncated = true; return; }
      const lower = entry.name.toLowerCase();
      if (lower.startsWith("$")) continue;
      const rel = `${relBase}/${entry.name}`;
      if (entry.isDirectory()) {
        if (lower.includes(q)) {
          results.push({ rel, name: entry.name, type: "dir", kind: "dir", size: 0 });
        }
        if (!SKIP_DIRS.has(lower)) walk(path.join(dirAbs, entry.name), rel, depth + 1);
      } else if (entry.isFile() && lower.includes(q)) {
        let size = 0;
        try { size = fs.statSync(path.join(dirAbs, entry.name)).size; } catch { /* skip */ }
        const ext = path.extname(entry.name).slice(1);
        results.push({ rel, name: entry.name, type: "file", kind: kindOf(ext), size });
      }
    }
  }

  return { results, truncated };
}

module.exports = { searchArchive };
