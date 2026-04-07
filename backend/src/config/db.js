const mongoose = require("mongoose");
const Flat = require("../models/Flat");

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri && process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production environment");
  }
  
  const connectionString = uri || "mongodb://127.0.0.1:27017/rent_management";

  try {
    await mongoose.connect(connectionString);
    console.log(`Connected to MongoDB: ${connectionString.includes("mongodb+srv") ? "Atlas (Cloud)" : "Local"}`);
  } catch (error) {
    if (error?.code === 8000 || /bad auth|authentication failed/i.test(error?.message || "")) {
      const redactedUri = connectionString.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:<redacted>@");
      throw new Error(
        [
          "MongoDB Atlas authentication failed.",
          "Verify MONGODB_URI username/password in backend/.env and Atlas Database Access user credentials.",
          "If password contains special characters, URL-encode it (for example @ -> %40, # -> %23, / -> %2F).",
          `Current URI (redacted): ${redactedUri}`,
        ].join(" ")
      );
    }

    throw error;
  }
};

const ensureFlatsSeeded = async () => {
  const flatNumbers = ["g1", "101", "201", "202", "203", "301", "302", "303", "401", "402", "403"];
  const upserts = flatNumbers.map((number) =>
    Flat.findOneAndUpdate(
      { number },
      { $setOnInsert: { number, baseRent: 0, isOccupied: false, currentTenant: null } },
      { upsert: true, new: true }
    )
  );

  await Promise.all(upserts);
};

module.exports = {
  connectDb,
  ensureFlatsSeeded
};
