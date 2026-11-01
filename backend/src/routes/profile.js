const express = require("express");
const multer = require("multer");
const { requireUser } = require("../controllers/session");
const { matchesImageType } = require("../validation/help-photos");
const User = require("../models/User");
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: 5 * 1024 * 1024, fields: 0, parts: 1 } }).single("photo");
module.exports = function profileRoutes() {
  const router = express.Router();
  router.get("/:id/photo", async (req, res, next) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.sendStatus(404);
    try {
      const user = await User.findById(req.params.id).select("status roles +profilePhoto");
      const own = String(req.session.userId || "") === req.params.id;
      if (!user || user.status !== "active" || (!own && !user.roles.some(role => ["volunteer", "funder"].includes(role))) || !user.profilePhoto?.data?.length) return res.sendStatus(404);
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Content-Disposition", "inline");
      return res.type(user.profilePhoto.contentType).send(user.profilePhoto.data);
    } catch (error) { return next(error); }
  });
  router.use((req, res, next) => req.get("X-CSRF-Protection") === "1" ? next() : res.status(403).json({ success: false, code: "CSRF_REJECTED" }), requireUser);
  router.put("/photo", (req, res, next) => upload(req, res, error => {
    if (error || !req.file || !matchesImageType(req.file)) return res.status(error?.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ success: false, code: "INVALID_PHOTO" });
    return next();
  }), async (req, res, next) => {
    try {
      const version = Date.now();
      await User.updateOne({ _id: req.user.id, status: "active" }, { $set: { profilePhoto: { contentType: req.file.mimetype, data: req.file.buffer }, photoVersion: version } }, { runValidators: true });
      return res.json({ success: true, photoUrl: `/api/profile/${req.user.id}/photo?v=${version}` });
    } catch (error) { return next(error); }
  });
  router.delete("/photo", async (req, res, next) => {
    try {
      await User.updateOne({ _id: req.user.id, status: "active" }, { $unset: { profilePhoto: 1, photoVersion: 1 } });
      return res.json({ success: true });
    } catch (error) { return next(error); }
  });
  return router;
};
