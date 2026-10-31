const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { requireUser } = require("../controllers/session");
const { ShelterSupplyRequest, SUPPLY_TYPES } = require("../models/ShelterSupplyRequest");

module.exports = function createShelterSupplyRoutes() {
  const router = express.Router();
  router.get("/", async (req, res, next) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || (req.query.page !== undefined && typeof req.query.page !== "string")) return res.status(400).json({ success: false, code: "INVALID_PAGE" });
    try {
      const records = await ShelterSupplyRequest.find({}).select("shelterName nearestTown supplies otherSupplies details createdAt claimedAt +claimedBy")
        .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 12).limit(13).lean();
      const fields = ["shelterName", "nearestTown", "supplies", "otherSupplies", "details", "createdAt", "claimedAt"];
      return res.json({ success: true, page, hasMore: records.length > 12, requests: records.slice(0, 12).map((record) => ({
        id: String(record._id), claimed: Boolean(record.claimedBy), ...Object.fromEntries(fields.filter((field) => record[field] !== undefined).map((field) => [field, record[field]])),
      })) });
    } catch (error) { return next(error); }
  });
  function csrf(req, res, next) {
    if (req.get("X-CSRF-Protection") !== "1") return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    return next();
  }
  router.post("/", csrf, requireUser, rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, code: "RATE_LIMITED" } }), async (req, res, next) => {
    const body = req.body;
    const allowed = ["shelterName", "nearestTown", "phone", "supplies", "otherSupplies", "details"];
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowed.includes(key))) return res.status(400).json({ success: false, code: "VALIDATION_ERROR" });
    const errors = {};
    for (const [field, min, max] of [["shelterName", 2, 150], ["nearestTown", 2, 100], ["details", 5, 2000]]) {
      if (typeof body[field] !== "string" || body[field].trim().length < min || body[field].trim().length > max) errors[field] = `Enter ${min} to ${max} characters.`;
    }
    const phone = typeof body.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(phone)) errors.phone = "Enter a valid Sri Lankan phone number.";
    if (!Array.isArray(body.supplies) || !body.supplies.length || body.supplies.length > SUPPLY_TYPES.length || new Set(body.supplies).size !== body.supplies.length || body.supplies.some((value) => !SUPPLY_TYPES.includes(value))) errors.supplies = "Choose valid supply types.";
    if (Array.isArray(body.supplies) && body.supplies.includes("Other supplies")) {
      if (typeof body.otherSupplies !== "string" || !body.otherSupplies.trim() || body.otherSupplies.trim().length > 300) errors.otherSupplies = "Describe other supplies in 1 to 300 characters.";
    } else if (body.otherSupplies !== undefined) errors.otherSupplies = "Choose Other supplies to use this field.";
    if (Object.keys(errors).length) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors });
    try {
      const request = await ShelterSupplyRequest.create({ requester: req.user.id, shelterName: body.shelterName.trim(), nearestTown: body.nearestTown.trim(), details: body.details.trim(), phone: phone.startsWith("0") ? `+94${phone.slice(1)}` : phone, supplies: body.supplies, ...(body.supplies.includes("Other supplies") ? { otherSupplies: body.otherSupplies.trim() } : {}) });
      return res.status(201).json({ success: true, request: { id: request.id } });
    } catch (error) { return next(error); }
  });
  router.post("/:id/claim", csrf, requireUser, async (req, res, next) => {
    if (!req.user.roles.some((role) => ["volunteer", "funder"].includes(role))) return res.status(403).json({ success: false, code: "HELPER_REQUIRED" });
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(404).json({ success: false, code: "REQUEST_NOT_FOUND" });
    if (req.body !== undefined && (req.body === null || typeof req.body !== "object" || Array.isArray(req.body) || Object.keys(req.body).length)) return res.status(400).json({ success: false, code: "INVALID_BODY" });
    try {
      const result = await ShelterSupplyRequest.findOneAndUpdate({ _id: req.params.id, claimedBy: null, requester: { $ne: req.user.id } }, { $set: { claimedBy: req.user.id, claimedAt: new Date() } }, { new: true, runValidators: true }).select("_id");
      if (!result) return res.status(409).json({ success: false, code: "REQUEST_UNAVAILABLE" });
      return res.json({ success: true });
    } catch (error) { return next(error); }
  });
  return router;
};
