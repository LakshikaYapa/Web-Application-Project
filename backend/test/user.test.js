const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../src/models/User");
const { PUBLIC_ROLES, isPublicRole } = require("../src/constants/roles");

test("public registration roles exclude admin and unexpected inputs", () => {
  for (const role of PUBLIC_ROLES) assert.equal(isPublicRole(role), true);
  for (const role of ["admin", "ADMIN", "user", "", null, undefined, ["admin"], { role: "admin" }]) {
    assert.equal(isPublicRole(role), false);
  }
});

test("account JSON never exposes an explicitly loaded password hash", async () => {
  const user = new User({
    name: "Test Volunteer",
    email: " Volunteer@Example.COM ",
    passwordHash: "test-hash-not-a-real-password",
    role: "volunteer",
    address: "123 Test Road",
    nearestTown: "Kandy",
    phone: "+94771234567",
  });
  await user.validate();
  assert.equal(user.email, "volunteer@example.com");
  const response = JSON.parse(JSON.stringify(user));
  assert.equal(Object.hasOwn(response, "passwordHash"), false);
  assert.equal(Object.hasOwn(response, "__v"), false);
  assert.equal(Object.hasOwn(response, "address"), false);
  assert.equal(Object.hasOwn(response, "phone"), false);
  assert.equal(response.role, "volunteer");
  assert.equal(User.schema.path("passwordHash").options.select, false);
});

test("account cannot silently accept an unknown role or extra privileges", async () => {
  const user = new User({ name: "Test", email: "test@example.com", passwordHash: "test-hash", role: "superadmin" });
  await assert.rejects(user.validate(), (error) => Boolean(error.errors.role));
  assert.throws(() => new User({ isAdmin: true }), /not in schema/);
});
