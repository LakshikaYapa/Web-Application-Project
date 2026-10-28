const User = require("../models/User");
const { hashPassword } = require("../utils/password");
const { validateRegistration } = require("../validation/registration");

async function register(req, res, next) {
  const { errors, value } = validateRegistration(req.body);
  if (errors) {
    return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors });
  }
  try {
    const passwordHash = await hashPassword(value.password);
    // Explicit fields prevent clients from assigning admin privileges or status.
    const user = await User.create({
      name: value.name,
      email: value.email,
      passwordHash,
      roles: value.roles,
      preferredLanguage: value.preferredLanguage,
      address: value.address,
      nearestTown: value.nearestTown,
      phone: value.phone,
    });
    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    // The unique database index also handles concurrent duplicate registrations.
    if (error.code === 11000) {
      return res.status(409).json({ success: false, code: "EMAIL_IN_USE", message: "An account already uses this email address." });
    }
    return next(error);
  }
}

module.exports = { register };
