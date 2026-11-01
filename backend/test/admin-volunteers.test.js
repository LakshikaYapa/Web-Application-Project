const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const VolunteerProfile = require("../src/models/VolunteerProfile");
const { hashPassword } = require("../src/utils/password");

test("admins can view old and new volunteers and join or ignore pending registrations", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "admin-volunteers-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  let profileStatus;
  const account = { id: "507f1f77bcf86cd799439011", email: "test@example.com", roles: ["admin"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const find = t.mock.method(VolunteerProfile, "find", (filter) => {
    assert.deepEqual(filter, {});
    const query = {
      select(fields) { assert.ok(fields.includes("status")); return query; },
      populate(config) { assert.equal(config.path, "user"); assert.equal(config.select, "name email +phone"); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      skip(value) { assert.ok([0, 20].includes(value)); return query; },
      limit(value) { assert.equal(value, 21); return query; },
      async lean() { return Array.from({ length: 21 }, (_, index) => ({ _id: id, status: index ? "joined" : profileStatus, nearestTown: "Kandy", user: { name: "Volunteer", email: "volunteer@example.com", phone: "+94771234567", passwordHash: "private", address: "private" }, supportAreas: [{ area: "relief", skills: ["Packing supplies"], internal: "private" }], internal: "private" })); },
    };
    return query;
  });
  const update = t.mock.method(VolunteerProfile, "findOneAndUpdate", (filter, changes, options) => {
    assert.deepEqual(filter, { _id: id, $or: [{ status: "pending" }, { status: { $exists: false } }] });
    assert.ok(["joined", "ignored"].includes(changes.$set.status));
    assert.equal(options.runValidators, true);
    return { select: async () => {
      if (profileStatus && profileStatus !== "pending") return null;
      profileStatus = changes.$set.status;
      return { _id: id };
    } };
  });
  try {
    assert.equal((await fetch(base + "/api/admin/volunteers")).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const list = () => fetch(base + "/api/admin/volunteers?page=2", { headers: { Cookie: cookie } });
    const act = (action, csrf = true) => fetch(`${base}/api/admin/volunteers/${id}/${action}`, { method: "POST", headers: { Cookie: cookie, ...(csrf ? { "X-CSRF-Protection": "1" } : {}) } });
    const response = await list();
    assert.equal(response.headers.get("cache-control"), "no-store");
    const result = await response.json();
    assert.equal(result.volunteers.length, 20);
    assert.equal(result.hasMore, true);
    assert.equal(result.volunteers[0].status, "pending");
    assert.equal(result.volunteers[1].status, "joined");
    assert.equal(result.volunteers[0].phone, "+94771234567");
    assert.equal(result.volunteers[0].user, undefined);
    assert.equal(result.volunteers[0].internal, undefined);
    assert.equal(result.volunteers[0].supportAreas[0].internal, undefined);
    assert.equal((await act("join", false)).status, 403);
    account.roles = ["volunteer"];
    assert.equal((await list()).status, 403);
    assert.equal((await act("join")).status, 403);
    assert.equal((await act("ignore")).status, 403);
    account.roles = ["admin"];
    assert.equal((await act("join")).status, 200);
    assert.equal(profileStatus, "joined");
    assert.equal((await act("ignore")).status, 409);
    profileStatus = "pending";
    assert.equal((await act("ignore")).status, 200);
    assert.equal(profileStatus, "ignored");
    assert.equal((await act("join")).status, 409);
    account.status = "suspended";
    assert.equal((await list()).status, 401);
    assert.equal((await act("join")).status, 401);
    assert.equal(find.mock.callCount(), 1);
    assert.equal(update.mock.callCount(), 4);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
