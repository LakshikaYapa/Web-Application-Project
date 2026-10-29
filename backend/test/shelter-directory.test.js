const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const { Shelter } = require("../src/models/Shelter");

test("public shelter directory paginates, escapes town searches and omits private fields", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "directory-test-secret-at-least-32-characters", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const filters = [];
  t.mock.method(Shelter, "find", (filter) => {
    filters.push(filter);
    const query = {
      select(fields) { assert.equal(fields.includes("phone"), false); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      skip(value) { assert.ok([0, 20].includes(value)); return query; },
      limit(value) { assert.equal(value, 21); return query; },
      async lean() { return Array.from({ length: 21 }, (_, index) => ({ _id: String(index), name: "Community Hall", nearestTown: "Kandy", address: "Main road", capacity: 100, occupied: 10, status: "pending", phone: "private", submittedBy: "private" })); },
    };
    return query;
  });
  const base = `http://127.0.0.1:${server.address().port}/api/shelters`;
  try {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.hasMore, true);
    assert.equal(body.shelters.length, 20);
    assert.equal(body.shelters[0].phone, undefined);
    assert.equal(body.shelters[0].submittedBy, undefined);
    assert.deepEqual(filters[0], { status: "pending" });
    assert.equal((await fetch(base + "?page=2&town=" + encodeURIComponent("Kandy.*"))).status, 200);
    assert.equal(filters[1].nearestTown.$regex, "Kandy\\.\\*");
    for (const query of ["page=0", "page=1.5", "page=1&page=2", "town[x]=a", "town=" + "x".repeat(101)]) assert.equal((await fetch(base + "?" + query)).status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
