const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { HelpRequest } = require("../src/models/HelpRequest");
const { hashPassword } = require("../src/utils/password");

test("my requests use only the session owner, paginate and omit photos and private account fields", async (t) => {
  const store = new session.MemoryStore();
  const app = createApp({ sessionStore: store, sessionSecret: "my-requests-test-secret-at-least-32-chars", secureCookies: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["help_seeker"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  let skip;
  let rows = Array.from({ length: 21 }, (_, i) => ({ _id: String(i), helpType: "Shelter", nearestTown: "Kandy", location: "Town hall", description: "Need help", status: "pending", createdAt: new Date(), requester: "private", photos: ["private"], email: "private" }));
  const find = t.mock.method(HelpRequest, "find", (filter) => {
    assert.deepEqual(filter, { requester: account.id });
    const query = {
      select(fields) { assert.ok(fields.includes("photos.contentType")); assert.equal(fields.includes("photos.data"), false); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      skip(value) { skip = value; return query; },
      limit(value) { assert.equal(value, 21); return query; },
      lean: async () => rows,
    };
    return query;
  });
  const get = (path, cookie) => fetch(base + path, { headers: cookie ? { Cookie: cookie } : {} });
  try {
    assert.equal((await get("/api/help-requests/mine")).status, 401);
    assert.equal(find.mock.callCount(), 0);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const response = await get("/api/help-requests/mine?page=2&requester=someone-else", cookie);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(skip, 20);
    assert.equal(body.hasMore, true);
    assert.equal(body.requests.length, 20);
    assert.equal(body.requests[0].photoCount, 1);
    for (const field of ["photos", "requester", "email"]) assert.equal(Object.hasOwn(body.requests[0], field), false);
    for (const page of ["0", "-1", "1.5", "abc", "100001", "1&page=2"]) assert.equal((await get(`/api/help-requests/mine?page=${page}`, cookie)).status, 400);
    rows = [];
    assert.deepEqual((await (await get("/api/help-requests/mine", cookie)).json()).requests, []);
    account.status = "suspended";
    assert.equal((await get("/api/help-requests/mine", cookie)).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});

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
  const valid = { helpType: "Shelter", phone: "077 123 4567", nearestTown: " Kandy ", location: "Near town hall", description: "We need shelter for our family." };
  const post = (path, body, cookie, csrf = true) => fetch(base + path, {
    method: "POST", headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Protection": "1" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await post("/api/help-requests", valid)).status, 401);
    const login = await post("/api/auth/login", { email: account.email, password: "test" });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await post("/api/help-requests", valid, cookie, false)).status, 403);
    for (const body of [null, [], { ...valid, phone: undefined }, { ...valid, requester: account.id }, { ...valid, status: "approved" }, { ...valid, phone: "123" }, { ...valid, helpType: "invalid" }, { ...valid, location: " " }, { ...valid, description: "a".repeat(2001) }]) {
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
    assert.equal(create.mock.calls[0].arguments[0].phone, "+94771234567");
    assert.equal(Object.hasOwn(result.request, "phone"), false);
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
    body.append("phone", "+94 77 123 4567");
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
    const missingOther = form([]);
    missingOther.set("helpType", "Other help");
    assert.equal((await send(missingOther, cookie)).status, 400);
    const longOther = form([]);
    longOther.set("helpType", "Other help");
    longOther.set("otherHelp", "x".repeat(201));
    assert.equal((await send(longOther, cookie)).status, 400);
    const other = form([png, png, png]);
    other.set("helpType", "Other help");
    other.set("otherHelp", "  Baby supplies  ");
    assert.equal((await send(other, cookie)).status, 201);
    assert.equal(create.mock.calls[2].arguments[0].otherHelp, "Baby supplies");
    assert.equal(create.mock.calls[2].arguments[0].photos.length, 3);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
