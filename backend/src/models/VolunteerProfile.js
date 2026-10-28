const mongoose = require("mongoose");
const { AREA_SKILLS } = require("../validation/volunteer");

const supportSchema = new mongoose.Schema({
  area: { type: String, enum: Object.keys(AREA_SKILLS), required: true },
  skills: { type: [String], required: true, validate: (skills) => skills.length > 0 },
  otherSkills: { type: String, maxlength: 500, default: "" },
  otherSupport: { type: String, maxlength: 200, default: "" },
}, { _id: false, strict: "throw" });

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  nearestTown: { type: String, required: true, trim: true, maxlength: 100 },
  supportAreas: { type: [supportSchema], required: true, validate: (areas) => areas.length > 0 && areas.length <= 4 },
}, { timestamps: true, strict: "throw" });

module.exports = mongoose.model("VolunteerProfile", schema);
