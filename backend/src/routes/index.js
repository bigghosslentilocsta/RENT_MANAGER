const express = require("express");
const mongoose = require("mongoose");
const Flat = require("../models/Flat");
const Tenant = require("../models/Tenant");
const Payment = require("../models/Payment");
const DepositPayment = require("../models/DepositPayment");
const { ensureFlatsSeeded } = require("../config/db");

const router = express.Router();
const flatOrder = ["g1", "101", "201", "202", "203", "301", "302", "303", "401", "402", "403"];
const flatOrderMap = flatOrder.reduce((acc, value, index) => {
  acc[value] = index;
  return acc;
}, {});

const getMonthKey = (date = new Date()) => {
  return date.toISOString().slice(0, 7);
};

const ensureCurrentMonthPayments = async (tenants, monthKey) => {
  const tasks = tenants.map((tenant) => {
    return Payment.findOneAndUpdate(
      { tenantId: tenant._id, month: monthKey },
      {
        $setOnInsert: {
          flatId: tenant.flatId,
          amount: tenant.agreedRent,
          status: "Pending",
          date: null
        }
      },
      { upsert: true, new: true }
    );
  });

  await Promise.all(tasks);
};

router.get("/dashboard", async (req, res) => {
  try {
    await ensureFlatsSeeded();
    const monthKey = getMonthKey();

    const flats = await Flat.find({ number: { $in: flatOrder } }).populate("currentTenant").lean();
    flats.sort((a, b) => {
      const orderA = flatOrderMap[String(a.number)] ?? Number.MAX_SAFE_INTEGER;
      const orderB = flatOrderMap[String(b.number)] ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    const activeTenants = flats
      .map((flat) => flat.currentTenant)
      .filter((tenant) => tenant && tenant.status === "Active");

    await ensureCurrentMonthPayments(activeTenants, monthKey);

    const tenantIds = activeTenants.map((tenant) => tenant._id);
    const payments = await Payment.find({ tenantId: { $in: tenantIds }, month: monthKey }).lean();
    const paymentByTenant = payments.reduce((acc, payment) => {
      acc[payment.tenantId.toString()] = payment;
      return acc;
    }, {});

    const responseFlats = flats.map((flat) => {
      const tenant = flat.currentTenant;
      if (!tenant) {
        return {
          ...flat,
          paymentStatus: null,
          paymentId: null,
          paymentAmount: null,
          month: monthKey
        };
      }

      const payment = paymentByTenant[tenant._id.toString()];
      return {
        ...flat,
        paymentStatus: payment ? payment.status : "Pending",
        paymentId: payment ? payment._id : null,
        paymentAmount: payment ? payment.amount : tenant.agreedRent,
        month: monthKey
      };
    });

    res.json({ month: monthKey, flats: responseFlats });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Unable to load dashboard data" });
  }
});

router.post("/move-in", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { flatNumber, name, phone, agreedRent, agreedDeposit, leaseStart, leaseEnd, baseRent } =
      req.body;

    if (!flatNumber || !name || !phone || !agreedRent || !leaseStart) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await ensureFlatsSeeded();
    const flat = await Flat.findOne({ number: String(flatNumber) }).session(session);
    if (!flat) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Flat not found" });
    }

    if (flat.isOccupied) {
      await session.abortTransaction();
      return res.status(409).json({ message: "Flat is already occupied" });
    }

    const tenant = await Tenant.create([{
      name,
      phone,
      agreedRent,
      agreedDeposit: Number(agreedDeposit) || 0,
      leaseStart: new Date(leaseStart),
      leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
      status: "Active",
      flatId: flat._id
    }], { session });

    flat.isOccupied = true;
    flat.currentTenant = tenant[0]._id;
    if (typeof baseRent === "number") {
      flat.baseRent = baseRent;
    }
    await flat.save({ session });

    const monthKey = getMonthKey();
    await Payment.findOneAndUpdate(
      { tenantId: tenant[0]._id, month: monthKey },
      {
        $setOnInsert: {
          flatId: flat._id,
          amount: agreedRent,
          status: "Pending",
          date: null
        }
      },
      { upsert: true, new: true, session }
    );

    await session.commitTransaction();
    res.status(201).json({ tenant: tenant[0] });
  } catch (error) {
    await session.abortTransaction();
    console.error("Move-in error:", error);
    res.status(500).json({ message: error.message || "Move-in operation failed" });
  } finally {
    session.endSession();
  }
});

