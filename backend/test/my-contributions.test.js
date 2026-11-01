const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const Contribution = require("../src/models/Contribution");
const { hashPassword } = require("../src/utils/password");

test("my contributions enforces ownership, pagination and private field filtering", async (t) => {
  const store = new session.MemoryStore();
  const app = createApp({ sessionStore: store, sessionSecret: "my-contributions-test-secret-at-least-32", secureCookies: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["funder"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  let skip;
  let records = Array.from({ length: 21 }, (_, i) => ({ _id: String(i), supportTypes: ["financial"], nearestTown: "Kandy", amountMinor: 123456, currency: "LKR", status: "pending_review", createdAt: new Date(), contributor: "private", phone: "private", receipt: { contentType: "image/png", data: Buffer.from("private") } }));
  const find = t.mock.method(Contribution, "find", (filter) => {
    assert.deepEqual(filter, { contributor: account.id });
    const query = {
      select(fields) { assert.ok(fields.includes("receipt.contentType")); for (const field of ["receipt.data", "phone", "contributor"]) assert.equal(fields.includes(field), false); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      skip(value) { skip = value; return query; },
      limit(value) { assert.equal(value, 21); return query; },
      lean: async () => records,
    };
    return query;
  });
  const get = (query = "", cookie) => fetch(base + "/api/contributions/mine" + query, { headers: cookie ? { Cookie: cookie } : {} });
  try {
    assert.equal((await get()).status, 401);
    assert.equal(find.mock.callCount(), 0);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const response = await get("?page=2&contributor=someone-else", cookie);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(skip, 20);
    assert.equal(body.page, 2);
    assert.equal(body.hasMore, true);
    assert.equal(body.contributions.length, 20);
    assert.equal(body.contributions[0].amountMinor, 123456);
    assert.equal(body.contributions[0].status, "pending_review");
    assert.equal(body.contributions[0].hasReceipt, true);
    for (const field of ["receipt", "phone", "contributor"]) assert.equal(Object.hasOwn(body.contributions[0], field), false);
    const calls = find.mock.callCount();
    for (const page of ["0", "-1", "1.5", "abc", "100001", "1&page=2"]) assert.equal((await get(`?page=${page}`, cookie)).status, 400);
    assert.equal(find.mock.callCount(), calls);
    records = [];
    const empty = await (await get("", cookie)).json();
    assert.deepEqual(empty.contributions, []);
    assert.equal(empty.hasMore, false);
    account.status = "suspended";
    assert.equal((await get("", cookie)).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
