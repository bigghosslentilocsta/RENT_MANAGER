const express = require("express");
const mongoose = require("mongoose");
const Flat = require("../models/Flat");
const Tenant = require("../models/Tenant");
const Payment = require("../models/Payment");
const DepositPayment = require("../models/DepositPayment");
const { ensureFlatsSeeded } = require("../config/db");
const { issueAuthToken, validateLogin } = require("../config/auth");

const router = express.Router();
const flatOrder = ["g1", "101", "201", "202", "203", "301", "302", "303", "401", "402", "403"];
const flatOrderMap = flatOrder.reduce((acc, value, index) => {
  acc[value] = index;
  return acc;
}, {});

const getMonthKey = (date = new Date()) => {
  return date.toISOString().slice(0, 7);
};

const isValidMonthKey = (value) => /^\d{4}-\d{2}$/.test(String(value || ""));
const isValidDateInput = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const parseDateInput = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (!isValidDateInput(value)) {
    return null;
  }

  const [year, month, day] = String(value).split("-").map(Number);
  const parsed = new Date(year, month - 1, day, 12, 0, 0);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return null;
  }

  return parsed;
};

const findFlatByNumber = async (flatNumber, session = null) => {
  return Flat.findOne({ number: String(flatNumber || "").trim() }).session(session || null);
};

const findActiveTenantByFlatNumber = async (flatNumber, session = null) => {
  const flat = await findFlatByNumber(flatNumber, session);
  if (!flat) {
    return { flat: null, tenant: null };
  }

  await reconcileFlatOccupancy(flat, session);
  if (!flat.currentTenant) {
    return { flat, tenant: null };
  }

  const tenant = await Tenant.findById(flat.currentTenant).session(session || null);
  if (!tenant || tenant.status !== "Active") {
    return { flat, tenant: null };
  }

  return { flat, tenant };
};

const upsertPaymentForTenantMonth = async ({ tenant, flat, monthKey, amount, status, paidDate, session }) => {
  const update = {
    flatId: flat._id,
    amount,
    status,
    date: status === "Paid" ? (paidDate || new Date()) : null
  };

  return Payment.findOneAndUpdate(
    { tenantId: tenant._id, month: monthKey },
    { $set: update },
    { upsert: true, new: true, session }
  );
};

const reconcileFlatOccupancy = async (flat, session = null) => {
  if (!flat?.isOccupied) {
    return flat;
  }

  if (!flat.currentTenant) {
    flat.isOccupied = false;
    await flat.save(session ? { session } : undefined);
    return flat;
  }

  const tenant = await Tenant.findById(flat.currentTenant).session(session || null);
  if (!tenant || tenant.status !== "Active") {
    flat.isOccupied = false;
    flat.currentTenant = null;
    await flat.save(session ? { session } : undefined);
  }

  return flat;
};

const ensureCurrentMonthPayments = async (tenants, monthKey) => {
  if (!tenants.length) {
    return;
  }

  const tenantIds = tenants.map((tenant) => tenant._id);
  const existing = await Payment.find({ tenantId: { $in: tenantIds }, month: monthKey })
    .select("tenantId")
    .lean();

  const existingTenantIds = new Set(existing.map((payment) => String(payment.tenantId)));
  const missingDocs = tenants
    .filter((tenant) => !existingTenantIds.has(String(tenant._id)))
    .map((tenant) => ({
      tenantId: tenant._id,
      flatId: tenant.flatId,
      amount: tenant.agreedRent,
      month: monthKey,
      status: "Pending",
      date: null
    }));

  if (missingDocs.length > 0) {
    await Payment.insertMany(missingDocs, { ordered: false });
  }
};

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    if (!validateLogin(username, password)) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = issueAuthToken();
    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ message: "Unable to process login." });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
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

    await reconcileFlatOccupancy(flat, session);

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
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid tenant id" });
    }

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
    const vacatingAt = new Date();
    const monthKey = getMonthKey(vacatingAt);
    const flatIdForPayment = flat?._id || tenant.flatId;

    if (flatIdForPayment) {
      await Payment.findOneAndUpdate(
        { tenantId: tenant._id, month: monthKey },
        {
          $set: {
            flatId: flatIdForPayment,
            amount: tenant.agreedRent,
            status: "Paid",
            date: vacatingAt
          }
        },
        { upsert: true, new: true, session }
      );
    }

    tenant.status = "Past";
    tenant.vacatingDate = vacatingAt;
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

    // Keep tenant total deposit in sync with each new deposit payment.
    tenant.agreedDeposit = Number(tenant.agreedDeposit || 0) + numericAmount;
    await tenant.save();

    res.status(201).json({ depositPayment });
  } catch (error) {
    console.error("Add deposit error:", error);
    res.status(500).json({ message: "Failed to add deposit payment" });
  }
});

