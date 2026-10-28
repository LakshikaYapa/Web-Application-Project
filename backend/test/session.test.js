const { test, before, after, mock } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { hashPassword, verifyPassword } = require("../src/utils/password");

const store = new session.MemoryStore();
const app = createApp({ sessionStore: store, sessionSecret: "test-only-session-secret-at-least-32-chars", secureCookies: false });
const password = "a";
let account;
let server;
let url;
before(async () => {
  account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["volunteer", "funder"], status: "active", preferredLanguage: "en", passwordHash: await hashPassword(password) };
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  url = `http://127.0.0.1:${server.address().port}/api/auth`;
});
after(async () => { await new Promise((resolve) => server.close(resolve)); });

function post(path, body, cookie, csrf = true) {
  return fetch(url + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Protection": "1" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
}
const login = (cookie) => post("/login", { email: " TEST@EXAMPLE.COM ", password }, cookie);
const cookieFrom = (response) => response.headers.get("set-cookie")?.split(";")[0];
const me = (cookie) => fetch(url + "/me", { headers: cookie ? { Cookie: cookie } : {} });

test("password comparison is exact and rejects malformed stored hashes", async () => {
  assert.equal(await verifyPassword(password, account.passwordHash), true);
  assert.equal(await verifyPassword(password + " ", account.passwordHash), false);
  assert.equal(await verifyPassword(password, "scrypt$999999999999$8$3$bad$hash"), false);
});

test("login rotates sessions; cookie protects data; logout revokes the old cookie", async () => {
  const findOne = mock.method(User, "findOne", (query) => {
    assert.equal(query.email, "test@example.com");
    return { select: async () => account };
  });
  const findById = mock.method(User, "findById", async () => account);
  try {
    const anonymous = await me();
    assert.equal(anonymous.status, 401);
    assert.equal(anonymous.headers.get("set-cookie"), null);
    const first = await login();
    assert.equal(first.status, 200);
    assert.equal(first.headers.get("cache-control"), "no-store");
    const header = first.headers.get("set-cookie");
    assert.match(header, /HttpOnly/i);
    assert.match(header, /SameSite=Strict/i);
    assert.match(header, /Path=\/api/i);
    const body = await first.json();
    assert.deepEqual(body.user.roles, ["volunteer", "funder"]);
    assert.equal(Object.hasOwn(body.user, "passwordHash"), false);
    const oldCookie = cookieFrom(first);
    const second = await login(oldCookie);
    const cookie = cookieFrom(second);
    assert.notEqual(cookie, oldCookie);
    assert.equal((await me(oldCookie)).status, 401);
    assert.equal((await me(cookie)).status, 200);
    assert.equal((await post("/logout", {}, cookie, false)).status, 403);
    assert.equal((await me(cookie)).status, 200);
    const loggedOut = await post("/logout", {}, cookie);
    assert.equal(loggedOut.status, 200);
    assert.match(loggedOut.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/i);
    assert.equal((await me(cookie)).status, 401);
    assert.equal((await me(cookie + "tampered")).status, 401);
  } finally { findOne.mock.restore(); findById.mock.restore(); }
});

test("wrong passwords, missing accounts, and suspended accounts share one error", async () => {
  let selected = account;
  const findOne = mock.method(User, "findOne", () => ({ select: async () => selected }));
  try {
    const incorrect = await post("/login", { email: account.email, password: "incorrect passphrase" });
    assert.equal(incorrect.status, 401);
    const expected = await incorrect.json();
    selected = null;
    const missing = await login();
    assert.equal(missing.status, 401);
    assert.deepEqual(await missing.json(), expected);
    selected = { ...account, status: "suspended" };
    const suspended = await login();
    assert.equal(suspended.status, 401);
    assert.deepEqual(await suspended.json(), expected);
    assert.equal(suspended.headers.get("set-cookie"), null);
  } finally { findOne.mock.restore(); }
});

test("suspending an account invalidates an existing session on the next user check", async () => {
  const findOne = mock.method(User, "findOne", () => ({ select: async () => account }));
  const findById = mock.method(User, "findById", async () => ({ ...account, status: "suspended" }));
  try {
    const response = await login();
    assert.equal(response.status, 200);
    const cookie = cookieFrom(response);
    assert.equal((await me(cookie)).status, 401);
    assert.equal((await me(cookie)).status, 401);
  } finally { findOne.mock.restore(); findById.mock.restore(); }
});

test("login rejects CSRF attempts and client-supplied roles before database lookup", async () => {
  const findOne = mock.method(User, "findOne", () => { throw new Error("Unexpected lookup"); });
  try {
    assert.equal((await post("/login", { email: account.email, password }, undefined, false)).status, 403);
    assert.equal((await post("/login", { email: account.email, password, roles: ["admin"] })).status, 400);
    assert.equal(findOne.mock.callCount(), 0);
  } finally { findOne.mock.restore(); }
});

test("expired authentication cannot be extended by replaying a cookie", async () => {
  const findOne = mock.method(User, "findOne", () => ({ select: async () => account }));
  try {
    const response = await login();
    assert.equal(response.status, 200);
    const cookie = cookieFrom(response);
    const id = decodeURIComponent(cookie.split("=").slice(1).join("=")).slice(2).split(".")[0];
    const stored = JSON.parse(store.sessions[id]);
    stored.authenticatedAt = Date.now() - 9 * 60 * 60 * 1000;
    store.sessions[id] = JSON.stringify(stored);
    assert.equal((await me(cookie)).status, 401);
    assert.equal(store.sessions[id], undefined);
  } finally { findOne.mock.restore(); }
});

test("login attempts are rate limited", async () => {
  let response;
  for (let attempt = 0; attempt < 11; attempt++) {
    response = await post("/login", {});
    if (response.status === 429) break;
  }
  assert.equal(response.status, 429);
  assert.equal((await response.json()).code, "RATE_LIMITED");
});
