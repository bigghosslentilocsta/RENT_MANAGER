const mongoose = require("mongoose");

const flatSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    baseRent: { type: Number, required: true },
    isOccupied: { type: Boolean, default: false },
    currentTenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flat", flatSchema);
