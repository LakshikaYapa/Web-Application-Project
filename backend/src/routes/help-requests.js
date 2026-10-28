const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { requireUser } = require("../controllers/session");
const { HelpRequest, HELP_TYPES } = require("../models/HelpRequest");

module.exports = function createHelpRequestRoutes() {
  const router = express.Router();
  router.post("/", (req, res, next) => {
    if (req.get("X-CSRF-Protection") !== "1") return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    return next();
  }, requireUser, rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
    message: { success: false, code: "RATE_LIMITED", message: "Too many requests. Try again later." },
  }), async (req, res, next) => {
    const body = req.body;
    const errors = {};
    const fields = { nearestTown: 100, location: 300, description: 2000 };
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors: { body: "Send a JSON object." } });
    }
    if (Object.keys(body).some((key) => !["helpType", ...Object.keys(fields)].includes(key))) errors.body = "Unexpected request fields.";
    if (!HELP_TYPES.includes(body.helpType)) errors.helpType = "Choose a valid help type.";
    for (const [field, max] of Object.entries(fields)) {
      if (typeof body[field] !== "string" || !body[field].trim() || body[field].trim().length > max) errors[field] = `Enter 1 to ${max} characters.`;
    }
    if (Object.keys(errors).length) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors });
    try {
      const request = await HelpRequest.create({
        requester: req.user.id, helpType: body.helpType,
        nearestTown: body.nearestTown.trim(), location: body.location.trim(), description: body.description.trim(),
      });
      return res.status(201).json({ success: true, request: { id: request.id, status: request.status, createdAt: request.createdAt } });
    } catch (error) { return next(error); }
  });
  return router;
};