router.delete("/tenants/:tenantId/deposits/:depositId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tenantId, depositId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tenantId) || !mongoose.Types.ObjectId.isValid(depositId)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid tenant or deposit id" });
    }

    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Tenant not found" });
    }

    const depositPayment = await DepositPayment.findOne({ _id: depositId, tenantId }).session(session);
    if (!depositPayment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Deposit payment not found" });
    }

    tenant.agreedDeposit = Math.max(0, Number(tenant.agreedDeposit || 0) - Number(depositPayment.amount || 0));
    await tenant.save({ session });
    await DepositPayment.deleteOne({ _id: depositId }).session(session);

    await session.commitTransaction();
    res.json({ message: "Deposit payment deleted" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Delete deposit error:", error);
    res.status(500).json({ message: "Failed to delete deposit payment" });
  } finally {
    session.endSession();
  }
});

router.patch("/tenants/:tenantId/rent", async (req, res) => {
  try {
    const { tenantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ message: "Invalid tenant id" });
    }

    const numericRent = Number(req.body?.agreedRent);
    if (!Number.isFinite(numericRent) || numericRent <= 0) {
      return res.status(400).json({ message: "Rent must be a number greater than 0" });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    if (tenant.status !== "Active") {
      return res.status(400).json({ message: "Rent can only be edited for active tenants" });
    }

    tenant.agreedRent = numericRent;
    await tenant.save();

    const currentMonthKey = getMonthKey();
    await Payment.updateMany(
      {
        tenantId: tenant._id,
        month: { $gte: currentMonthKey }
      },
      {
        $set: { amount: numericRent }
      }
    );

    return res.json({ tenant });
  } catch (error) {
    console.error("Update rent error:", error);
    return res.status(500).json({ message: "Unable to update tenant rent" });
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

router.post("/sync/sheet-actions", async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!rows.length) {
      return res.status(400).json({ message: "rows array is required" });
    }

    const results = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] || {};
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const action = String(row.action || "").trim().toUpperCase();
        if (!action) {
          throw new Error("action is required");
        }

        if (action === "MOVE_IN") {
          const required = ["flatNumber", "name", "phone", "agreedRent", "leaseStart"];
          const missing = required.filter((key) => !row[key]);
          if (missing.length) {
            throw new Error(`Missing fields: ${missing.join(", ")}`);
          }

          await ensureFlatsSeeded();
          const flat = await findFlatByNumber(row.flatNumber, session);
          if (!flat) {
            throw new Error("Flat not found");
          }

          await reconcileFlatOccupancy(flat, session);
          if (flat.isOccupied) {
            throw new Error("Flat is already occupied");
          }

          const leaseStartDate = parseDateInput(row.leaseStart);
          if (!leaseStartDate) {
            throw new Error("Invalid leaseStart. Use YYYY-MM-DD");
          }

          const leaseEndDate = row.leaseEnd ? parseDateInput(row.leaseEnd) : null;
          if (row.leaseEnd && !leaseEndDate) {
            throw new Error("Invalid leaseEnd. Use YYYY-MM-DD");
          }

          const agreedRent = Number(row.agreedRent);
          if (!Number.isFinite(agreedRent) || agreedRent <= 0) {
            throw new Error("agreedRent must be a number greater than 0");
          }

          const tenant = await Tenant.create([
            {
              name: row.name,
              phone: row.phone,
              agreedRent,
              agreedDeposit: Number(row.agreedDeposit) || 0,
              leaseStart: leaseStartDate,
              leaseEnd: leaseEndDate,
              status: "Active",
              flatId: flat._id
            }
          ], { session });

          flat.isOccupied = true;
          flat.currentTenant = tenant[0]._id;
          if (row.baseRent != null && row.baseRent !== "") {
            const baseRent = Number(row.baseRent);
            if (!Number.isFinite(baseRent) || baseRent < 0) {
              throw new Error("baseRent must be a non-negative number");
            }
            flat.baseRent = baseRent;
          }
          await flat.save({ session });

          const monthKey = isValidMonthKey(row.month) ? row.month : getMonthKey();
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
          results.push({ index, action, ok: true, message: "Tenant moved in", tenantId: tenant[0]._id });
          continue;
        }

        if (action === "VACATE") {
          let tenant = null;
          let flat = null;

          if (row.tenantId && mongoose.Types.ObjectId.isValid(row.tenantId)) {
            tenant = await Tenant.findById(row.tenantId).session(session);
            if (tenant?.flatId) {
              flat = await Flat.findById(tenant.flatId).session(session);
            }
          } else if (row.flatNumber) {
            const found = await findActiveTenantByFlatNumber(row.flatNumber, session);
            tenant = found.tenant;
            flat = found.flat;
          }

          if (!tenant) {
            throw new Error("Active tenant not found for VACATE");
          }

          if (tenant.status === "Past") {
            throw new Error("Tenant is already vacated");
          }

          const vacatingAt = row.vacatingDate ? parseDateInput(row.vacatingDate) : new Date();
          if (row.vacatingDate && !vacatingAt) {
            throw new Error("Invalid vacatingDate. Use YYYY-MM-DD");
          }

          const monthKey = getMonthKey(vacatingAt);
          const flatIdForPayment = flat?._id || tenant.flatId;
          if (flatIdForPayment) {
            await Payment.findOneAndUpdate(
              { tenantId: tenant._id, month: monthKey },
              {
                $set: {
                  flatId: flatIdForPayment,
                  amount: tenant.agreedRent,
                  status: "Paid",
                  date: vacatingAt
                }
              },
              { upsert: true, new: true, session }
            );
          }

          tenant.status = "Past";
          tenant.vacatingDate = vacatingAt;
          tenant.flatId = null;
          await tenant.save({ session });

          if (flat) {
            flat.isOccupied = false;
            flat.currentTenant = null;
            await flat.save({ session });
          }

          await session.commitTransaction();
          results.push({ index, action, ok: true, message: "Tenant vacated", tenantId: tenant._id });
          continue;
        }

        if (action === "MARK_PAID" || action === "MARK_PENDING") {
          if (!row.flatNumber) {
            throw new Error("flatNumber is required");
          }

          const found = await findActiveTenantByFlatNumber(row.flatNumber, session);
          if (!found.flat || !found.tenant) {
            throw new Error("Active tenant not found for flat");
          }

          const monthKey = isValidMonthKey(row.month) ? row.month : getMonthKey();
          const paidDate = row.paidDate ? parseDateInput(row.paidDate) : null;
          if (row.paidDate && !paidDate) {
            throw new Error("Invalid paidDate. Use YYYY-MM-DD");
          }

          await upsertPaymentForTenantMonth({
            tenant: found.tenant,
            flat: found.flat,
            monthKey,
            amount: found.tenant.agreedRent,
            status: action === "MARK_PAID" ? "Paid" : "Pending",
            paidDate,
            session
          });

          await session.commitTransaction();
          results.push({ index, action, ok: true, message: `Payment ${action === "MARK_PAID" ? "marked paid" : "marked pending"}` });
          continue;
        }

        if (action === "UPDATE_RENT") {
          if (!row.flatNumber || row.agreedRent == null || row.agreedRent === "") {
            throw new Error("flatNumber and agreedRent are required");
          }

          const found = await findActiveTenantByFlatNumber(row.flatNumber, session);
          if (!found.tenant) {
            throw new Error("Active tenant not found for flat");
          }

          const agreedRent = Number(row.agreedRent);
          if (!Number.isFinite(agreedRent) || agreedRent <= 0) {
            throw new Error("agreedRent must be a number greater than 0");
          }

          found.tenant.agreedRent = agreedRent;
          await found.tenant.save({ session });

          const monthThreshold = isValidMonthKey(row.month) ? row.month : getMonthKey();
          await Payment.updateMany(
            { tenantId: found.tenant._id, month: { $gte: monthThreshold } },
            { $set: { amount: agreedRent } },
            { session }
          );

          await session.commitTransaction();
          results.push({ index, action, ok: true, message: "Rent updated", tenantId: found.tenant._id });
          continue;
        }

        if (action === "ADD_DEPOSIT") {
          if (!row.flatNumber || row.amount == null || row.amount === "") {
            throw new Error("flatNumber and amount are required");
          }

          const found = await findActiveTenantByFlatNumber(row.flatNumber, session);
          if (!found.tenant) {
            throw new Error("Active tenant not found for flat");
          }

          const numericAmount = Number(row.amount);
          if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            throw new Error("amount must be a number greater than 0");
          }

          const depositDate = row.date ? parseDateInput(row.date) : new Date();
          if (row.date && !depositDate) {
            throw new Error("Invalid date. Use YYYY-MM-DD");
          }

          const depositPayment = await DepositPayment.create([
            {
              tenantId: found.tenant._id,
              amount: numericAmount,
              date: depositDate,
              note: row.note || ""
            }
          ], { session });

          found.tenant.agreedDeposit = Number(found.tenant.agreedDeposit || 0) + numericAmount;
          await found.tenant.save({ session });

          await session.commitTransaction();
          results.push({ index, action, ok: true, message: "Deposit added", depositId: depositPayment[0]._id });
          continue;
        }

        if (action === "DELETE_DEPOSIT") {
          if (!row.flatNumber || !row.depositId) {
            throw new Error("flatNumber and depositId are required");
          }

          if (!mongoose.Types.ObjectId.isValid(row.depositId)) {
            throw new Error("depositId is invalid");
          }

          const found = await findActiveTenantByFlatNumber(row.flatNumber, session);
          if (!found.tenant) {
            throw new Error("Active tenant not found for flat");
          }

          const depositPayment = await DepositPayment.findOne({
            _id: row.depositId,
            tenantId: found.tenant._id
          }).session(session);

          if (!depositPayment) {
            throw new Error("Deposit payment not found for tenant");
          }

          found.tenant.agreedDeposit = Math.max(
            0,
            Number(found.tenant.agreedDeposit || 0) - Number(depositPayment.amount || 0)
          );
          await found.tenant.save({ session });
          await DepositPayment.deleteOne({ _id: depositPayment._id }).session(session);

          await session.commitTransaction();
          results.push({ index, action, ok: true, message: "Deposit deleted", depositId: depositPayment._id });
          continue;
        }

        throw new Error(`Unsupported action: ${action}`);
      } catch (error) {
        await session.abortTransaction();
        results.push({
          index,
          action: String(row.action || ""),
          ok: false,
          message: error.message || "Action failed"
        });
      } finally {
        session.endSession();
      }
    }

    const succeeded = results.filter((item) => item.ok).length;
    const failed = results.length - succeeded;
    res.json({
      summary: {
        total: results.length,
        succeeded,
        failed
      },
      results
    });
  } catch (error) {
    console.error("Sheet sync error:", error);
    res.status(500).json({ message: "Unable to process sheet actions" });
  }
});

module.exports = router;
