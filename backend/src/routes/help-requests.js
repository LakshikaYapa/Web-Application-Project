const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { requireUser } = require("../controllers/session");
const { HelpRequest, HELP_TYPES } = require("../models/HelpRequest");
const { helpPhotos } = require("../validation/help-photos");

module.exports = function createHelpRequestRoutes() {
  const router = express.Router();
  router.get("/mine", requireUser, async (req, res, next) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || (req.query.page !== undefined && typeof req.query.page !== "string")) {
      return res.status(400).json({ success: false, code: "INVALID_PAGE" });
    }
    try {
      const requests = await HelpRequest.find({ requester: req.user.id })
        .select("helpType otherHelp nearestTown location description status createdAt +phone")
        .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(21).lean();
      return res.json({ success: true, page, hasMore: requests.length > 20, requests: requests.slice(0, 20).map((request) => ({
        id: String(request._id), helpType: request.helpType, nearestTown: request.nearestTown,
        otherHelp: request.otherHelp,
        phone: request.phone,
        location: request.location, description: request.description, status: request.status, createdAt: request.createdAt,
      })) });
    } catch (error) { return next(error); }
  });
  router.post("/", (req, res, next) => {
    if (req.get("X-CSRF-Protection") !== "1") return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    return next();
  }, requireUser, rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
    message: { success: false, code: "RATE_LIMITED", message: "Too many requests. Try again later." },
  }), helpPhotos, async (req, res, next) => {
    const body = req.body;
    const errors = {};
    const fields = { nearestTown: 100, location: 300, description: 2000 };
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors: { body: "Send a JSON object." } });
    }
    if (Object.keys(body).some((key) => !["helpType", "otherHelp", "phone", ...Object.keys(fields)].includes(key))) errors.body = "Unexpected request fields.";
    const phone = typeof body.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(phone)) errors.phone = "Enter a valid Sri Lankan phone number.";
    if (!HELP_TYPES.includes(body.helpType)) errors.helpType = "Choose a valid help type.";
    if (body.helpType === "Other help") {
      if (typeof body.otherHelp !== "string" || !body.otherHelp.trim() || body.otherHelp.trim().length > 200) errors.otherHelp = "Describe the other help in 1 to 200 characters.";
    } else if (body.otherHelp !== undefined) {
      errors.otherHelp = "Use this field only for Other help.";
    }
    for (const [field, max] of Object.entries(fields)) {
      if (typeof body[field] !== "string" || !body[field].trim() || body[field].trim().length > max) errors[field] = `Enter 1 to ${max} characters.`;
    }
    if (Object.keys(errors).length) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors });
    try {
      const request = await HelpRequest.create({
        requester: req.user.id, helpType: body.helpType,
        phone: phone.startsWith("0") ? `+94${phone.slice(1)}` : phone,
        ...(body.helpType === "Other help" ? { otherHelp: body.otherHelp.trim() } : {}),
        nearestTown: body.nearestTown.trim(), location: body.location.trim(), description: body.description.trim(),
        photos: (req.files || []).map((file) => ({ contentType: file.mimetype, data: file.buffer })),
      });
      return res.status(201).json({ success: true, request: { id: request.id, status: request.status, createdAt: request.createdAt, photoCount: request.photos.length } });
    } catch (error) { return next(error); }
  });
  return router;
};
