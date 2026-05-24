const mongoose = require("mongoose");

const callAttemptSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    phoneNumber: { type: String, required: true },
    providerCallId: { type: String, index: true },
    status: { type: String, default: "initiated" },
    metadata: { type: Object, default: {} },
    events: [
      {
        payload: { type: Object, default: {} },
        receivedAt: { type: Date, default: () => new Date() }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("CallAttempt", callAttemptSchema);
