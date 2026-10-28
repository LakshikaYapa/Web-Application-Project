const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { HelpRequest } = require("../src/models/HelpRequest");
const { hashPassword } = require("../src/utils/password");

test("help requests enforce sessions, validate fields and save the authenticated owner", async (t) => {
  const store = new session.MemoryStore();
  const app = createApp({ sessionStore: store, sessionSecret: "help-request-test-secret-at-least-32-chars", secureCookies: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  let active = true;
  const account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["help_seeker"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => ({ ...account, status: active ? "active" : "suspended" }));
  const create = t.mock.method(HelpRequest, "create", async (data) => new HelpRequest(data));
  const base = `http://127.0.0.1:${server.address().port}`;
  const valid = { helpType: "Shelter", nearestTown: " Kandy ", location: "Near town hall", description: "We need shelter for our family." };
  const post = (path, body, cookie, csrf = true) => fetch(base + path, {
    method: "POST", headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Protection": "1" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await post("/api/help-requests", valid)).status, 401);
    const login = await post("/api/auth/login", { email: account.email, password: "test" });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await post("/api/help-requests", valid, cookie, false)).status, 403);
    for (const body of [null, [], {}, { ...valid, requester: account.id }, { ...valid, status: "approved" }, { ...valid, photos: [] }, { ...valid, helpType: "invalid" }, { ...valid, location: " " }, { ...valid, description: "a".repeat(2001) }]) {
      assert.equal((await post("/api/help-requests", body, cookie)).status, 400);
    }
    assert.equal(create.mock.callCount(), 0);
    const response = await post("/api/help-requests", valid, cookie);
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(result.request.status, "pending");
    assert.ok(result.request.id);
    assert.equal(Object.hasOwn(result.request, "location"), false);
    assert.equal(create.mock.calls[0].arguments[0].requester, account.id);
    assert.equal(create.mock.calls[0].arguments[0].nearestTown, "Kandy");
    active = false;
    assert.equal((await post("/api/help-requests", valid, cookie)).status, 401);
    assert.equal(create.mock.callCount(), 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
