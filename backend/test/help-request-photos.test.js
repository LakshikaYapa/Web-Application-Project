const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { HelpRequest } = require("../src/models/HelpRequest");
const { hashPassword } = require("../src/utils/password");

test("only the current active owner can view request photos", async (t) => {
  const store = new session.MemoryStore();
  const app = createApp({ sessionStore: store, sessionSecret: "photo-view-test-session-secret-at-least-32", secureCookies: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  const ownerId = "507f1f77bcf86cd799439011";
  const account = { id: ownerId, name: "Test", email: "test@example.com", roles: ["help_seeker"], status: "active", passwordHash: await hashPassword("test") };
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const find = t.mock.method(HelpRequest, "findOne", (filter) => {
    assert.deepEqual(filter, { _id: id, requester: account.id });
    return { select: async (selection) => {
      assert.equal(selection, "+photos");
      return filter.requester === ownerId ? { photos: [{ contentType: "image/png", data: png }] } : null;
    } };
  });
  const get = (path, cookie) => fetch(base + path, { headers: cookie ? { Cookie: cookie } : {} });
  const photo = `/api/help-requests/${id}/photos/0`;
  try {
    assert.equal((await get(photo)).status, 401);
    assert.equal(find.mock.callCount(), 0);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const response = await get(photo, cookie);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
    for (const index of ["1", "2", "3", "-1", "0.5", "foo"]) {
      assert.equal((await get(`/api/help-requests/${id}/photos/${index}`, cookie)).status, 404);
    }
    assert.equal((await get("/api/help-requests/invalid/photos/0", cookie)).status, 404);
    // A different logged-in user receives the same 404 as a missing photo.
    account.id = "507f1f77bcf86cd799439099";
    const otherLogin = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    const otherCookie = otherLogin.headers.get("set-cookie").split(";")[0];
    assert.equal((await get(photo, otherCookie)).status, 404);
    account.id = ownerId;
    account.status = "suspended";
    assert.equal((await get(photo, cookie)).status, 401);
    account.status = "active";
    assert.equal((await get(photo, cookie)).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
