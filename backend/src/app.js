const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const helpRequestRoutes = require("./routes/help-requests");
const volunteerRoutes = require("./routes/volunteers");
const contributionRoutes = require("./routes/contributions");
const floodReportRoutes = require("./routes/flood-reports");
const shelterRoutes = require("./routes/shelters");
const session = require("express-session");
const { SESSION_COOKIE_NAME, SESSION_DURATION_MS, cookieOptions } = require("./config/session");

function createApp({ sessionStore, sessionSecret, secureCookies = true }) {
  if (!sessionStore || typeof sessionSecret !== "string" || sessionSecret.length < 32) {
    throw new Error("A session store and a secret of at least 32 characters are required.");
  }
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.locals.sessionCookieOptions = cookieOptions(secureCookies);
  const sessionPaths = ["/api/auth", "/api/help-requests", "/api/volunteers", "/api/contributions", "/api/flood-reports", "/api/shelters"];
  app.use(sessionPaths, (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  app.use(sessionPaths, session({
    name: SESSION_COOKIE_NAME,
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { ...app.locals.sessionCookieOptions, maxAge: SESSION_DURATION_MS },
  }));
  app.use("/api/auth", authRoutes());
  app.use("/api/help-requests", helpRequestRoutes());
  app.use("/api/volunteers", volunteerRoutes());
  app.use("/api/contributions", contributionRoutes());
  app.use("/api/flood-reports", floodReportRoutes());
  app.use("/api/shelters", shelterRoutes());

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

  return app;
}

module.exports = { createApp };
