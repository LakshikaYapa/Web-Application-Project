const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { HelpRequest } = require("../src/models/HelpRequest");
const { hashPassword } = require("../src/utils/password");

test("admin help actions enforce sequential status changes and protect deletion", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "admin-help-actions-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  let record = { _id: id, status: "pending" };
  const account = { id: "507f1f77bcf86cd799439011", email: "test@example.com", roles: ["admin"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const update = t.mock.method(HelpRequest, "findOneAndUpdate", (filter, changes, options) => {
    assert.equal(filter._id, id);
    assert.equal(options.runValidators, true);
    assert.ok((filter.status === "pending" && changes.$set.status === "accepted") || (filter.status === "accepted" && changes.$set.status === "completed"));
    return { select: async () => {
      if (!record || record.status !== filter.status) return null;
      record.status = changes.$set.status;
      return { _id: id };
    } };
  });
  const remove = t.mock.method(HelpRequest, "findOneAndDelete", async (filter) => { assert.deepEqual(filter, { _id: id }); const result = record; record = null; return result; });
  t.mock.method(HelpRequest, "find", (filter) => {
    const query = { select() { return query; }, sort() { return query; }, skip() { return query; }, limit() { return query; }, async lean() { return record && record.status === filter.status ? [record] : []; } };
    return query;
  });
  try {
    const path = `/api/admin/help-requests/${id}`;
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const send = (suffix, method = "POST", authenticated = true, csrf = true, body) => fetch(base + path + suffix, { method, headers: { ...(authenticated ? { Cookie: cookie } : {}), ...(csrf ? { "X-CSRF-Protection": "1" } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    for (const [suffix, method] of [["/accept", "POST"], ["/complete", "POST"], ["", "DELETE"]]) {
      assert.equal((await send(suffix, method, false)).status, 401);
      assert.equal((await send(suffix, method, true, false)).status, 403);
      account.roles = ["help_seeker"];
      assert.equal((await send(suffix, method)).status, 403);
      account.roles = ["admin"];
    }
    assert.equal(update.mock.callCount(), 0);
    assert.equal(remove.mock.callCount(), 0);
    assert.equal((await send("/accept", "POST", true, true, { status: "completed" })).status, 400);
    assert.equal((await send("/complete")).status, 409);
    assert.equal((await send("/accept")).status, 200);
    assert.equal(record.status, "accepted");
    assert.equal((await send("/accept")).status, 409);
    const list = await fetch(base + "/api/admin/help-requests?status=accepted", { headers: { Cookie: cookie } });
    assert.equal((await list.json()).requests.length, 1);
    assert.equal((await send("/complete")).status, 200);
    assert.equal(record.status, "completed");
    assert.equal((await send("/complete")).status, 409);
    assert.equal((await send("", "DELETE")).status, 200);
    assert.equal(record, null);
    assert.equal((await send("", "DELETE")).status, 404);
    account.status = "suspended";
    assert.equal((await send("/accept")).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
