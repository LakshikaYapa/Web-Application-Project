const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const { FloodReport } = require("../src/models/FloodReport");

test("public flood reports show only approved records and photos without private phone data", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "public-flood-reports-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const id = "507f1f77bcf86cd799439012";
  t.mock.method(FloodReport, "find", (filter) => {
    assert.deepEqual(filter, { status: "approved" });
    const query = {
      select(fields) { assert.ok(!fields.includes("phone")); assert.ok(!fields.includes("photos.data")); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      skip(value) { assert.equal(value, 12); return query; },
      limit(value) { assert.equal(value, 13); return query; },
      async lean() { return Array.from({ length: 13 }, () => ({ _id: id, nearestTown: "Kandy", description: "Flooded road", phone: "private", reporter: "private", photos: [{ contentType: "image/png", data: "private" }] })); },
    };
    return query;
  });
  const bytes = Buffer.from("photo");
  let record = { photos: [{ contentType: "image/png", data: bytes }] };
  const findPhoto = t.mock.method(FloodReport, "findOne", (filter) => {
    assert.deepEqual(filter, { _id: id, status: "approved" });
    return { select: async () => record };
  });
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/flood-reports`;
    const response = await fetch(base + "?page=2");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.hasMore, true);
    assert.equal(body.reports.length, 12);
    assert.equal(body.reports[0].phone, undefined);
    assert.equal(body.reports[0].reporter, undefined);
    assert.equal(body.reports[0].photos, undefined);
    assert.equal(body.reports[0].photoCount, 1);
    const photo = await fetch(`${base}/${id}/photos/0`);
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get("x-content-type-options"), "nosniff");
    assert.equal(photo.headers.get("cache-control"), "no-store");
    assert.deepEqual(Buffer.from(await photo.arrayBuffer()), bytes);
    record = null;
    assert.equal((await fetch(`${base}/${id}/photos/0`)).status, 404);
    assert.equal((await fetch(`${base}/bad/photos/0`)).status, 404);
    assert.equal((await fetch(`${base}/${id}/photos/3`)).status, 404);
    for (const query of ["page=0", "page=1.5", "page=1&page=2"]) assert.equal((await fetch(base + "?" + query)).status, 400);
    assert.equal(findPhoto.mock.callCount(), 2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
