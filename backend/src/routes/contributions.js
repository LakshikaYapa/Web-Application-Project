const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { requireUser } = require("../controllers/session");
const contributionReceipt = require("../validation/contribution-receipt");
const { validateContribution } = require("../validation/contribution");
const Contribution = require("../models/Contribution");

module.exports = function createContributionRoutes() {
  const router = express.Router();
  router.post("/", (req, res, next) => {
    if (req.get("X-CSRF-Protection") !== "1") return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    return next();
  }, requireUser, rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
    message: { success: false, code: "RATE_LIMITED", message: "Too many attempts. Try again later." },
  }), contributionReceipt, async (req, res, next) => {
    const { errors, value } = validateContribution(req.body, req.file);
    if (errors) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors });
    try {
      const contribution = await Contribution.create({ ...value, contributor: req.user.id });
      return res.status(201).json({ success: true, contribution: { id: contribution.id, status: contribution.status, createdAt: contribution.createdAt } });
    } catch (error) { return next(error); }
  });
  return router;
};
