const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { Shelter } = require("../src/models/Shelter");
const { hashPassword } = require("../src/utils/password");

test("shelter submission validates occupancy and facilities and uses the active session owner", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "shelter-test-secret-at-least-32-characters", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["volunteer"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const create = t.mock.method(Shelter, "create", async (data) => {
    const doc = new Shelter(data);
    await doc.validate();
    return doc;
  });
  const valid = { name: " Community Hall ", nearestTown: " Kandy ", address: "10 Main Road", phone: "077 123 4567", capacity: 100, occupied: 20, facilities: ["water", "other"], otherFacilities: " Accessible entrance " };
  const send = (data, cookie, csrf = true) => fetch(base + "/api/shelters", { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { "X-CSRF-Protection": "1" } : {}) }, body: JSON.stringify(data) });
  try {
    assert.equal((await send(valid)).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await send(valid, cookie, false)).status, 403);
    const response = await send(valid, cookie);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const result = (await response.json()).shelter;
    assert.ok(result.id);
    assert.equal(result.status, "pending");
    assert.equal(result.phone, undefined);
    assert.equal(result.submittedBy, undefined);
    const saved = create.mock.calls[0].arguments[0];
    assert.equal(saved.submittedBy, account.id);
    assert.equal(saved.name, "Community Hall");
    assert.equal(saved.phone, "+94771234567");
    assert.equal(saved.otherFacilities, "Accessible entrance");
    const simple = { ...valid, facilities: [], otherFacilities: undefined, occupied: 100 };
    assert.equal((await send(simple, cookie)).status, 201);
    for (const changes of [{occupied: 101}, {capacity: 0}, {occupied: 1.5}, {capacity: "100"}, {phone: "bad"}, {facilities: ["unknown"]}, {facilities: ["water", "water"]}, {otherFacilities: " "}]) assert.equal((await send({...valid, ...changes}, cookie)).status, 400);
    assert.equal(create.mock.callCount(), 2);
    account.status = "suspended";
    assert.equal((await send(valid, cookie)).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
