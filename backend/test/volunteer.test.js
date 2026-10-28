const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { validateVolunteer } = require("../src/validation/volunteer");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const VolunteerProfile = require("../src/models/VolunteerProfile");
const { hashPassword } = require("../src/utils/password");

const valid = { nearestTown: " Kandy ", areas: {
  relief: { skills: ["Packing supplies", "Food preparation"], otherSkills: "", otherSupport: "" },
  transport: { skills: ["Driving", "Other skills"], otherSkills: " Bicycle repairs ", otherSupport: "" },
  other: { skills: ["Communication"], otherSupport: " Online coordination " },
} };

test("volunteer validation supports multiple areas, matching skills and custom details", () => {
  const result = validateVolunteer(valid);
  assert.equal(result.errors, undefined);
  assert.equal(result.value.nearestTown, "Kandy");
  assert.equal(result.value.supportAreas.length, 3);
  assert.equal(result.value.supportAreas[1].otherSkills, "Bicycle repairs");
  assert.equal(result.value.supportAreas[2].otherSupport, "Online coordination");
  for (const body of [null, [], {}, { ...valid, user: "spoofed" }, { ...valid, availability: "Weekdays" },
    { ...valid, nearestTown: " " }, { ...valid, areas: {} }, { ...valid, areas: [] },
    { ...valid, areas: { admin: { skills: ["Driving"] } } },
    ...[null, {}, { skills: [] }, { skills: ["Driving"] }, { skills: ["Packing supplies", "Packing supplies"] },
      { skills: ["Other skills"] }, { skills: ["Other skills"], otherSkills: "a".repeat(501) },
      { skills: ["Packing supplies"], otherSkills: "Unselected custom skill" },
      { skills: ["Packing supplies"], otherSupport: "Unselected custom support" },
      { skills: ["Packing supplies"], role: "admin" }].map((details) => ({ ...valid, areas: { relief: details } })),
    { ...valid, areas: { other: { skills: ["Communication"] } } },
  ]) assert.ok(validateVolunteer(body).errors, JSON.stringify(body));
});

test("volunteer API requires an active session and saves only the authenticated user's profile", async (t) => {
  const store = new session.MemoryStore();
  const app = createApp({ sessionStore: store, sessionSecret: "volunteer-test-session-secret-at-least-32", secureCookies: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const account = { id: "507f1f77bcf86cd799439011", name: "Test", email: "test@example.com", roles: ["help_seeker"], status: "active", passwordHash: await hashPassword("test") };
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", async () => account);
  const save = t.mock.method(VolunteerProfile, "findOneAndUpdate", async (filter, update, options) => {
    assert.deepEqual(filter, { user: account.id });
    assert.equal(options.upsert, true);
    assert.equal(options.runValidators, true);
    assert.equal(options.returnDocument, "after");
    assert.deepEqual(Object.keys(update), ["$set"]);
    assert.equal(Object.hasOwn(update.$set, "user"), false);
    const profile = new VolunteerProfile({ user: filter.user, ...update.$set });
    await profile.validate();
    return profile;
  });
  const put = (body, cookie, csrf = true) => fetch(base + "/api/volunteers/me", {
    method: "PUT", headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Protection": "1" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await put(valid)).status, 401);
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" }, body: JSON.stringify({ email: account.email, password: "test" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await put(valid, cookie, false)).status, 403);
    assert.equal((await put({ ...valid, user: "someone-else" }, cookie)).status, 400);
    assert.equal(save.mock.callCount(), 0);
    const response = await put(valid, cookie);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(body.profile.id);
    assert.equal(Object.hasOwn(body.profile, "user"), false);
    const updated = { nearestTown: "Colombo", areas: { community: { skills: ["Translation"] } } };
    assert.equal((await put(updated, cookie)).status, 200);
    assert.deepEqual(save.mock.calls[1].arguments[1].$set.supportAreas.map((item) => item.area), ["community"]);
    let limited;
    for (let attempt = 0; attempt < 11; attempt++) {
      limited = await put({}, cookie);
      if (limited.status === 429) break;
    }
    assert.equal(limited.status, 429);
    assert.equal(save.mock.callCount(), 2);
    account.status = "suspended";
    assert.equal((await put(valid, cookie)).status, 401);
    assert.deepEqual(account.roles, ["help_seeker"]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.clear();
  }
});
