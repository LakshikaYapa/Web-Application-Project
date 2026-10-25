const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { register } = require("../controllers/auth");

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

module.exports = router;
