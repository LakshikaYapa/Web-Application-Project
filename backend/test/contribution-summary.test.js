const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const Contribution = require("../src/models/Contribution");
test("donation summary aggregates all approved financial donations and handles an empty fund", async (t) => {
  let rows = [{ totalMinor: 125050, donationCount: 8 }];
  t.mock.method(Contribution, "aggregate", async (pipeline) => {
    assert.deepEqual(pipeline, [
      { $match: { status: "approved", supportTypes: "financial", currency: "LKR", amountMinor: { $gt: 0 } } },
      { $group: { _id: null, totalMinor: { $sum: "$amountMinor" }, donationCount: { $sum: 1 } } },
    ]);
    return rows;
  });
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "donation-summary-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/contributions/summary`;
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { success: true, currency: "LKR", totalMinor: 125050, donationCount: 8 });
    rows = [];
    assert.deepEqual(await (await fetch(url)).json(), { success: true, currency: "LKR", totalMinor: 0, donationCount: 0 });
  } finally { await new Promise(resolve => server.close(resolve)); store.clear(); }
});
