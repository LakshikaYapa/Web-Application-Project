const mongoose = require("mongoose");
const { ACCOUNT_ROLES } = require("../constants/roles");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    address: { type: String, required: true, trim: true, minlength: 5, maxlength: 300, select: false },
    nearestTown: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: { type: String, required: true, match: /^\+94[1-9]\d{8}$/, select: false },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      unique: true,
    },
    // The authentication service will hash passwords before creating users.
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [{ type: String, enum: ACCOUNT_ROLES }],
      required: true,
      default: undefined,
      validate: {
        validator: (roles) => Array.isArray(roles) && roles.length > 0 && roles.length <= ACCOUNT_ROLES.length && new Set(roles).size === roles.length,
        message: "Choose at least one distinct account role.",
      },
    },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    profilePhoto: { type: new mongoose.Schema({ contentType: { type: String, enum: ["image/jpeg", "image/png", "image/webp"], required: true }, data: { type: Buffer, required: true } }, { _id: false }), select: false },
    photoVersion: { type: Number },
    preferredLanguage: { type: String, enum: ["en", "si"], default: "en" },
  },
  {
    timestamps: true,
    strict: "throw",
    toJSON: {
      transform(_document, result) {
        // Also protect responses after login explicitly selects passwordHash.
        delete result.profilePhoto;
        delete result.passwordHash;
        delete result.address;
        delete result.phone;
        delete result.__v;
        delete result.role; // Legacy single-role records are migrated separately.
        return result;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
