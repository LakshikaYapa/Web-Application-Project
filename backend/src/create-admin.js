const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const connectDatabase = require("./config/db");
const User = require("./models/User");
const { hashPassword } = require("./utils/password");

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !password || [...password].length > 128) {
    console.error("Set ADMIN_EMAIL and a nonempty ADMIN_PASSWORD (up to 128 characters) in backend/.env before running admin:create.");
    process.exitCode = 1;
    return;
  }
  try {
    await connectDatabase();
    await User.init();
    if (await User.exists({ email })) {
      console.error("An account with this email already exists. No account was changed.");
      process.exitCode = 1;
      return;
    }
    await User.create({ name: "FloodGuard Admin", email, passwordHash: await hashPassword(password), roles: ["admin"] });
    console.log("Administrator created. Sign in through the homepage to open /admin.");
  } catch (error) {
    console.error(`Administrator creation failed (${error.name}). Check database access and configuration.`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
createAdmin();
