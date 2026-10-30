const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { HelpRequest } = require("../src/models/HelpRequest");
const { FloodReport } = require("../src/models/FloodReport");
const { Shelter } = require("../src/models/Shelter");
const Contribution = require("../src/models/Contribution");
const { hashPassword } = require("../src/utils/password");

test("admin dashboard counts pending records and rejects anonymous, ordinary and suspended users", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "admin-dashboard-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const account = { id: "507f1f77bcf86cd799439011", email: "test@example.com", name: "Test", roles: ["admin"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const mocks = [[HelpRequest, "pending", 2], [FloodReport, "pending", 3], [Shelter, "pending", 4], [Contribution, "pending_review", 5]].map(([model, status, count]) => t.mock.method(model, "countDocuments", async (filter) => { assert.deepEqual(filter, { status }); return count; }));
  try {
    assert.equal((await fetch(base + "/api/admin/dashboard")).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const get = () => fetch(base + "/api/admin/dashboard", { headers: { Cookie: cookie } });
    const response = await get();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { success: true, counts: { "help-requests": 2, "flood-reports": 3, shelters: 4, contributions: 5 } });
    account.roles = ["volunteer"];
    assert.equal((await get()).status, 403);
    account.roles = ["admin"];
    account.status = "suspended";
    assert.equal((await get()).status, 401);
    for (const mock of mocks) assert.equal(mock.mock.callCount(), 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
