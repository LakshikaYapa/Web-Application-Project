const express = require("express");
const { requireUser } = require("../controllers/session");
const { HelpRequest } = require("../models/HelpRequest");

module.exports = function createPublicHelpRoutes() {
  const router = express.Router();
  router.get("/", async (req, res, next) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || (req.query.page !== undefined && typeof req.query.page !== "string")) return res.status(400).json({ success: false, code: "INVALID_PAGE" });
    try {
      const records = await HelpRequest.find({ status: "approved" }).select("helpType otherHelp nearestTown location description createdAt +claimedBy claimedAt photos.contentType")
        .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 12).limit(13).lean();
      const fields = ["helpType", "otherHelp", "nearestTown", "location", "description", "createdAt", "claimedAt"];
      return res.json({ success: true, page, hasMore: records.length > 12, requests: records.slice(0, 12).map((record) => ({
        id: String(record._id), claimed: Boolean(record.claimedBy), photoCount: record.photos?.length ?? 0,
        ...Object.fromEntries(fields.filter((field) => record[field] !== undefined).map((field) => [field, record[field]])),
      })) });
    } catch (error) { return next(error); }
  });
  router.get("/public/:id/photos/:index", async (req, res, next) => {
    const { id, index } = req.params;
    if (!/^[a-f\d]{24}$/i.test(id) || !/^[0-2]$/.test(index)) return res.status(404).json({ success: false, code: "PHOTO_NOT_FOUND" });
    try {
      const request = await HelpRequest.findOne({ _id: id, status: "approved" }).select("+photos");
      const photo = request?.photos?.[Number(index)];
      if (!photo?.data?.length || !["image/jpeg", "image/png", "image/webp"].includes(photo.contentType)) return res.status(404).json({ success: false, code: "PHOTO_NOT_FOUND" });
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Content-Disposition", "inline");
      return res.type(photo.contentType).send(photo.data);
    } catch (error) { return next(error); }
  });
  router.post("/:id/claim", (req, res, next) => {
    if (req.get("X-CSRF-Protection") !== "1") return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    return next();
  }, requireUser, async (req, res, next) => {
    if (!req.user.roles.some((role) => ["volunteer", "funder"].includes(role))) return res.status(403).json({ success: false, code: "HELPER_REQUIRED" });
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(404).json({ success: false, code: "REQUEST_NOT_FOUND" });
    if (req.body !== undefined && (typeof req.body !== "object" || req.body === null || Array.isArray(req.body) || Object.keys(req.body).length)) return res.status(400).json({ success: false, code: "INVALID_BODY" });
    try {
      // A single conditional update prevents two helpers from claiming the same request.
      const request = await HelpRequest.findOneAndUpdate({ _id: req.params.id, status: "approved", claimedBy: null, requester: { $ne: req.user.id } },
        { $set: { claimedBy: req.user.id, claimedAt: new Date() } }, { new: true, runValidators: true }).select("_id");
      if (!request) return res.status(409).json({ success: false, code: "REQUEST_UNAVAILABLE" });
      return res.json({ success: true });
    } catch (error) { return next(error); }
  });
  return router;
};
