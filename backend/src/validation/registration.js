const { isPublicRoles } = require("../constants/roles");

const allowedFields = new Set(["name", "email", "password", "roles", "preferredLanguage", "address", "nearestTown", "phone"]);

function validateRegistration(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "A JSON object is required." } };
  }
  const errors = {};
  if (Object.keys(body).some((key) => !allowedFields.has(key))) {
    errors.body = "Unexpected registration fields.";
  }
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 100) {
    errors.name = "Name must contain 2 to 100 characters.";
  }
  if (typeof body.email !== "string" || body.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (typeof body.password !== "string" || !body.password.length || [...body.password].length > 128) {
    errors.password = "Password is required and must not exceed 128 characters.";
  }
  if (!isPublicRoles(body.roles)) {
    errors.roles = "Choose one or more distinct roles: volunteer, help_seeker or funder.";
  }
  if (typeof body.address !== "string" || body.address.trim().length < 5 || body.address.trim().length > 300) {
    errors.address = "Address must contain 5 to 300 characters.";
  }
  if (typeof body.nearestTown !== "string" || body.nearestTown.trim().length < 2 || body.nearestTown.trim().length > 100) {
    errors.nearestTown = "Nearest town must contain 2 to 100 characters.";
  }
  const phone = typeof body.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
  if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(phone)) {
    errors.phone = "Enter a valid Sri Lankan phone number.";
  }
  if (body.preferredLanguage !== undefined && !["en", "si"].includes(body.preferredLanguage)) {
    errors.preferredLanguage = "Choose en or si.";
  }
  if (Object.keys(errors).length) return { errors };

  return {
    value: {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      roles: [...body.roles],
      preferredLanguage: body.preferredLanguage ?? "en",
      address: body.address.trim(),
      nearestTown: body.nearestTown.trim(),
      phone: phone.startsWith("0") ? `+94${phone.slice(1)}` : phone,
    },
  };
}

module.exports = { validateRegistration };
