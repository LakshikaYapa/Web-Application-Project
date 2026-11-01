const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { validateContribution } = require("../src/validation/contribution");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const Contribution = require("../src/models/Contribution");
const { hashPassword } = require("../src/utils/password");

const valid = { supportTypes: ["financial", "other"], nearestTown: " Kandy ", phone: "077 123 4567", amount: "1234.56", otherSupport: " Bedding ", notes: " Family support " };
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
const receipt = { mimetype: "image/png", buffer: png };

test("contributions validate support, contact details, receipts and exact LKR cents", () => {
  const result = validateContribution(valid, receipt);
  assert.equal(result.errors, undefined);
  assert.equal(result.value.amountMinor, 123456);
  assert.equal(result.value.phone, "+94771234567");
  assert.equal(result.value.otherSupport, "Bedding");
  assert.equal(result.value.notes, "Family support");
  for (const [amount, cents] of [["0.01", 1], ["1.1", 110], ["100", 10000], ["9999999999.99", 999999999999]]) assert.equal(validateContribution({ ...valid, amount }, receipt).value.amountMinor, cents);
  for (const amount of [undefined, 10, "0", "-1", "1e3", "1.001", "Infinity", "NaN", "10000000000", "00.50"]) assert.ok(validateContribution({ ...valid, amount }, receipt).errors.amount);
  for (const body of [null, [], {}, { ...valid, status: "confirmed" }, { ...valid, contributor: "someone-else" },
    { ...valid, supportTypes: [] }, { ...valid, supportTypes: ["financial", "financial"] },
    { ...valid, supportTypes: ["unknown"] }, { ...valid, otherSupport: " " },
    { ...valid, nearestTown: " " }, { ...valid, phone: "123" }, { ...valid, notes: {} },
  ]) assert.ok(validateContribution(body, receipt).errors);
  assert.ok(validateContribution(valid).errors.receipt);
  const nonFinancial = { supportTypes: ["food_water", "shelter"], nearestTown: "Kandy", phone: "+94 77 123 4567" };
  assert.equal(validateContribution(nonFinancial).errors, undefined);
  assert.ok(validateContribution(nonFinancial, receipt).errors.financial);
  assert.ok(validateContribution({ ...nonFinancial, amount: "100" }).errors.financial);
});

test("contribution API saves a private receipt under the active session owner and rejects invalid uploads", async (t) => {
  const store = new session.MemoryStore();
  const app = createApp({ sessionStore: store, sessionSecret: "contribution-test-session-secret-at-least-32", secureCookies: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["funder"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const create = t.mock.method(Contribution, "create", async (data) => {
    const doc = new Contribution(data);
    await doc.validate();
    return doc;
  });
  function form(bytes = png, type = "image/png", financial = true) {
    const data = new FormData();
    data.append("supportTypes", financial ? "financial" : "food_water");
    data.append("nearestTown", "Kandy"); data.append("phone", "077 123 4567");
    if (financial) data.append("amount", "1234.56");
    if (bytes) data.append("receipt", new Blob([bytes], { type }), "receipt");
    return data;
  }
  const send = (data, cookie, csrf = true) => fetch(base + "/api/contributions", { method: "POST", headers: { ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { "X-CSRF-Protection": "1" } : {}) }, body: data });
  try {
    assert.equal((await send(form())).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await send(form(), cookie, false)).status, 403);
    const response = await send(form(), cookie);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.contribution.status, "pending_review");
    assert.ok(body.contribution.id);
    for (const field of ["receipt", "phone", "contributor", "amountMinor"]) assert.equal(Object.hasOwn(body.contribution, field), false);
    assert.equal(create.mock.calls[0].arguments[0].contributor, account.id);
    assert.equal(create.mock.calls[0].arguments[0].amountMinor, 123456);
    assert.deepEqual(create.mock.calls[0].arguments[0].receipt.data, png);
    const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
    assert.equal((await send(form(pdf, "application/pdf"), cookie)).status, 201);
    assert.equal((await send(form(null, "image/png", false), cookie)).status, 201);
    const forged = form(); forged.append("status", "confirmed");
    for (const data of [form(Buffer.from("fake png")), form(png, "text/html"), form(null), forged]) assert.equal((await send(data, cookie)).status, 400);
    const tooLarge = await send(form(Buffer.alloc(5 * 1024 * 1024 + 1)), cookie);
    assert.equal(tooLarge.status, 413);
    assert.equal(create.mock.callCount(), 3);
    account.status = "suspended";
    assert.equal((await send(form(), cookie)).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
