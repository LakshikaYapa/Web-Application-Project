const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { HelpRequest } = require("../src/models/HelpRequest");
const { hashPassword } = require("../src/utils/password");

test("only active admins can list pending help requests and view their photos", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "admin-help-request-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  const account = { id: "507f1f77bcf86cd799439011", email: "test@example.com", roles: ["admin"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const find = t.mock.method(HelpRequest, "find", (filter) => {
    assert.deepEqual(filter, { status: "pending" });
    const query = {
      select(fields) { assert.ok(fields.includes("+phone")); assert.ok(!fields.includes("photos.data")); return query; },
      sort(value) { assert.deepEqual(value, { createdAt: -1, _id: -1 }); return query; },
      skip(value) { assert.equal(value, 20); return query; },
      limit(value) { assert.equal(value, 21); return query; },
      async lean() { return Array.from({ length: 21 }, () => ({ _id: id, phone: "+94771234567", description: "Food needed", photos: [{ contentType: "image/png", data: "private" }], requester: "private" })); },
    };
    return query;
  });
  const bytes = Buffer.from("photo bytes");
  const photoFind = t.mock.method(HelpRequest, "findOne", (filter) => {
    assert.deepEqual(filter, { _id: id, status: "pending" });
    return { select: async () => ({ photos: [{ contentType: "image/png", data: bytes }] }) };
  });
  try {
    const paths = ["/api/admin/help-requests?page=2", `/api/admin/help-requests/${id}/photos/0`];
    for (const path of paths) assert.equal((await fetch(base + path)).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const get = (path) => fetch(base + path, { headers: { Cookie: cookie } });
    const response = await get(paths[0]);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.requests.length, 20);
    assert.equal(body.hasMore, true);
    assert.equal(body.requests[0].photoCount, 1);
    assert.equal(body.requests[0].phone, "+94771234567");
    assert.equal(body.requests[0].photos, undefined);
    assert.equal(body.requests[0].requester, undefined);
    const photo = await get(paths[1]);
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get("x-content-type-options"), "nosniff");
    assert.equal(photo.headers.get("cache-control"), "no-store");
    assert.deepEqual(Buffer.from(await photo.arrayBuffer()), bytes);
    assert.equal((await get("/api/admin/help-requests?page=0")).status, 400);
    assert.equal((await get(`/api/admin/help-requests/${id}/photos/3`)).status, 404);
    assert.equal((await get("/api/admin/help-requests/bad/photos/0")).status, 404);
    account.roles = ["volunteer"];
    for (const path of paths) assert.equal((await get(path)).status, 403);
    account.roles = ["admin"]; account.status = "suspended";
    for (const path of paths) assert.equal((await get(path)).status, 401);
    assert.equal(find.mock.callCount(), 1);
    assert.equal(photoFind.mock.callCount(), 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
