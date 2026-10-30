const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const Contribution = require("../src/models/Contribution");

test("public donations include approved support and amounts but exclude receipts and private details", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "public-contributions-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  let records = [
    { _id: "contribution-1", contributor: { name: "Supporter", email: "private" }, supportTypes: ["financial", "food_water"], nearestTown: "Kandy", amountMinor: 100000, currency: "LKR", createdAt: "2026-10-31T00:00:00Z", receipt: { data: "private" }, phone: "private", notes: "private" },
    { _id: "contribution-2", contributor: null },
  ];
  t.mock.method(Contribution, "find", (filter) => {
    assert.deepEqual(filter, { status: "approved" });
    const query = {
      select(fields) { assert.equal(fields, "contributor supportTypes nearestTown amountMinor currency createdAt"); return query; },
      populate(config) { assert.deepEqual(config, { path: "contributor", select: "name", match: { status: "active" } }); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      limit(count) { assert.equal(count, 6); return query; },
      async lean() { return records; },
    };
    return query;
  });
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/contributions`;
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { success: true, contributions: [{ id: "contribution-1", name: "Supporter", supportTypes: ["financial", "food_water"], nearestTown: "Kandy", amountMinor: 100000, currency: "LKR", createdAt: "2026-10-31T00:00:00Z" }] });
    records = [];
    assert.deepEqual((await (await fetch(base)).json()).contributions, []);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
