const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { ShelterSupplyRequest } = require("../src/models/ShelterSupplyRequest");
const { hashPassword } = require("../src/utils/password");

test("shelter shortages can be reported privately and claimed once by a helper", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "shelter-supplies-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  const account = { id: "507f1f77bcf86cd799439011", email: "test@example.com", roles: ["help_seeker"], status: "active", passwordHash: await hashPassword("test") };
  const valid = { shelterName: " Community Hall ", nearestTown: " Kandy ", phone: "077 123 4567", supplies: ["Drinking water", "Clothing"], details: "Need 50 water bottles and 20 shirts." };
  let record;
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const create = t.mock.method(ShelterSupplyRequest, "create", async (data) => {
    const doc = new ShelterSupplyRequest(data);
    await doc.validate();
    record = { ...data, _id: id, claimedBy: null };
    return { id };
  });
  t.mock.method(ShelterSupplyRequest, "find", (filter) => {
    assert.deepEqual(filter, {});
    const query = {
      select(fields) { assert.ok(fields.includes("+claimedBy")); assert.ok(!fields.includes("phone")); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      skip(value) { assert.equal(value, 0); return query; }, limit(value) { assert.equal(value, 13); return query; },
      async lean() { return record ? [record] : []; },
    };
    return query;
  });
  const update = t.mock.method(ShelterSupplyRequest, "findOneAndUpdate", (filter, changes, options) => {
    assert.deepEqual(filter, { _id: id, claimedBy: null, requester: { $ne: account.id } });
    assert.equal(changes.$set.claimedBy, account.id);
    assert.ok(changes.$set.claimedAt instanceof Date);
    assert.equal(options.runValidators, true);
    return { select: async () => {
      if (!record || record.claimedBy || record.requester === account.id) return null;
      Object.assign(record, changes.$set);
      return { _id: id };
    } };
  });
  try {
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const post = (body, path = "", authenticated = true, csrf = true) => fetch(base + "/api/shelter-supplies" + path, { method: "POST", headers: { "Content-Type": "application/json", ...(authenticated ? { Cookie: cookie } : {}), ...(csrf ? { "X-CSRF-Protection": "1" } : {}) }, body: JSON.stringify(body) });
    const list = async () => {
      const response = await fetch(base + "/api/shelter-supplies");
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      return (await response.json()).requests;
    };
    assert.deepEqual(await list(), []);
    assert.equal((await post(valid, "", false)).status, 401);
    assert.equal((await post(valid, "", true, false)).status, 403);
    const response = await post(valid);
    assert.equal(response.status, 201);
    assert.equal((await response.json()).request.id, id);
    assert.equal(record.shelterName, "Community Hall");
    assert.equal(record.phone, "+94771234567");
    assert.equal(record.requester, account.id);
    for (const changes of [{supplies: []}, {supplies: ["Clothing", "Clothing"]}, {supplies: ["Other supplies"]}, {phone: "bad"}, {claimedBy: account.id}, {details: " "}]) assert.equal((await post({...valid, ...changes})).status, 400);
    assert.equal(create.mock.callCount(), 1);
    const initial = (await list())[0];
    assert.equal(initial.claimed, false);
    for (const field of ["phone", "requester", "claimedBy"]) assert.equal(initial[field], undefined);
    const claimPath = `/${id}/claim`;
    assert.equal((await post({}, claimPath)).status, 403);
    account.roles = ["volunteer"];
    assert.equal((await post({}, claimPath, true, false)).status, 403);
    assert.equal((await post({}, claimPath)).status, 409);
    record.requester = "507f1f77bcf86cd799439013";
    const claims = await Promise.all([post({}, claimPath), post({}, claimPath)]);
    assert.deepEqual(claims.map((item) => item.status).sort(), [200, 409]);
    assert.equal((await list())[0].claimed, true);
    record.claimedBy = null; account.roles = ["funder"];
    assert.equal((await post({}, claimPath)).status, 200);
    assert.equal((await list())[0].claimed, true);
    account.status = "suspended";
    assert.equal((await post({}, claimPath)).status, 401);
    assert.equal(update.mock.callCount(), 4);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
