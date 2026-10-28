const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { HelpRequest } = require("../src/models/HelpRequest");
const { hashPassword } = require("../src/utils/password");

test("help requests enforce sessions, validate fields and save the authenticated owner", async (t) => {
  const store = new session.MemoryStore();
  const app = createApp({ sessionStore: store, sessionSecret: "help-request-test-secret-at-least-32-chars", secureCookies: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  let active = true;
  const account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["help_seeker"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => ({ ...account, status: active ? "active" : "suspended" }));
  const create = t.mock.method(HelpRequest, "create", async (data) => new HelpRequest(data));
  const base = `http://127.0.0.1:${server.address().port}`;
  const valid = { helpType: "Shelter", nearestTown: " Kandy ", location: "Near town hall", description: "We need shelter for our family." };
  const post = (path, body, cookie, csrf = true) => fetch(base + path, {
    method: "POST", headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Protection": "1" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await post("/api/help-requests", valid)).status, 401);
    const login = await post("/api/auth/login", { email: account.email, password: "test" });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await post("/api/help-requests", valid, cookie, false)).status, 403);
    for (const body of [null, [], {}, { ...valid, requester: account.id }, { ...valid, status: "approved" }, { ...valid, photos: [] }, { ...valid, helpType: "invalid" }, { ...valid, location: " " }, { ...valid, description: "a".repeat(2001) }]) {
      assert.equal((await post("/api/help-requests", body, cookie)).status, 400);
    }
    assert.equal(create.mock.callCount(), 0);
    const response = await post("/api/help-requests", valid, cookie);
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(result.request.status, "pending");
    assert.ok(result.request.id);
    assert.equal(Object.hasOwn(result.request, "location"), false);
    assert.equal(create.mock.calls[0].arguments[0].requester, account.id);
    assert.equal(create.mock.calls[0].arguments[0].nearestTown, "Kandy");
    active = false;
    assert.equal((await post("/api/help-requests", valid, cookie)).status, 401);
    assert.equal(create.mock.callCount(), 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});

test("multipart photos are validated and saved with the request without exposing binary data", async (t) => {
  const store = new session.MemoryStore();
  const app = createApp({ sessionStore: store, sessionSecret: "photo-upload-test-secret-at-least-32-chars", secureCookies: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["help_seeker"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const create = t.mock.method(HelpRequest, "create", async (data) => {
    const doc = new HelpRequest(data);
    await doc.validate();
    return doc;
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
  function form(files = [png], type = "image/png", valid = true) {
    const body = new FormData();
    body.append("helpType", "Shelter");
    body.append("nearestTown", "Kandy");
    body.append("location", "Town hall");
    if (valid) body.append("description", "We need shelter.");
    for (const file of files) body.append("photos", new Blob([file], { type }), "photo.png");
    return body;
  }
  const send = (body, cookie) => fetch(base + "/api/help-requests", {
    method: "POST", headers: { "X-CSRF-Protection": "1", ...(cookie ? { Cookie: cookie } : {}) }, body,
  });
  try {
    assert.equal((await send(form())).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const saved = await send(form([png, png, png]), cookie);
    assert.equal(saved.status, 201);
    const result = await saved.json();
    assert.equal(result.request.photoCount, 3);
    assert.equal(Object.hasOwn(result.request, "photos"), false);
    const data = create.mock.calls[0].arguments[0];
    assert.equal(data.photos.length, 3);
    assert.equal(data.photos[0].contentType, "image/png");
    assert.deepEqual(data.photos[0].data, png);
    assert.equal((await send(form([]), cookie)).status, 201);
    for (const body of [form([Buffer.from("not an image")]), form([png], "image/svg+xml"), form([png, png, png, png]), form([png], "image/png", false)]) {
      assert.equal((await send(body, cookie)).status, 400);
    }
    assert.equal((await send(form([Buffer.alloc(5 * 1024 * 1024 + 1)]), cookie)).status, 413);
    assert.equal(create.mock.callCount(), 2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
