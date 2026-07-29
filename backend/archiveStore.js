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
 * Virtual paths look like "srcId/rest/of/path". The empty path lists the
 * linked sources themselves (whole drives or folders).
 */
function splitVirtual(relPath) {
  const clean = String(relPath || "").replace(/^[/\\]+/, "").replace(/\\/g, "/");
  if (!clean) return { sourceId: "", rest: "" };
  const idx = clean.indexOf("/");
  if (idx === -1) return { sourceId: clean, rest: "" };
  return { sourceId: clean.slice(0, idx), rest: clean.slice(idx + 1) };
}

function findSource(sources, sourceId) {
  return (sources || []).find((s) => s.id === sourceId) || null;
}

/**
 * Resolve a client-supplied virtual path against the linked sources.
 * Throws if the result escapes the source root (traversal guard).
 */
function resolveVirtual(sources, relPath) {
  const { sourceId, rest } = splitVirtual(relPath);
  if (!sourceId) throw new Error("Path required");
  const source = findSource(sources, sourceId);
  if (!source) throw new Error("Unknown source");
  const abs = path.resolve(source.path, rest.replace(/^[/\\]+/, ""));
  const normRoot = path.resolve(source.path);
  const cmpAbs = process.platform === "win32" ? abs.toLowerCase() : abs;
  const cmpRoot = process.platform === "win32" ? normRoot.toLowerCase() : normRoot;
  const rootWithSep = cmpRoot.endsWith(path.sep) ? cmpRoot : cmpRoot + path.sep;
  if (cmpAbs !== cmpRoot && !cmpAbs.startsWith(rootWithSep)) {
    throw new Error("Path escapes source root");
  }
  return { abs, source };
}

/** List one level of the virtual tree. */
function listVirtual(sources, relPath) {
  const { sourceId } = splitVirtual(relPath);

  if (!sourceId) {
    // top level: the linked sources (full drives / folders)
    return {
      path: "",
      entries: (sources || []).map((source) => ({
        name: source.label || source.path,
        id: source.id,
        type: "drive",
        online: fs.existsSync(source.path)
      }))
    };
  }

  const { abs } = resolveVirtual(sources, relPath);
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  const dirs = [];
  const files = [];
  for (const entry of entries) {
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

/** Free/total bytes per source for status displays. */
function sourceStats(sources) {
  return (sources || []).map((source) => {
    try {
      const stat = fs.statfsSync(source.path);
      return {
        id: source.id,
        label: source.label,
        path: source.path,
        online: true,
        totalBytes: stat.bsize * stat.blocks,
        freeBytes: stat.bsize * stat.bavail
      };
    } catch {
      return { id: source.id, label: source.label, path: source.path, online: false };
    }
  });
}

module.exports = { resolveVirtual, listVirtual, splitVirtual, sourceStats, kindOf };
