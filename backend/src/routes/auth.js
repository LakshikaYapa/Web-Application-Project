const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { register } = require("../controllers/auth");
const { login, currentUser, logout, adminUser } = require("../controllers/session");

function createAuthRoutes() {
  const router = express.Router();
  // In-memory limiter suits the current single backend process. Use a shared
  // store and configure trusted proxies before deploying multiple instances.
  router.post("/register", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, code: "RATE_LIMITED", message: "Too many registration attempts. Try again later." },
  }), register);

  // A custom header cannot be sent by a cross-origin HTML form. No CORS policy
  // grants other origins access; the browser clients use the same-origin proxy.
  function protectSessionMutation(req, res, next) {
    if (req.get("X-CSRF-Protection") !== "1") {
      return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    }
    return next();
  }

  router.post("/login", protectSessionMutation, rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, code: "RATE_LIMITED", message: "Too many sign-in attempts. Try again later." },
  }), login);
  router.get("/me", currentUser);
  router.get("/admin", adminUser);
  router.post("/logout", protectSessionMutation, logout);
  return router;
}

module.exports = createAuthRoutes;
