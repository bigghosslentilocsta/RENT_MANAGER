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
});

router.post("/move-in", async (req, res) => {
  const { flatNumber, name, phone, agreedRent, agreedDeposit, leaseStart, leaseEnd, baseRent } =
    req.body;

  if (!flatNumber || !name || !phone || !agreedRent || !leaseStart) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  await ensureFlatsSeeded();
  const flat = await Flat.findOne({ number: String(flatNumber) });
  if (!flat) {
    return res.status(404).json({ message: "Flat not found" });
  }

  if (flat.isOccupied) {
    return res.status(409).json({ message: "Flat is already occupied" });
  }

  const tenant = await Tenant.create({
    name,
    phone,
    agreedRent,
    agreedDeposit: Number(agreedDeposit) || 0,
    leaseStart: new Date(leaseStart),
    leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
    status: "Active",
    flatId: flat._id
  });

  flat.isOccupied = true;
  flat.currentTenant = tenant._id;
  if (typeof baseRent === "number") {
    flat.baseRent = baseRent;
  }
  await flat.save();

  const monthKey = getMonthKey();
  await Payment.findOneAndUpdate(
    { tenantId: tenant._id, month: monthKey },
    {
      $setOnInsert: {
        flatId: flat._id,
        amount: agreedRent,
        status: "Pending",
        date: null
      }
    },
    { upsert: true, new: true }
  );

  res.status(201).json({ tenant });
});

router.post("/vacate/:tenantId", async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  if (tenant.status === "Past") {
    return res.status(409).json({ message: "Tenant is already vacated" });
  }

  const flat = tenant.flatId ? await Flat.findById(tenant.flatId) : null;

  tenant.status = "Past";
  tenant.vacatingDate = new Date();
  tenant.flatId = null;
  await tenant.save();

  if (flat) {
    flat.isOccupied = false;
    flat.currentTenant = null;
    await flat.save();
  }

  res.json({ tenant });
});

router.patch("/payments/:id", async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  const nextStatus = payment.status === "Paid" ? "Pending" : "Paid";
  payment.status = nextStatus;
  payment.date = nextStatus === "Paid" ? new Date() : null;
  await payment.save();

  res.json({ payment });
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

    payment.date = updatedDate;
    await payment.save();

    return res.json({ payment });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update paid date." });
  }
});

router.get("/tenants/:tenantId/history", async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  const payments = await Payment.find({ tenantId }).sort({ month: -1 }).lean();
  const depositPayments = await DepositPayment.find({ tenantId }).sort({ date: -1 }).lean();
  res.json({ tenant, payments, depositPayments });
});

router.post("/tenants/:tenantId/deposits", async (req, res) => {
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
});

router.get("/history", async (req, res) => {
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
});

router.get("/rent-history", async (req, res) => {
  const { month } = req.query; // format: "2026-03"
  
  if (!month || !month.match(/^\d{4}-\d{2}$/)) {
    return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
  }

  // Find all payments for the month and populate tenant/flat info
  const payments = await Payment.find({ month })
    .populate({
      path: "tenantId",
      match: { status: "Active" } // Only include payments for active tenants
    })
    .populate("flatId")
    .lean();
  
  // Filter out payments where tenant was not found (vacated tenants)
  const activePayments = payments.filter((p) => p.tenantId !== null);
  
  const records = activePayments.map((payment) => ({
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
});

module.exports = router;
