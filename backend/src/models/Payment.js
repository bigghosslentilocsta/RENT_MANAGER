const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat", required: true },
    amount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    partialPayments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: () => new Date() },
        note: { type: String, default: "" }
      }
    ],
    month: { type: String, required: true },
    status: { type: String, enum: ["Paid", "Partially Paid", "Pending"], default: "Pending" },
    date: { type: Date, default: null }
  },
  { timestamps: true }
);

paymentSchema.index({ tenantId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Payment", paymentSchema);
