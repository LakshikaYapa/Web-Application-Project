const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use("/api/auth", authRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "FloodGuard API is running" });
});

app.get("/api/ready", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error("Database is not connected");
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ success: true, database: "connected" });
  } catch {
    res.status(503).json({ success: false, database: "unavailable" });
  }
});

app.use((error, _req, res, _next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, code: "INVALID_JSON", message: "Send valid JSON." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ success: false, code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." });
  }
  // Do not expose database errors, submitted values, or stack traces to clients.
  console.error(`Request failed (${error.name}).`);
  return res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Unable to complete the request." });
});

module.exports = app;
