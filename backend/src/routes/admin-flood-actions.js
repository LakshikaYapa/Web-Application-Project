const express = require("express");
const { FloodReport } = require("../models/FloodReport");

// Mounted after the admin router's session and role checks.
module.exports = function createAdminFloodActions() {
  const router = express.Router();
  function protect(req, res, next) {
    if (req.get("X-CSRF-Protection") !== "1") return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(404).json({ success: false, code: "REQUEST_NOT_FOUND" });
    if (req.body !== undefined && (typeof req.body !== "object" || req.body === null || Array.isArray(req.body) || Object.keys(req.body).length)) return res.status(400).json({ success: false, code: "INVALID_BODY" });
    return next();
  }
    router.post("/flood-reports/:id/approve", protect, async (req, res, next) => {
      try {
        const result = await FloodReport.findOneAndUpdate({ _id: req.params.id, status: "pending" }, { $set: { status: "approved" } }, { new: true, runValidators: true }).select("_id");
        if (!result) return res.status(409).json({ success: false, code: "REQUEST_STATUS_CHANGED" });
        return res.json({ success: true });
      } catch (error) { return next(error); }
    });
  router.delete("/flood-reports/:id", protect, async (req, res, next) => {
    try {
      const result = await FloodReport.findOneAndDelete({ _id: req.params.id, status: "pending" });
      if (!result) return res.status(404).json({ success: false, code: "REQUEST_NOT_FOUND" });
      return res.json({ success: true });
    } catch (error) { return next(error); }
  });
  return router;
};
