const { test } = require("node:test");
const assert = require("node:assert/strict");
const session = require("express-session");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { hashPassword } = require("../src/utils/password");
test("profile photo upload is session-owned, validates image bytes, serves photos and supports removal", async (t) => {
  const account = { id: "507f1f77bcf86cd799439011", name: "Helper", email: "photo@example.com", roles: ["volunteer"], status: "active", passwordHash: await hashPassword("test") };
  const png = Buffer.alloc(24); Buffer.from([137,80,78,71,13,10,26,10]).copy(png); png.write("IHDR",12);
  t.mock.method(User, "findOne", () => ({ select: async () => account }));
  t.mock.method(User, "findById", () => ({ then: (resolve) => Promise.resolve(account).then(resolve), select: async () => account }));
  t.mock.method(User, "updateOne", async (filter, changes) => {
    assert.deepEqual(filter, { _id: account.id, status: "active" });
    if (changes.$set) Object.assign(account, changes.$set);
    if (changes.$unset) { delete account.profilePhoto; delete account.photoVersion; }
    return { matchedCount: 1 };
  });
  const store = new session.MemoryStore();
  const server = createApp({ sessionStore: store, sessionSecret: "profile-photo-test-secret-at-least-32", secureCookies: false }).listen(0,"127.0.0.1");
  await new Promise(resolve => server.once("listening",resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const form = (bytes = png) => { const body = new FormData(); body.append("photo", new Blob([bytes], { type: "image/png" }), "photo.png"); return body; };
  try {
    assert.equal((await fetch(base+"/api/profile/photo", { method:"PUT", headers:{"X-CSRF-Protection":"1"},body:form() })).status,401);
    const login = await fetch(base+"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-Protection":"1"},body:JSON.stringify({email:account.email,password:"test"})});
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const headers = { Cookie:cookie, "X-CSRF-Protection":"1" };
    assert.equal((await fetch(base+"/api/profile/photo",{method:"PUT",headers:{Cookie:cookie},body:form()})).status,403);
    assert.equal((await fetch(base+"/api/profile/photo",{method:"PUT",headers,body:form(Buffer.from("fake"))})).status,400);
    const upload = await fetch(base+"/api/profile/photo",{method:"PUT",headers,body:form()});
    assert.equal(upload.status,200); const saved=await upload.json(); assert.ok(saved.photoUrl.includes(account.id));
    const me = await (await fetch(base+"/api/auth/me",{headers})).json(); assert.equal(me.user.photoUrl,saved.photoUrl); assert.equal(me.user.profilePhoto,undefined);
    const photo = await fetch(base+saved.photoUrl); assert.equal(photo.status,200); assert.equal(photo.headers.get("x-content-type-options"),"nosniff"); assert.deepEqual(Buffer.from(await photo.arrayBuffer()),png);
    account.roles=["help_seeker"];
    assert.equal((await fetch(base+saved.photoUrl)).status,404);
    assert.equal((await fetch(base+saved.photoUrl,{headers})).status,200);
    assert.equal((await fetch(base+"/api/profile/photo",{method:"DELETE",headers})).status,200);
    assert.equal((await fetch(base+saved.photoUrl,{headers})).status,404);
  } finally { await new Promise(resolve=>server.close(resolve)); store.clear(); }
});
