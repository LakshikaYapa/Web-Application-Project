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
  return router;
};
