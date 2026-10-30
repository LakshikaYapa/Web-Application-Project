const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { Shelter } = require("../src/models/Shelter");
const { hashPassword } = require("../src/utils/password");

test("admin shelter approval and deletion enforce authorization and change public visibility", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "admin-shelter-actions-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  let record = { _id: id, name: "Hall", nearestTown: "Kandy", status: "pending", capacity: 100, occupied: 10 };
  const account = { id: "507f1f77bcf86cd799439011", email: "test@example.com", roles: ["admin"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const update = t.mock.method(Shelter, "findOneAndUpdate", (filter, changes, options) => {
    assert.deepEqual(filter, { _id: id, status: "pending" });
    assert.deepEqual(changes, { $set: { status: "approved" } });
    assert.equal(options.runValidators, true);
    return { select: async () => {
      if (!record || record.status !== "pending") return null;
      record.status = "approved";
      return { _id: id };
    } };
  });
  const remove = t.mock.method(Shelter, "findOneAndDelete", async (filter) => { assert.deepEqual(filter, { _id: id }); const result = record; record = null; return result; });
  t.mock.method(Shelter, "find", (filter) => {
    const query = { select() { return query; }, sort() { return query; }, skip() { return query; }, limit() { return query; }, async lean() { return record && record.status === filter.status ? [record] : []; } };
    return query;
  });
  try {
    const approvePath = `/api/admin/shelters/${id}/approve`;
    const deletePath = `/api/admin/shelters/${id}`;
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const action = (path, method, authenticated = true, csrf = true, body) => fetch(base + path, { method, headers: { ...(authenticated ? { Cookie: cookie } : {}), ...(csrf ? { "X-CSRF-Protection": "1" } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const publicList = async () => (await (await fetch(base + "/api/shelters")).json()).shelters;
    assert.equal((await publicList()).length, 0);
    for (const [path, method] of [[approvePath, "POST"], [deletePath, "DELETE"]]) {
      assert.equal((await action(path, method, false)).status, 401);
      assert.equal((await action(path, method, true, false)).status, 403);
      account.roles = ["volunteer"];
      assert.equal((await action(path, method)).status, 403);
      account.roles = ["admin"];
    }
    assert.equal(update.mock.callCount(), 0);
    assert.equal(remove.mock.callCount(), 0);
    assert.equal((await action(approvePath, "POST", true, true, { status: "approved" })).status, 400);
    assert.equal((await action("/api/admin/shelters/bad/approve", "POST")).status, 404);
    assert.equal((await action(approvePath, "POST")).status, 200);
    assert.equal((await publicList()).length, 1);
    const approved = await fetch(base + "/api/admin/shelters?status=approved", { headers: { Cookie: cookie } });
    assert.equal((await approved.json()).shelters.length, 1);
    assert.equal((await action(approvePath, "POST")).status, 409);
    assert.equal((await action(deletePath, "DELETE")).status, 200);
    assert.equal((await publicList()).length, 0);
    assert.equal((await action(deletePath, "DELETE")).status, 404);
    record = { _id: id, status: "pending" };
    assert.equal((await action(deletePath, "DELETE")).status, 200);
    account.status = "suspended";
    assert.equal((await action(approvePath, "POST")).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
