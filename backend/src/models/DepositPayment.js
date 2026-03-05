const mongoose = require("mongoose");

const depositPaymentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DepositPayment", depositPaymentSchema);
