const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const { FloodReport } = require("../src/models/FloodReport");
const { validCoordinates } = require("../src/validation/report-coordinates");

test("report coordinates must be finite numbers inside the Sri Lanka map bounds", () => {
  assert.equal(validCoordinates(6.9271, 79.8612), true);
  for (const pair of [[0, 0], [NaN, 80], [7, Infinity], [10, 80], [7, 83], ["7", "80"], [null, null], [undefined, undefined]]) assert.equal(validCoordinates(...pair), false);
});

test("public map returns approved geolocated reports without private fields or fake positions", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "flood-map-test-secret-at-least-32-characters", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.mock.method(FloodReport, "find", (filter) => {
    assert.deepEqual(filter, { status: "approved", latitude: { $gte: 5.85, $lte: 9.95 }, longitude: { $gte: 79.5, $lte: 82.05 } });
    const query = {
      select(fields) { assert.ok(!fields.includes("phone")); assert.ok(!fields.includes("photos")); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      limit(value) { assert.equal(value, 501); return query; },
      async lean() { return [{ _id: "report-1", nearestTown: "Colombo", location: "Main road", situations: ["road"], description: "Road flooded", latitude: 6.9271, longitude: 79.8612, phone: "private", reporter: "private", createdAt: "2026-10-31T00:00:00Z" }, { _id: "old-without-coordinates" }]; },
    };
    return query;
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/flood-reports/map`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { success: true, hasMore: false, reports: [{ id: "report-1", nearestTown: "Colombo", location: "Main road", situations: ["road"], description: "Road flooded", latitude: 6.9271, longitude: 79.8612, createdAt: "2026-10-31T00:00:00Z" }] });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
