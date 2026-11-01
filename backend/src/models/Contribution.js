const mongoose = require("mongoose");
const { SUPPORT_TYPES } = require("../validation/contribution");
const financial = function () { return this.supportTypes?.includes("financial"); };
const schema = new mongoose.Schema({
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  supportTypes: { type: [{ type: String, enum: SUPPORT_TYPES }], required: true, validate: (types) => types.length > 0 && types.length <= SUPPORT_TYPES.length && new Set(types).size === types.length },
  nearestTown: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, match: /^\+94[1-9]\d{8}$/, select: false },
  otherSupport: { type: String, trim: true, maxlength: 500, default: "" },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  amountMinor: { type: Number, required: financial, min: 1, max: 999999999999, validate: Number.isSafeInteger },
  currency: { type: String, enum: ["LKR"], required: financial },
  receipt: {
    type: new mongoose.Schema({
      contentType: { type: String, enum: ["image/jpeg", "image/png", "image/webp", "application/pdf"], required: true },
      data: { type: Buffer, required: true, validate: (data) => data.length > 0 && data.length <= 5 * 1024 * 1024 },
    }, { _id: false }),
    select: false, required: financial,
  },
  status: { type: String, enum: ["pending_review", "approved"], default: "pending_review" },
}, { timestamps: true, strict: "throw" });
schema.index({ contributor: 1, createdAt: -1, _id: -1 });
module.exports = mongoose.model("Contribution", schema);
