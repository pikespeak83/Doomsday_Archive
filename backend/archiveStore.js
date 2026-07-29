const path = require("path");
const fs = require("fs");

const KIND_MAP = {
  image: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"],
  video: ["mp4", "webm", "mkv", "mov", "avi", "m4v"],
  audio: ["mp3", "ogg", "wav", "flac", "m4a", "opus"],
  text: ["txt", "md", "log", "json", "yml", "yaml", "csv", "xml", "ini", "cfg"],
  doc: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "epub"],
  archive: ["zip", "rar", "7z", "tar", "gz", "iso"]
};

function kindOf(ext) {
  const e = String(ext || "").toLowerCase();
  for (const [kind, list] of Object.entries(KIND_MAP)) {
    if (list.includes(e)) return kind;
  }
  return "file";
}

/**
 * Resolve a client-supplied relative path inside the archive root.
 * Throws if the result escapes the root (traversal guard).
 */
function resolveSafe(root, relPath) {
  if (!root) throw new Error("No archive root linked");
  const cleanRel = String(relPath || "").replace(/^[/\\]+/, "");
  const abs = path.resolve(root, cleanRel);
  const normRoot = path.resolve(root);
  const cmpAbs = process.platform === "win32" ? abs.toLowerCase() : abs;
  const cmpRoot = process.platform === "win32" ? normRoot.toLowerCase() : normRoot;
  if (cmpAbs !== cmpRoot && !cmpAbs.startsWith(cmpRoot + path.sep)) {
    throw new Error("Path escapes archive root");
  }
  return abs;
}

/** List one directory level inside the archive root. */
function listDir(root, relPath) {
  const abs = resolveSafe(root, relPath);
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  const dirs = [];
  const files = [];
  for (const entry of entries) {
    // skip hidden/system noise
    if (entry.name.startsWith("$") || entry.name === "System Volume Information") continue;
    try {
      const full = path.join(abs, entry.name);
      if (entry.isDirectory()) {
        dirs.push({ name: entry.name, type: "dir" });
      } else if (entry.isFile()) {
        const stat = fs.statSync(full);
        const ext = path.extname(entry.name).slice(1);
        files.push({
          name: entry.name,
          type: "file",
          size: stat.size,
          mtime: stat.mtimeMs,
          ext,
          kind: kindOf(ext)
        });
      }
    } catch {
      // unreadable entry, skip
    }
  }
  dirs.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));
  const rel = String(relPath || "").replace(/^[/\\]+/, "").replace(/\\/g, "/");
  return { path: rel, entries: [...dirs, ...files] };
}

/** Quick stats for the status displays. */
function rootStats(root) {
  if (!root || !fs.existsSync(root)) return { ok: false };
  try {
    const stat = fs.statfsSync(root);
    return {
      ok: true,
      totalBytes: stat.bsize * stat.blocks,
      freeBytes: stat.bsize * stat.bavail
    };
  } catch {
    return { ok: true, totalBytes: 0, freeBytes: 0 };
  }
}

module.exports = { resolveSafe, listDir, rootStats, kindOf };
