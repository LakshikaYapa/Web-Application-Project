const mongoose = require("mongoose");

const SUPPLY_TYPES = Object.freeze(["Drinking water", "Dry food", "Clothing", "Bedding & mats", "Hygiene supplies", "Medical supplies", "Other supplies"]);
const schema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, select: false },
  shelterName: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
  nearestTown: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  phone: { type: String, required: true, match: /^\+94[1-9]\d{8}$/, select: false },
  supplies: { type: [{ type: String, enum: SUPPLY_TYPES }], required: true, validate: (values) => values.length > 0 && values.length <= SUPPLY_TYPES.length && new Set(values).size === values.length },
  otherSupplies: { type: String, trim: true, maxlength: 300, required() { return this.supplies.includes("Other supplies"); } },
  details: { type: String, required: true, trim: true, minlength: 5, maxlength: 2000 },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, select: false },
  claimedAt: Date,
}, { timestamps: true, strict: "throw" });
schema.index({ createdAt: -1, _id: -1 });
module.exports = { ShelterSupplyRequest: mongoose.model("ShelterSupplyRequest", schema), SUPPLY_TYPES };
