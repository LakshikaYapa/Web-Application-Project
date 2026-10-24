const mongoose = require("mongoose");

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "floodguard",
    serverSelectionTimeoutMS: 10000,
  });

  await mongoose.connection.db.admin().ping();

  console.log("MongoDB connected successfully.");
}

module.exports = connectDatabase;