const express = require("express");
const { requireUser } = require("../controllers/session");
const { HelpRequest } = require("../models/HelpRequest");
const { FloodReport } = require("../models/FloodReport");
const { Shelter } = require("../models/Shelter");
const Contribution = require("../models/Contribution");

module.exports = function createAdminRoutes() {
  const router = express.Router();
  router.use(requireUser, (req, res, next) => {
    if (!req.user.roles.includes("admin")) return res.status(403).json({ success: false, code: "ADMIN_REQUIRED" });
    return next();
  });
  router.get("/dashboard", async (req, res, next) => {
    try {
      const sections = [["help-requests", HelpRequest, "pending"], ["flood-reports", FloodReport, "pending"], ["shelters", Shelter, "pending"], ["contributions", Contribution, "pending_review"]];
      const counts = Object.fromEntries(await Promise.all(sections.map(async ([key, model, status]) => [key, await model.countDocuments({ status })])));
      return res.json({ success: true, counts });
    } catch (error) { return next(error); }
  });
  router.get("/shelters", async (req, res, next) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || (req.query.page !== undefined && typeof req.query.page !== "string")) return res.status(400).json({ success: false, code: "INVALID_PAGE" });
    try {
      const records = await Shelter.find({ status: "pending" }).select("name nearestTown address +phone capacity occupied facilities otherFacilities createdAt")
        .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(21).lean();
      const fields = ["name", "nearestTown", "address", "phone", "capacity", "occupied", "facilities", "otherFacilities", "createdAt"];
      return res.json({ success: true, page, hasMore: records.length > 20, shelters: records.slice(0, 20).map((record) => ({
        id: String(record._id), ...Object.fromEntries(fields.filter((key) => record[key] !== undefined).map((key) => [key, record[key]])),
      })) });
    } catch (error) { return next(error); }
  });
  return router;
};
