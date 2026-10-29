const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { FloodReport } = require("../src/models/FloodReport");
const { hashPassword } = require("../src/utils/password");

test("flood reports require an active owner, validate fields and protect uploaded photos", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "flood-report-test-secret-at-least-32-characters", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["volunteer"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const create = t.mock.method(FloodReport, "create", async (data) => {
    const doc = new FloodReport(data);
    await doc.validate();
    return doc;
  });
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
  function form(changes = {}, bytes) {
    const data = new FormData();
    const fields = { nearestTown: " Colombo ", location: " Main road ", description: "Water covers the road.", phone: "077 123 4567", situations: ["road", "rising_water"], ...changes };
    for (const [key, value] of Object.entries(fields)) for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
    if (bytes) data.append("photos", new Blob([bytes], { type: "image/png" }), "photo.png");
    return data;
  }
  const send = (data, cookie, csrf = true) => fetch(base + "/api/flood-reports", { method: "POST", headers: { ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { "X-CSRF-Protection": "1" } : {}) }, body: data });
  try {
    assert.equal((await send(form())).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await send(form(), cookie, false)).status, 403);
    const response = await send(form({}, png), cookie);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const result = (await response.json()).report;
    assert.equal(result.status, "pending");
    assert.equal(result.photoCount, 1);
    assert.ok(result.id);
    assert.equal(result.phone, undefined);
    assert.equal(result.photos, undefined);
    const saved = create.mock.calls[0].arguments[0];
    assert.equal(saved.reporter, account.id);
    assert.equal(saved.phone, "+94771234567");
    assert.equal(saved.nearestTown, "Colombo");
    assert.deepEqual(saved.photos[0].data, png);
    assert.equal((await send(form({ situations: "other", otherSituation: "Damaged bridge" }), cookie)).status, 201);
    for (const changes of [{ situations: ["road", "road"] }, { situations: "unknown" }, { situations: "other" }, { phone: "123" }, { status: "approved" }]) assert.equal((await send(form(changes), cookie)).status, 400);
    assert.equal((await send(form({}, Buffer.from("fake PNG")), cookie)).status, 400);
    assert.equal((await send(form({}, Buffer.alloc(5 * 1024 * 1024 + 1)), cookie)).status, 413);
    assert.equal(create.mock.callCount(), 2);
    account.status = "suspended";
    assert.equal((await send(form(), cookie)).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
