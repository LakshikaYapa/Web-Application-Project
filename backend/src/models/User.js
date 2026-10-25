const mongoose = require("mongoose");
const { ACCOUNT_ROLES } = require("../constants/roles");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
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
    role: { type: String, required: true, enum: ACCOUNT_ROLES },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    preferredLanguage: { type: String, enum: ["en", "si"], default: "en" },
  },
  {
    timestamps: true,
    strict: "throw",
    toJSON: {
      transform(_document, result) {
        // Also protect responses after login explicitly selects passwordHash.
        delete result.passwordHash;
        delete result.__v;
        return result;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
