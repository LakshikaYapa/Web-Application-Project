function validCoordinates(latitude, longitude) {
  return typeof latitude === "number" && Number.isFinite(latitude) && latitude >= 5.85 && latitude <= 9.95
    && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= 79.5 && longitude <= 82.05;
}
module.exports = { validCoordinates };
