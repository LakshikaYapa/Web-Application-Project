const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const Contribution = require("../src/models/Contribution");
const { hashPassword } = require("../src/utils/password");

test("admin contributions list protects donor details and receipt access", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "admin-contribution-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  const account = { id: "507f1f77bcf86cd799439011", email: "test@example.com", roles: ["admin"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const find = t.mock.method(Contribution, "find", (filter) => {
    assert.deepEqual(filter, { status: "pending_review" });
    const query = {
      select(fields) { assert.ok(fields.includes("+phone")); assert.ok(!fields.includes("receipt.data")); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      skip(value) { assert.equal(value, 20); return query; },
      limit(value) { assert.equal(value, 21); return query; },
      async lean() { return Array.from({ length: 21 }, () => ({ _id: id, phone: "+94771234567", amountMinor: 10000, receipt: { contentType: "application/pdf", data: "private" }, contributor: "private" })); },
    };
    return query;
  });
  let receipt = { contentType: "application/pdf", data: Buffer.from("%PDF-1.7\n%%EOF") };
  t.mock.method(Contribution, "findOne", (filter) => {
    assert.deepEqual(filter, { _id: id, status: "pending_review" });
    return { select: async () => ({ receipt }) };
  });
  try {
    const paths = ["/api/admin/contributions?page=2", `/api/admin/contributions/${id}/receipt`];
    for (const path of paths) assert.equal((await fetch(base + path)).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const get = (path) => fetch(base + path, { headers: { Cookie: cookie } });
    const listResponse = await get(paths[0]);
    assert.equal(listResponse.status, 200);
    assert.equal(listResponse.headers.get("cache-control"), "no-store");
    const body = await listResponse.json();
    assert.equal(body.contributions.length, 20);
    assert.equal(body.hasMore, true);
    assert.equal(body.contributions[0].phone, "+94771234567");
    assert.equal(body.contributions[0].hasReceipt, true);
    assert.equal(body.contributions[0].receipt, undefined);
    assert.equal(body.contributions[0].contributor, undefined);
    const response = await get(paths[1]);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/pdf");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.ok(response.headers.get("content-disposition").startsWith("inline"));
    assert.ok((await get(paths[1] + "?download=1")).headers.get("content-disposition").startsWith("attachment"));
    assert.equal((await get("/api/admin/contributions?page=0")).status, 400);
    assert.equal((await get("/api/admin/contributions/bad/receipt")).status, 404);
    receipt = null;
    assert.equal((await get(paths[1])).status, 404);
    account.roles = ["funder"];
    for (const path of paths) assert.equal((await get(path)).status, 403);
    account.roles = ["admin"]; account.status = "suspended";
    for (const path of paths) assert.equal((await get(path)).status, 401);
    assert.equal(find.mock.callCount(), 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
