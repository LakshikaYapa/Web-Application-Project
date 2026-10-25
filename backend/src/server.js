const path = require("node:path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true,
});

const mongoose = require("mongoose");
const connectDatabase = require("./config/db");
const User = require("./models/User");
const app = require("./app");
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    await User.init();

    app.listen(PORT, () => {
      console.log(`FloodGuard backend: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed (${error.name}).`);
    console.error("Check your database configuration and network access.");

    await mongoose.disconnect();
    process.exitCode = 1;
  }
}

startServer();
