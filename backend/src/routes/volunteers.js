const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { requireUser } = require("../controllers/session");
const { validateVolunteer } = require("../validation/volunteer");
const VolunteerProfile = require("../models/VolunteerProfile");

module.exports = function createVolunteerRoutes() {
  const router = express.Router();
  router.get("/", async (_req, res, next) => {
    try {
      const records = await VolunteerProfile.find({ status: "joined" }).select("user nearestTown supportAreas.area")
        .populate({ path: "user", select: "name photoVersion", match: { status: "active" } })
        .sort({ createdAt: -1, _id: -1 }).limit(4).lean();
      return res.json({ success: true, volunteers: records.filter((record) => record.user).map((record) => ({
        id: String(record._id), name: record.user.name, ...(record.user.photoVersion ? { photoUrl: `/api/profile/${record.user._id}/photo?v=${record.user.photoVersion}` } : {}), nearestTown: record.nearestTown,
        supportAreas: (record.supportAreas || []).map((item) => item.area),
      })) });
    } catch (error) { return next(error); }
  });
  router.get("/me", requireUser, async (req, res, next) => {
    try {
      const profile = await VolunteerProfile.findOne({ user: req.user.id }).select("nearestTown supportAreas updatedAt");
      return res.json({ success: true, profile: profile ? {
        id: profile.id, nearestTown: profile.nearestTown, updatedAt: profile.updatedAt,
        areas: Object.fromEntries(profile.supportAreas.map((item) => [item.area, {
          skills: [...item.skills], otherSkills: item.otherSkills || "", otherSupport: item.otherSupport || "",
        }])),
      } : null });
    } catch (error) { return next(error); }
  });
  router.put("/me", (req, res, next) => {
    if (req.get("X-CSRF-Protection") !== "1") return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    return next();
  }, requireUser, rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
    message: { success: false, code: "RATE_LIMITED", message: "Too many attempts. Try again later." },
  }), async (req, res, next) => {
    const { errors, value } = validateVolunteer(req.body);
    if (errors) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors });
    try {
      const profile = await VolunteerProfile.findOneAndUpdate(
        { user: req.user.id }, { $set: value },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
      );
      return res.json({ success: true, profile: { id: profile.id, updatedAt: profile.updatedAt } });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ success: false, code: "SAVE_CONFLICT", message: "Please try saving again." });
      return next(error);
    }
  });
  return router;
};
