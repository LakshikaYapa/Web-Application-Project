const path = require("node:path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true,
});

const mongoose = require("mongoose");
const connectDatabase = require("./config/db");
const User = require("./models/User");
const { createApp } = require("./app");
const { MongoStore } = require("connect-mongo");
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
    await connectDatabase();
    await User.init();
    const sessionStore = MongoStore.create({ client: mongoose.connection.getClient(), dbName: mongoose.connection.name, collectionName: "sessions" });
    sessionStore.on("error", () => console.error("Session storage error."));
    const app = createApp({
      sessionStore,
      sessionSecret,
      secureCookies: process.env.SESSION_COOKIE_SECURE !== "false",
    });

    app.listen(PORT, () => {
      console.log(`FloodGuard backend: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed (${error.name}).`);
    console.error("Check SESSION_SECRET (at least 32 characters), database configuration and network access.");

    await mongoose.disconnect();
    process.exitCode = 1;
  }
}

startServer();
