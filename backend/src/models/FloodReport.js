const mongoose = require("mongoose");

const REPORT_SITUATIONS = Object.freeze(["road", "homes", "rising_water", "other"]);

const schema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  phone: { type: String, required: true, match: /^\+94[1-9]\d{8}$/, select: false },
  nearestTown: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  location: { type: String, required: true, trim: true, minlength: 2, maxlength: 300 },
  situations: {
    type: [{ type: String, enum: REPORT_SITUATIONS }],
    required: true,
    validate: (values) => values.length > 0 && values.length <= REPORT_SITUATIONS.length && new Set(values).size === values.length,
  },
  otherSituation: {
    type: String,
    trim: true,
    maxlength: 200,
    required() { return this.situations.includes("other"); },
  },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
  photos: {
    type: [new mongoose.Schema({
      contentType: { type: String, enum: ["image/jpeg", "image/png", "image/webp"], required: true },
      data: { type: Buffer, required: true },
    }, { _id: false })],
    default: [],
    select: false,
    validate: (photos) => photos.length <= 3 && photos.every((photo) => photo.data.length > 0 && photo.data.length <= 5 * 1024 * 1024),
  },
}, { timestamps: true, strict: "throw" });

schema.index({ reporter: 1, createdAt: -1, _id: -1 });

module.exports = { FloodReport: mongoose.model("FloodReport", schema), REPORT_SITUATIONS };
