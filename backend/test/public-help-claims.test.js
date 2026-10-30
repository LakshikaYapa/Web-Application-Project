const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { HelpRequest } = require("../src/models/HelpRequest");
const { hashPassword } = require("../src/utils/password");

test("approved help requests expose claim status and allow one volunteer or donor to claim atomically", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "public-help-claims-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  const requester = "507f1f77bcf86cd799439013";
  const record = { _id: id, requester, status: "approved", phone: "private", claimedBy: null, helpType: "Shelter", nearestTown: "Kandy", description: "Temporary shelter needed", photos: [{ contentType: "image/png", data: Buffer.from("photo") }] };
  const account = { id: "507f1f77bcf86cd799439011", email: "test@example.com", roles: ["volunteer"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  t.mock.method(HelpRequest, "find", (filter) => {
    assert.deepEqual(filter, { status: "approved" });
    const query = {
      select(fields) { assert.ok(fields.includes("+claimedBy")); assert.ok(!fields.includes("phone")); assert.ok(!fields.includes("photos.data")); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      skip(value) { assert.equal(value, 0); return query; }, limit(value) { assert.equal(value, 13); return query; },
      async lean() { return [record]; },
    };
    return query;
  });
  const update = t.mock.method(HelpRequest, "findOneAndUpdate", (filter, changes, options) => {
    assert.deepEqual(filter, { _id: id, status: "approved", claimedBy: null, requester: { $ne: account.id } });
    assert.equal(changes.$set.claimedBy, account.id);
    assert.ok(changes.$set.claimedAt instanceof Date);
    assert.equal(options.runValidators, true);
    return { select: async () => {
      if (record.status !== "approved" || record.claimedBy || record.requester === account.id) return null;
      Object.assign(record, changes.$set);
      return { _id: id };
    } };
  });
  t.mock.method(HelpRequest, "findOne", (filter) => { assert.deepEqual(filter, { _id: id, status: "approved" }); return { select: async () => record.status === "approved" ? record : null }; });
  try {
    const publicList = async () => {
      const response = await fetch(base + "/api/help-requests");
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      return (await response.json()).requests[0];
    };
    const initial = await publicList();
    assert.equal(initial.claimed, false);
    for (const field of ["claimedBy", "requester", "phone", "photos"]) assert.equal(initial[field], undefined);
    assert.equal((await fetch(`${base}/api/help-requests/${id}/claim`, { method: "POST", headers: { "X-CSRF-Protection": "1" } })).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const claim = (csrf = true) => fetch(`${base}/api/help-requests/${id}/claim`, { method: "POST", headers: { Cookie: cookie, ...(csrf ? { "X-CSRF-Protection": "1" } : {}) } });
    assert.equal((await claim(false)).status, 403);
    account.roles = ["help_seeker"];
    assert.equal((await claim()).status, 403);
    assert.equal(update.mock.callCount(), 0);
    account.roles = ["volunteer"];
    record.status = "pending";
    assert.equal((await claim()).status, 409);
    assert.equal((await fetch(`${base}/api/help-requests/public/${id}/photos/0`)).status, 404);
    record.status = "approved"; record.requester = account.id;
    assert.equal((await claim()).status, 409);
    record.requester = requester;
    const claims = await Promise.all([claim(), claim()]);
    assert.deepEqual(claims.map((response) => response.status).sort(), [200, 409]);
    assert.equal((await publicList()).claimed, true);
    record.claimedBy = null;
    account.roles = ["funder"];
    assert.equal((await claim()).status, 200);
    assert.equal((await publicList()).claimed, true);
    const photo = await fetch(`${base}/api/help-requests/public/${id}/photos/0`);
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get("x-content-type-options"), "nosniff");
    account.status = "suspended";
    assert.equal((await claim()).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
