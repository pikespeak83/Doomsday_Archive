const path = require("path");
const fs = require("fs");
const { resolveVirtual, splitVirtual } = require("./archiveStore");

/**
 * Host-only write operations on the vault. Every path is a virtual
 * "srcId/rest" path and gets traversal-guarded by resolveVirtual.
 */

function assertNotRoot(relPath) {
  const { sourceId, rest } = splitVirtual(relPath);
  if (!sourceId || !rest) throw new Error("Cannot modify a source root");
}

function makeFolder(sources, parentRel, name) {
  const clean = cleanName(name);
  const { abs } = resolveVirtual(sources, joinRel(parentRel, clean));
  if (fs.existsSync(abs)) throw new Error("Already exists");
  fs.mkdirSync(abs, { recursive: false });
  return true;
}

function makeFile(sources, parentRel, name) {
  const clean = cleanName(name);
  const { abs } = resolveVirtual(sources, joinRel(parentRel, clean));
  if (fs.existsSync(abs)) throw new Error("Already exists");
  fs.writeFileSync(abs, "", "utf8");
  return true;
}

function renameEntry(sources, relPath, newName) {
  assertNotRoot(relPath);
  const clean = cleanName(newName);
  const { abs } = resolveVirtual(sources, relPath);
  const target = path.join(path.dirname(abs), clean);
  if (fs.existsSync(target)) throw new Error("A file with that name already exists");
  fs.renameSync(abs, target);
  return true;
}

/** Move a file or folder into a destination folder (possibly another source). */
function moveEntry(sources, fromRel, toDirRel) {
  assertNotRoot(fromRel);
  const { abs: fromAbs } = resolveVirtual(sources, fromRel);
  const { abs: toDirAbs } = resolveVirtual(sources, toDirRel || splitVirtual(fromRel).sourceId);
  const stat = fs.statSync(toDirAbs);
  if (!stat.isDirectory()) throw new Error("Destination is not a folder");
  const target = path.join(toDirAbs, path.basename(fromAbs));
  if (fs.existsSync(target)) throw new Error("Destination already has an entry with that name");
  const cmpFrom = fromAbs.toLowerCase() + path.sep;
  if ((target.toLowerCase() + path.sep).startsWith(cmpFrom)) {
    throw new Error("Cannot move a folder into itself");
  }
  try {
    fs.renameSync(fromAbs, target);
  } catch (err) {
    if (err.code === "EXDEV") {
      // different volume: copy then remove
      fs.cpSync(fromAbs, target, { recursive: true, errorOnExist: true, force: false });
      fs.rmSync(fromAbs, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
  return true;
}

/** Delete goes to the recycle bin via Electron's shell (safer than rmSync). */
async function deleteEntry(sources, relPath) {
  assertNotRoot(relPath);
  const { abs } = resolveVirtual(sources, relPath);
  const { shell } = require("electron");
  await shell.trashItem(abs);
  return true;
}

/** Copy an entry into a destination folder, auto-suffixing on name clash. */
function copyEntry(sources, fromRel, toDirRel) {
  assertNotRoot(fromRel);
  const { abs: fromAbs } = resolveVirtual(sources, fromRel);
  const { abs: toDirAbs } = resolveVirtual(sources, toDirRel);
  if (!fs.statSync(toDirAbs).isDirectory()) throw new Error("Destination is not a folder");
  const parsed = path.parse(path.basename(fromAbs));
  let target = path.join(toDirAbs, parsed.base);
  let n = 2;
  while (fs.existsSync(target)) target = path.join(toDirAbs, `${parsed.name} (copy ${n++})${parsed.ext}`);
  const cmpFrom = fromAbs.toLowerCase() + path.sep;
  if ((target.toLowerCase() + path.sep).startsWith(cmpFrom)) {
    throw new Error("Cannot copy a folder into itself");
  }
  fs.cpSync(fromAbs, target, { recursive: true, errorOnExist: true, force: false });
  return true;
}

function cleanName(name) {
  const clean = String(name || "").trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "");
  if (!clean || clean === "." || clean === "..") throw new Error("Invalid name");
  return clean.slice(0, 120);
}

function joinRel(parentRel, name) {
  const parent = String(parentRel || "").replace(/\/+$/, "");
  if (!parent) throw new Error("Cannot create at the vault root; open a drive first");
  return `${parent}/${name}`;
}

module.exports = { makeFolder, makeFile, renameEntry, moveEntry, deleteEntry, copyEntry };
