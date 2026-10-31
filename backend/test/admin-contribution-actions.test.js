const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const Contribution = require("../src/models/Contribution");
const { hashPassword } = require("../src/utils/password");

test("admin contribution actions approve pending requests and protect deletion", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "admin-contribution-actions-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  let record = { _id: id, status: "pending_review" };
  const account = { id: "507f1f77bcf86cd799439011", email: "test@example.com", roles: ["admin"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const update = t.mock.method(Contribution, "findOneAndUpdate", (filter, changes, options) => {
    assert.equal(filter._id, id);
    assert.equal(options.runValidators, true);
    assert.equal(filter.status, "pending_review");
    assert.equal(changes.$set.status, "approved");
    return { select: async () => {
      if (!record || record.status !== filter.status) return null;
      record.status = changes.$set.status;
      return { _id: id };
    } };
  });
  const remove = t.mock.method(Contribution, "findOneAndDelete", async (filter) => { assert.deepEqual(filter, { _id: id, status: "pending_review" }); if (!record || record.status !== "pending_review") return null; const result = record; record = null; return result; });
  t.mock.method(Contribution, "find", (filter) => {
    const query = { select() { return query; }, sort() { return query; }, skip() { return query; }, limit() { return query; }, async lean() { return record && record.status === filter.status ? [record] : []; } };
    return query;
  });
  try {
    const path = `/api/admin/contributions/${id}`;
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const send = (suffix, method = "POST", authenticated = true, csrf = true, body) => fetch(base + path + suffix, { method, headers: { ...(authenticated ? { Cookie: cookie } : {}), ...(csrf ? { "X-CSRF-Protection": "1" } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    for (const [suffix, method] of [["/approve", "POST"], ["", "DELETE"]]) {
      assert.equal((await send(suffix, method, false)).status, 401);
      assert.equal((await send(suffix, method, true, false)).status, 403);
      account.roles = ["help_seeker"];
      assert.equal((await send(suffix, method)).status, 403);
      account.roles = ["admin"];
    }
    assert.equal(update.mock.callCount(), 0);
    assert.equal(remove.mock.callCount(), 0);
    assert.equal((await send("/approve", "POST", true, true, { status: "completed" })).status, 400);
    assert.equal((await send("/approve")).status, 200);
    assert.equal(record.status, "approved");
    assert.equal((await send("/approve")).status, 409);
    const pendingList = await fetch(base + "/api/admin/contributions", { headers: { Cookie: cookie } });
    assert.equal((await pendingList.json()).contributions.length, 0);
    const history = await fetch(base + "/api/admin/contributions?status=approved", { headers: { Cookie: cookie } });
    assert.equal((await history.json()).contributions.length, 0);
    assert.equal((await send("", "DELETE")).status, 404);
    record = { _id: id, status: "pending_review" };
    assert.equal((await send("", "DELETE")).status, 200);
    assert.equal(record, null);
    assert.equal((await send("", "DELETE")).status, 404);
    account.status = "suspended";
    assert.equal((await send("/approve")).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
