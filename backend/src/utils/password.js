const { randomBytes, scrypt, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");

const deriveKey = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  // OWASP scrypt profile: N=2^15, r=8, p=3. Never trim passwords.
  const key = await deriveKey(password, salt, 64, {
    N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$32768$8$3$${salt}$${key.toString("hex")}`;
}

async function verifyPassword(password, hash) {
  if (typeof password !== "string" || typeof hash !== "string") return false;
  const match = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(hash);
  if (!match) return false;
  const key = await deriveKey(password, match[1], 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(key, Buffer.from(match[2], "hex"));
}

module.exports = { hashPassword, verifyPassword };
