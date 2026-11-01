const path = require("node:path");
const mongoose = require("mongoose");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true,
});

async function checkDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "floodguard",
      serverSelectionTimeoutMS: 10000,
    });

    await mongoose.connection.db.admin().ping();

    console.log("MongoDB Atlas connected successfully.");
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error(`Database connection failed (${error.name}).`);
    console.error(
      "Check your URI, password, Atlas IP access list, and internet connection."
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();