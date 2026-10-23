const path = require("node:path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true,
});

const express = require("express");
const mongoose = require("mongoose");
const connectDatabase = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FloodGuard API is running",
  });
});

app.get("/api/ready", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database is not connected");
    }

    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      success: true,
      database: "connected",
    });
  } catch {
    res.status(503).json({
      success: false,
      database: "unavailable",
    });
  }
});

async function startServer() {
  try {
    await connectDatabase();

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