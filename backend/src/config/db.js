const mongoose = require("mongoose");
const Flat = require("../models/Flat");

const connectDb = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rent_management";
  await mongoose.connect(uri);
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