router.post("/vacate/:tenantId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Tenant not found" });
    }

    if (tenant.status === "Past") {
      await session.abortTransaction();
      return res.status(409).json({ message: "Tenant is already vacated" });
    }

    const flat = tenant.flatId ? await Flat.findById(tenant.flatId).session(session) : null;

    tenant.status = "Past";
    tenant.vacatingDate = new Date();
    tenant.flatId = null;
    await tenant.save({ session });

    if (flat) {
      flat.isOccupied = false;
      flat.currentTenant = null;
      await flat.save({ session });
    }

    await session.commitTransaction();
    res.json({ tenant });
  } catch (error) {
    await session.abortTransaction();
    console.error("Vacate error:", error);
    res.status(500).json({ message: "Vacate operation failed" });
  } finally {
    session.endSession();
  }
});

router.patch("/payments/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const nextStatus = payment.status === "Paid" ? "Pending" : "Paid";
    payment.status = nextStatus;
    payment.date = nextStatus === "Paid" ? new Date() : null;
    await payment.save();

    res.json({ payment });
  } catch (error) {
    console.error("Toggle payment error:", error);
    res.status(500).json({ message: "Failed to update payment status" });
  }
});

router.patch("/payments/:id/date", async (req, res) => {
  try {
    const paymentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: "Invalid payment id." });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "Paid") {
      return res.status(400).json({ message: "Paid date can only be updated for paid rent." });
    }

    const { paidDate } = req.body;
    if (!paidDate || !/^\d{4}-\d{2}-\d{2}$/.test(paidDate)) {
      return res.status(400).json({ message: "Invalid paidDate format. Use YYYY-MM-DD." });
    }

    const [year, month, day] = paidDate.split("-").map(Number);
    const updatedDate = new Date(year, month - 1, day, 12, 0, 0);
    if (Number.isNaN(updatedDate.getTime())) {
      return res.status(400).json({ message: "Invalid paidDate value." });
    }
    
    // Validate the date is actually what was requested (detect invalid dates like 2026-02-31)
    if (updatedDate.getFullYear() !== year || updatedDate.getMonth() !== month - 1 || updatedDate.getDate() !== day) {
      return res.status(400).json({ message: "Invalid calendar date. Please check the day/month/year combination." });
    }

    payment.date = updatedDate;
    await payment.save();

    return res.json({ payment });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update paid date." });
  }
});

router.get("/tenants/:tenantId/history", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const payments = await Payment.find({ tenantId }).sort({ month: -1 }).lean();
    const depositPayments = await DepositPayment.find({ tenantId }).sort({ date: -1 }).lean();
    res.json({ tenant, payments, depositPayments });
  } catch (error) {
    console.error("Tenant history error:", error);
    res.status(500).json({ message: "Unable to load tenant history" });
  }
});

router.post("/tenants/:tenantId/deposits", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { amount, date, note } = req.body;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Deposit amount must be greater than 0" });
    }

    const depositPayment = await DepositPayment.create({
      tenantId,
      amount: numericAmount,
      date: date ? new Date(date) : new Date(),
      note: note || ""
    });

    res.status(201).json({ depositPayment });
  } catch (error) {
    console.error("Add deposit error:", error);
    res.status(500).json({ message: "Failed to add deposit payment" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const tenants = await Tenant.find({ status: "Past" }).sort({ vacatingDate: -1 }).lean();
    const history = tenants.map((tenant) => {
      const start = tenant.leaseStart ? new Date(tenant.leaseStart) : null;
      const end = tenant.vacatingDate ? new Date(tenant.vacatingDate) : null;
      let stayDurationDays = null;
      if (start && end) {
        const diffMs = end.getTime() - start.getTime();
        stayDurationDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        ...tenant,
        stayDurationDays
      };
    });

    res.json({ tenants: history });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ message: "Unable to load tenant history" });
  }
});

router.get("/rent-history", async (req, res) => {
  try {
    const { month } = req.query; // format: "2026-03"
    
    if (!month || !month.match(/^\d{4}-\d{2}$/)) {
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
    }

    // Find all payments for the month and populate tenant/flat info (include past tenants for historical accuracy)
    const payments = await Payment.find({ month })
      .populate("tenantId")
      .populate("flatId")
      .lean();
    
    // Filter out only payments where tenant data is completely missing (data integrity issue)
    const validPayments = payments.filter((p) => p.tenantId !== null);
    
    const records = validPayments.map((payment) => ({
      _id: payment._id,
      flatNumber: payment.flatId?.number || "Unknown",
      tenantName: payment.tenantId?.name || "Unknown",
      tenantPhone: payment.tenantId?.phone || "-",
      amount: payment.amount,
      status: payment.status,
      month: payment.month,
      paidDate: payment.date,
      leaseStart: payment.tenantId?.leaseStart
    }));

    res.json({ month, records });
  } catch (error) {
    console.error("Rent history error:", error);
    res.status(500).json({ message: "Unable to load rent history" });
  }
});

module.exports = router;
