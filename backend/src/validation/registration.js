const { isPublicRole } = require("../constants/roles");

const allowedFields = new Set(["name", "email", "password", "role", "preferredLanguage"]);

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
  if (typeof body.password !== "string" || [...body.password].length < 15 || [...body.password].length > 128) {
    errors.password = "Password must contain 15 to 128 characters.";
  }
  if (!isPublicRole(body.role)) {
    errors.role = "Choose volunteer, help_seeker or funder.";
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
      role: body.role,
      preferredLanguage: body.preferredLanguage ?? "en",
    },
  };
}

module.exports = { validateRegistration };
