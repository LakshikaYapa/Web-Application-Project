const mongoose = require("mongoose");

const SHELTER_FACILITIES = Object.freeze(["water", "toilets", "electricity", "first_aid", "sleeping", "other"]);

const schema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
  nearestTown: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  address: { type: String, required: true, trim: true, minlength: 5, maxlength: 300 },
  phone: { type: String, required: true, match: /^\+94[1-9]\d{8}$/, select: false },
  capacity: { type: Number, required: true, min: 1, max: 100000, validate: Number.isInteger },
  occupied: {
    type: Number, required: true, min: 0, max: 100000,
    validate: {
      validator(value) { return Number.isInteger(value) && value <= this.capacity; },
      message: "Current occupancy cannot exceed total capacity.",
    },
  },
  facilities: {
    type: [{ type: String, enum: SHELTER_FACILITIES }],
    default: [],
    validate: (values) => values.length <= SHELTER_FACILITIES.length && new Set(values).size === values.length,
  },
  otherFacilities: {
    type: String, trim: true, maxlength: 500,
    required() { return this.facilities.includes("other"); },
    validate: {
      validator(value) { return !value || this.facilities.includes("other"); },
      message: "Choose Other facilities to add custom details.",
    },
  },
  status: { type: String, enum: ["pending"], default: "pending" },
}, { timestamps: true, strict: "throw" });

schema.index({ submittedBy: 1, createdAt: -1, _id: -1 });

module.exports = { Shelter: mongoose.model("Shelter", schema), SHELTER_FACILITIES };
