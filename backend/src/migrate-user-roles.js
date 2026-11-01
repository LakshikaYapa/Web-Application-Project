const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const connectDatabase = require("./config/db");
const { ACCOUNT_ROLES } = require("./constants/roles");

async function migrate() {
  try {
    await connectDatabase();
    const users = mongoose.connection.collection("users");
    const invalid = await users.countDocuments({ roles: { $exists: false }, role: { $nin: ACCOUNT_ROLES } });
    if (invalid) throw new Error("Some legacy accounts have missing or unknown roles; review them before migrating.");
    const result = await users.updateMany(
      { roles: { $exists: false }, role: { $in: ACCOUNT_ROLES } },
      [{ $set: { roles: ["$role"] } }]
    );
    // Keep the legacy field so the migration is additive and safely repeatable.
    console.log(`Migrated ${result.modifiedCount} account(s) to roles arrays.`);
  } catch (error) {
    console.error(`Role migration failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
