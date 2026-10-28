const { test, before, after, mock } = require("node:test");
const assert = require("node:assert/strict");
const { scrypt } = require("node:crypto");
const { promisify } = require("node:util");
const { createApp } = require("../src/app");
const session = require("express-session");
const app = createApp({ sessionStore: new session.MemoryStore(), sessionSecret: "test-only-registration-session-secret", secureCookies: false });
const User = require("../src/models/User");
const { hashPassword } = require("../src/utils/password");

let server;
let baseUrl;
const valid = { name: "Test Volunteer", email: " Volunteer@Example.COM ", password: "a", roles: ["volunteer"], address: "123 Test Road", nearestTown: "Kandy", phone: "077 123 4567" };

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/auth/register`;
});
after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function post(body) {
  return fetch(baseUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

test("scrypt uses random salts and derives the expected password key", async () => {
  const first = await hashPassword(valid.password);
  const second = await hashPassword(valid.password);
  assert.notEqual(first, second);
  const [algorithm, N, r, p, salt, key] = first.split("$");
  assert.equal(algorithm, "scrypt");
  assert.equal(salt.length, 32);
  const derived = await promisify(scrypt)(valid.password, salt, 64, { N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  assert.equal(derived.toString("hex"), key);
});

test("registration permits each public role and never exposes password data", async () => {
  const create = mock.method(User, "create", async (data) => new User(data));
  try {
    for (const roles of [["volunteer"], ["help_seeker"], ["funder"], ["volunteer", "funder"], ["volunteer", "help_seeker", "funder"]]) {
      const response = await post({ ...valid, roles, preferredLanguage: "si" });
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.deepEqual(body.user.roles, roles);
      assert.equal(body.user.email, "volunteer@example.com");
      assert.equal(body.user.preferredLanguage, "si");
      assert.equal(Object.hasOwn(body.user, "passwordHash"), false);
      assert.equal(Object.hasOwn(body.user, "password"), false);
      assert.equal(Object.hasOwn(body.user, "phone"), false);
      assert.equal(Object.hasOwn(body.user, "address"), false);
    }
    const saved = create.mock.calls[0].arguments[0];
    assert.match(saved.passwordHash, /^scrypt\$32768\$8\$3\$/);
    assert.equal(Object.hasOwn(saved, "password"), false);
    assert.equal(Object.hasOwn(saved, "status"), false);
    assert.equal(saved.phone, "+94771234567");
    assert.equal(saved.address, valid.address);
    assert.equal(saved.nearestTown, valid.nearestTown);
  } finally { create.mock.restore(); }
});

test("invalid bodies and privilege escalation are rejected before persistence", async () => {
  const create = mock.method(User, "create", () => { throw new Error("Must not persist invalid input"); });
  try {
    for (const body of [
      { ...valid, roles: ["volunteer", "admin"] },
      { ...valid, status: "active", isAdmin: true },
      { ...valid, email: { $ne: null } },
      { ...valid, password: "" },
    ]) {
      const response = await post(body);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).code, "VALIDATION_ERROR");
    }
    assert.equal(create.mock.callCount(), 0);
  } finally { create.mock.restore(); }
});

test("duplicate-email database conflicts return a safe response", async () => {
  const create = mock.method(User, "create", async () => { throw Object.assign(new Error("private database detail"), { code: 11000 }); });
  try {
    const response = await post(valid);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, "EMAIL_IN_USE");
  } finally { create.mock.restore(); }
});

test("malformed JSON returns JSON and the registration limit returns 429", async () => {
  const malformed = await fetch(baseUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).code, "INVALID_JSON");
  let response;
  for (let attempt = 0; attempt < 11; attempt++) {
    response = await post({});
    if (response.status === 429) break;
  }
  assert.equal(response.status, 429);
  assert.equal((await response.json()).code, "RATE_LIMITED");
  assert.ok(response.headers.has("retry-after"));
});
