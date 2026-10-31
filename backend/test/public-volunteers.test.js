const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const VolunteerProfile = require("../src/models/VolunteerProfile");

test("public volunteer cards only query joined active members and omit private contact details", async (t) => {
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "public-volunteers-test-secret-at-least-32", secureCookies: false }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  let records = [
    { _id: "profile-1", user: { name: "Volunteer One", phone: "private", email: "private" }, nearestTown: "Kandy", supportAreas: [{ area: "relief", skills: ["private"] }], status: "joined" },
    { _id: "profile-2", user: null, nearestTown: "Colombo", supportAreas: [] },
  ];
  t.mock.method(VolunteerProfile, "find", (filter) => {
    assert.deepEqual(filter, { status: "joined" });
    const query = {
      select(fields) { assert.equal(fields, "user nearestTown supportAreas.area"); return query; },
      populate(config) { assert.deepEqual(config, { path: "user", select: "name photoVersion", match: { status: "active" } }); return query; },
      sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return query; },
      limit(count) { assert.equal(count, 4); return query; },
      async lean() { return records; },
    };
    return query;
  });
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/volunteers`;
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { success: true, volunteers: [{ id: "profile-1", name: "Volunteer One", nearestTown: "Kandy", supportAreas: ["relief"] }] });
    records[0].user._id = "507f1f77bcf86cd799439011";
    records[0].user.photoVersion = 123;
    const withPhoto = await (await fetch(base)).json();
    assert.equal(withPhoto.volunteers[0].photoUrl, "/api/profile/507f1f77bcf86cd799439011/photo?v=123");
    records = [];
    assert.deepEqual((await (await fetch(base)).json()).volunteers, []);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
