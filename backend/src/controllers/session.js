const { promisify } = require("node:util");
const User = require("../models/User");
const { verifyPassword } = require("../utils/password");
const { SESSION_COOKIE_NAME, SESSION_DURATION_MS } = require("../config/session");

// Valid hash format with a non-user salt/key, to do equivalent expensive work
// for nonexistent accounts without looking up or disclosing another account.
const DUMMY_HASH = `scrypt$32768$8$3$${"0".repeat(32)}$${"0".repeat(128)}`;

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, roles: user.roles, preferredLanguage: user.preferredLanguage };
}

async function login(req, res, next) {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    || typeof password !== "string" || !password.length || [...password].length > 128
    || Object.keys(req.body).some((key) => !["email", "password"].includes(key))) {
    return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Enter a valid email address and password." });
  }
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    const matches = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !matches || user.status !== "active" || !Array.isArray(user.roles) || !user.roles.length) {
      return res.status(401).json({ success: false, code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." });
    }
    // Prevent session fixation. Never accept a user ID or roles from the client.
    await promisify(req.session.regenerate).call(req.session);
    req.session.userId = user.id;
    req.session.authenticatedAt = Date.now();
    await promisify(req.session.save).call(req.session);
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) { return next(error); }
}

async function currentUser(req, res, next, adminOnly = false) {
  try {
    if (!req.session.userId) return res.status(401).json({ success: false, code: "UNAUTHENTICATED" });
    if (!Number.isFinite(req.session.authenticatedAt) || Date.now() - req.session.authenticatedAt >= SESSION_DURATION_MS) {
      await promisify(req.session.destroy).call(req.session);
      res.clearCookie(SESSION_COOKIE_NAME, req.app.locals.sessionCookieOptions);
      return res.status(401).json({ success: false, code: "UNAUTHENTICATED" });
    }
    // Fetch current roles/status each time, so suspended users lose access.
    const user = await User.findById(req.session.userId);
    if (!user || user.status !== "active" || !Array.isArray(user.roles) || !user.roles.length) {
      await promisify(req.session.destroy).call(req.session);
      res.clearCookie(SESSION_COOKIE_NAME, req.app.locals.sessionCookieOptions);
      return res.status(401).json({ success: false, code: "UNAUTHENTICATED" });
    }
    if (adminOnly && !user.roles.includes("admin")) {
      return res.status(403).json({ success: false, code: "FORBIDDEN" });
    }
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) { return next(error); }
}

async function logout(req, res, next) {
  try {
    await promisify(req.session.destroy).call(req.session);
    res.clearCookie(SESSION_COOKIE_NAME, req.app.locals.sessionCookieOptions);
    return res.status(200).json({ success: true });
  } catch (error) { return next(error); }
}

const adminUser = (req, res, next) => currentUser(req, res, next, true);
module.exports = { login, currentUser, logout, adminUser };
