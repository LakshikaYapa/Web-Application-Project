const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRegistration } = require("../src/validation/registration");

const account = {
  name: "Example User", email: "test@example.com", password: "a long unique passphrase",
  role: "help_seeker", address: "  123 Test Road  ", nearestTown: "  Kandy  ", phone: "077 123 4567",
};

test("Sri Lankan phone formats normalize to international format", () => {
  for (const phone of ["077 123 4567", "+94 77 123 4567", "(011) 234-5678"]) {
    const result = validateRegistration({ ...account, phone });
    assert.equal(result.errors, undefined);
    assert.match(result.value.phone, /^\+94[1-9]\d{8}$/);
    assert.equal(result.value.address, "123 Test Road");
    assert.equal(result.value.nearestTown, "Kandy");
  }
});

test("missing or invalid contact fields cannot bypass registration validation", () => {
  for (const [field, invalid] of [
    ["address", undefined], ["address", " "], ["address", "x".repeat(301)],
    ["nearestTown", undefined], ["nearestTown", " "], ["nearestTown", { $ne: null }],
    ["phone", undefined], ["phone", "123"], ["phone", "+1 202 555 0100"], ["phone", "077abc1234567"],
  ]) {
    assert.ok(validateRegistration({ ...account, [field]: invalid }).errors[field], field);
  }
});
