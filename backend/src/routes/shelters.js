const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { requireUser } = require("../controllers/session");
const { Shelter, SHELTER_FACILITIES } = require("../models/Shelter");

module.exports = function createShelterRoutes() {
  const router = express.Router();
  router.post("/", (req, res, next) => {
    if (req.get("X-CSRF-Protection") !== "1") return res.status(403).json({ success: false, code: "CSRF_REJECTED" });
    return next();
  }, requireUser, rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
    message: { success: false, code: "RATE_LIMITED" },
  }), async (req, res, next) => {
    const body = req.body;
    const allowed = ["name", "nearestTown", "address", "phone", "capacity", "occupied", "facilities", "otherFacilities"];
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowed.includes(key))) return res.status(400).json({ success: false, code: "VALIDATION_ERROR" });
    const errors = {};
    for (const [field, min, max] of [["name", 2, 150], ["nearestTown", 2, 100], ["address", 5, 300]]) {
      if (typeof body[field] !== "string" || body[field].trim().length < min || body[field].trim().length > max) errors[field] = `Enter ${min} to ${max} characters.`;
    }
    const phone = typeof body.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(phone)) errors.phone = "Enter a valid Sri Lankan phone number.";
    if (!Number.isInteger(body.capacity) || body.capacity < 1 || body.capacity > 100000) errors.capacity = "Enter a whole number from 1 to 100000.";
    if (!Number.isInteger(body.occupied) || body.occupied < 0 || body.occupied > 100000 || body.occupied > body.capacity) errors.occupied = "Occupancy must be a nonnegative whole number within capacity.";
    const facilities = body.facilities === undefined ? [] : body.facilities;
    if (!Array.isArray(facilities) || facilities.length > SHELTER_FACILITIES.length || new Set(facilities).size !== facilities.length || facilities.some((value) => !SHELTER_FACILITIES.includes(value))) errors.facilities = "Choose valid facilities.";
    if (Array.isArray(facilities) && facilities.includes("other")) {
      if (typeof body.otherFacilities !== "string" || !body.otherFacilities.trim() || body.otherFacilities.trim().length > 500) errors.otherFacilities = "Describe other facilities in 1 to 500 characters.";
    } else if (body.otherFacilities !== undefined) errors.otherFacilities = "Choose Other facilities to use this field.";
    if (Object.keys(errors).length) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", errors });
    try {
      const shelter = await Shelter.create({
        submittedBy: req.user.id,
        name: body.name.trim(), nearestTown: body.nearestTown.trim(), address: body.address.trim(),
        phone: phone.startsWith("0") ? `+94${phone.slice(1)}` : phone,
        capacity: body.capacity, occupied: body.occupied, facilities,
        ...(facilities.includes("other") ? { otherFacilities: body.otherFacilities.trim() } : {}),
      });
      return res.status(201).json({ success: true, shelter: { id: shelter.id, status: shelter.status, createdAt: shelter.createdAt } });
    } catch (error) { return next(error); }
  });
  return router;
};
