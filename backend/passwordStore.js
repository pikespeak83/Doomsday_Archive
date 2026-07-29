const crypto = require("crypto");

/** scrypt-based passphrase hashing for the vault lock. */
function hashPassword(password, salt) {
  const useSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), useSalt, 32).toString("hex");
  return { hash, salt: useSalt };
}

function verifyPassword(password, hash, salt) {
  if (!hash || !salt) return true; // no passphrase set
  try {
    const candidate = crypto.scryptSync(String(password || ""), salt, 32).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
