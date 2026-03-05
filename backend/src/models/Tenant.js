const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat", default: null },
    agreedRent: { type: Number, required: true },
    agreedDeposit: { type: Number, default: 0 },
    leaseStart: { type: Date, required: true },
    leaseEnd: { type: Date, default: null },
    vacatingDate: { type: Date, default: null },
    status: { type: String, enum: ["Active", "Past"], default: "Active" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);
