const multer = require("multer");

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: MAX_PHOTO_SIZE, fields: 6, fieldSize: 8192, parts: 9 },
  fileFilter(_req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(Object.assign(new Error("Unsupported image type"), { code: "INVALID_PHOTOS" }));
    }
    return callback(null, true);
  },
}).array("photos", 3);

// Verify bytes as well as the client-supplied MIME type. Do not accept SVG/HTML.
function matchesImageType(file) {
  const bytes = file.buffer;
  if (!bytes?.length || bytes.length > MAX_PHOTO_SIZE) return false;
  if (file.mimetype === "image/png") return bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString("ascii", 12, 16) === "IHDR";
  if (file.mimetype === "image/jpeg") return bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
  return file.mimetype === "image/webp" && bytes.length >= 16 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}

function helpPhotos(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      return res.status(tooLarge ? 413 : 400).json({ success: false, code: tooLarge ? "PHOTOS_TOO_LARGE" : "INVALID_PHOTOS" });
    }
    if ((req.files || []).some((file) => !matchesImageType(file))) return res.status(400).json({ success: false, code: "INVALID_PHOTOS" });
    return next();
  });
}

module.exports = { helpPhotos };
