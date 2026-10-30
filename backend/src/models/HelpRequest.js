const mongoose = require("mongoose");

const HELP_TYPES = Object.freeze(["Food and drinking water", "Shelter", "Rescue or transport", "Medical assistance", "Other help"]);
const schema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  phone: { type: String, required: true, match: /^\+94[1-9]\d{8}$/, select: false },
  helpType: { type: String, enum: HELP_TYPES, required: true },
  otherHelp: { type: String, trim: true, maxlength: 200, required() { return this.helpType === "Other help"; } },
  nearestTown: { type: String, required: true, trim: true, maxlength: 100 },
  location: { type: String, required: true, trim: true, maxlength: 300 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, select: false },
  claimedAt: { type: Date },
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
schema.index({ requester: 1, createdAt: -1, _id: -1 });

module.exports = { HelpRequest: mongoose.model("HelpRequest", schema), HELP_TYPES };
