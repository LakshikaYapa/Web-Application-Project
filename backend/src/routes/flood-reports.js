const express = require("express");
const multer = require("multer");
const { rateLimit } = require("express-rate-limit");
const { requireUser } = require("../controllers/session");
const { FloodReport, REPORT_SITUATIONS } = require("../models/FloodReport");
const { matchesImageType } = require("../validation/help-photos");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: 5 * 1024 * 1024, fields: 10, fieldSize: 8192, parts: 13 },
  fileFilter(_req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return callback(new Error("Unsupported photo"));
    return callback(null, true);
  },
}).array("photos", 3);

module.exports = function createFloodReportRoutes() {
  const router = express.Router();
  router.get("/", async (req, res, next) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || (req.query.page !== undefined && typeof req.query.page !== "string")) return res.status(400).json({ success: false, code: "INVALID_PAGE" });
    try {
      const records = await FloodReport.find({ status: "approved" }).select("nearestTown location situations otherSituation description createdAt photos.contentType")
        .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 12).limit(13).lean();
      const fields = ["nearestTown", "location", "situations", "otherSituation", "description", "createdAt"];
      return res.json({ success: true, page, hasMore: records.length > 12, reports: records.slice(0, 12).map((record) => ({
        id: String(record._id), photoCount: record.photos?.length ?? 0,
        ...Object.fromEntries(fields.filter((key) => record[key] !== undefined).map((key) => [key, record[key]])),
      })) });
    } catch (error) { return next(error); }
  });
  router.get("/:id/photos/:index", async (req, res, next) => {
    const { id, index } = req.params;
    if (!/^[a-f\d]{24}$/i.test(id) || !/^[0-2]$/.test(index)) return res.status(404).json({ success: false, code: "PHOTO_NOT_FOUND" });
    try {
      const report = await FloodReport.findOne({ _id: id, status: "approved" }).select("+photos");
      const photo = report?.photos?.[Number(index)];
      if (!photo?.data?.length || !["image/jpeg", "image/png", "image/webp"].includes(photo.contentType)) return res.status(404).json({ success: false, code: "PHOTO_NOT_FOUND" });
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Content-Disposition", "inline");
      return res.type(photo.contentType).send(photo.data);
    } catch (error) { return next(error); }
  });
  router.post("/", (req, res, next) => {
    if (req.get("X-CSRF-Protection") !== "1") return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    return next();
  }, requireUser, rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
    message: { success: false, code: "RATE_LIMITED" },
  }), (req, res, next) => {
    upload(req, res, (error) => {
      if (error) return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ success: false, code: error.code === "LIMIT_FILE_SIZE" ? "PHOTOS_TOO_LARGE" : "INVALID_PHOTOS" });
      if ((req.files || []).some((file) => !matchesImageType(file))) return res.status(400).json({ success: false, code: "INVALID_PHOTOS" });
      return next();
    });
  }, async (req, res, next) => {
    const body = req.body;
    const allowed = ["nearestTown", "location", "description", "phone", "situations", "otherSituation"];
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowed.includes(key))) return res.status(400).json({ success: false, code: "VALIDATION_ERROR" });
    const errors = {};
    const situations = typeof body.situations === "string" ? [body.situations] : body.situations;
    if (!Array.isArray(situations) || !situations.length || situations.length > 4 || new Set(situations).size !== situations.length || situations.some((value) => !REPORT_SITUATIONS.includes(value))) errors.situations = "Choose valid situations.";
    for (const [field, min, max] of [["nearestTown", 2, 100], ["location", 2, 300], ["description", 10, 2000]]) {
      if (typeof body[field] !== "string" || body[field].trim().length < min || body[field].trim().length > max) errors[field] = `Enter ${min} to ${max} characters.`;
    }
    const phone = typeof body.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(phone)) errors.phone = "Enter a valid Sri Lankan phone number.";
    if (Array.isArray(situations) && situations.includes("other")) {
      if (typeof body.otherSituation !== "string" || !body.otherSituation.trim() || body.otherSituation.trim().length > 200) errors.otherSituation = "Describe the other situation in 1 to 200 characters.";
    } else if (body.otherSituation !== undefined) errors.otherSituation = "Choose Other situation to use this field.";
    if (Object.keys(errors).length) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors });
    try {
      const report = await FloodReport.create({
        reporter: req.user.id,
        phone: phone.startsWith("0") ? `+94${phone.slice(1)}` : phone,
        nearestTown: body.nearestTown.trim(), location: body.location.trim(), description: body.description.trim(),
        situations,
        ...(situations.includes("other") ? { otherSituation: body.otherSituation.trim() } : {}),
        photos: (req.files || []).map((file) => ({ contentType: file.mimetype, data: file.buffer })),
      });
      return res.status(201).json({ success: true, report: { id: report.id, status: report.status, createdAt: report.createdAt, photoCount: report.photos.length } });
    } catch (error) { return next(error); }
  });
  return router;
};
