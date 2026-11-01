const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const Contribution = require("../src/models/Contribution");
const { hashPassword } = require("../src/utils/password");

test("receipt viewing and downloads require the active owner and return private typed files", async (t) => {
  const store = new session.MemoryStore();
  const app = createApp({ sessionStore: store, sessionSecret: "receipt-view-test-secret-at-least-32-chars", secureCookies: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const id = "507f1f77bcf86cd799439012";
  const ownerId = "507f1f77bcf86cd799439011";
  const account = { id: ownerId, name: "Test", email: "test@example.com", roles: ["funder"], status: "active", passwordHash: await hashPassword("test") };
  let receipt = { contentType: "image/png", data: Buffer.from("receipt image bytes") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const find = t.mock.method(Contribution, "findOne", (filter) => {
    assert.deepEqual(filter, { _id: id, contributor: account.id });
    return { select: async (selection) => {
      assert.equal(selection, "+receipt");
      return filter.contributor === ownerId ? { receipt } : null;
    } };
  });
  const login = () => fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
  const get = (path, cookie) => fetch(base + path, { headers: cookie ? { Cookie: cookie } : {} });
  const path = `/api/contributions/${id}/receipt`;
  try {
    assert.equal((await get(path)).status, 401);
    assert.equal(find.mock.callCount(), 0);
    const cookie = (await login()).headers.get("set-cookie").split(";")[0];
    for (const [type, extension] of [["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"], ["application/pdf", "pdf"]]) {
      receipt.contentType = type;
      const view = await get(path, cookie);
      assert.equal(view.status, 200);
      assert.equal(view.headers.get("content-type"), type);
      assert.equal(view.headers.get("cache-control"), "no-store");
      assert.equal(view.headers.get("x-content-type-options"), "nosniff");
      assert.equal(view.headers.get("content-security-policy"), "sandbox; default-src 'none'");
      assert.equal(view.headers.get("content-disposition"), `inline; filename="receipt-${id}.${extension}"`);
      assert.deepEqual(Buffer.from(await view.arrayBuffer()), receipt.data);
      const download = await get(path + "?download=1", cookie);
      assert.equal(download.headers.get("content-disposition"), `attachment; filename="receipt-${id}.${extension}"`);
    }
    assert.equal((await get("/api/contributions/invalid/receipt", cookie)).status, 404);
    account.id = "507f1f77bcf86cd799439099";
    const otherCookie = (await login()).headers.get("set-cookie").split(";")[0];
    assert.equal((await get(path, otherCookie)).status, 404);
    account.id = ownerId;
    receipt = null;
    assert.equal((await get(path, cookie)).status, 404);
    receipt = { contentType: "text/html", data: Buffer.from("invalid") };
    assert.equal((await get(path, cookie)).status, 404);
    account.status = "suspended";
    assert.equal((await get(path, cookie)).status, 401);
    account.status = "active";
    assert.equal((await get(path, cookie)).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
