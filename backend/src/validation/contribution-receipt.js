const multer = require("multer");
const { matchesImageType } = require("./help-photos");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10, fieldSize: 8192, parts: 11 },
  fileFilter(_req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.mimetype)) return callback(new Error("Invalid receipt type"));
    return callback(null, true);
  },
}).single("receipt");

module.exports = function contributionReceipt(req, res, next) {
  upload(req, res, (error) => {
    if (error) return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ success: false, code: error.code === "LIMIT_FILE_SIZE" ? "RECEIPT_TOO_LARGE" : "INVALID_RECEIPT" });
    if (req.file) {
      const file = req.file;
      const valid = file.mimetype === "application/pdf"
        ? file.buffer.subarray(0, 5).toString("ascii") === "%PDF-" && /%%EOF\s*$/.test(file.buffer.subarray(-1024).toString("latin1"))
        : matchesImageType(file);
      if (!valid) return res.status(400).json({ success: false, code: "INVALID_RECEIPT" });
    }
    return next();
  });
};
