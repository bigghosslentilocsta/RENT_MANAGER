import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useRent } from "../context/RentContext.jsx";

const TenantHistoryModal = ({ open, onClose }) => {
  const { tenantHistory, formatCurrency, addDepositPayment, loading } = useRent();
  const tenant = tenantHistory.tenant;
  const payments = tenantHistory.payments || [];
  const depositPayments = tenantHistory.depositPayments || [];
  const [depositForm, setDepositForm] = useState({ amount: "", date: "", note: "" });

  const depositSummary = useMemo(() => {
    const total = Number(tenant?.agreedDeposit) || 0;
    const paid = depositPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const balance = Math.max(0, total - paid);
    return { total, paid, balance };
  }, [tenant, depositPayments]);

  if (!open || !tenant) {
    return null;
  }

  const handleDepositChange = (event) => {
    const { name, value } = event.target;
    setDepositForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepositSubmit = async (event) => {
    event.preventDefault();
    if (!depositForm.amount) {
      return;
    }
    await addDepositPayment(tenant._id, {
      amount: Number(depositForm.amount),
      date: depositForm.date || undefined,
      note: depositForm.note
    });
    setDepositForm({ amount: "", date: "", note: "" });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-6">
      <div className="w-full max-w-2xl rounded-3xl bg-white/95 p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Tenant History</p>
            <h2 className="text-2xl font-semibold">{tenant.name}</h2>
            <p className="mt-1 text-sm text-muted">Phone: {tenant.phone}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Agreed Rent</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrency(tenant.agreedRent)}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Deposit</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrency(depositSummary.total)}</p>
            <p className="mt-1 text-xs text-muted">Paid {formatCurrency(depositSummary.paid)}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Lease Start</p>
            <p className="mt-2 text-lg font-semibold">
              {tenant.leaseStart ? new Date(tenant.leaseStart).toLocaleDateString('en-GB') : "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Lease End</p>
            <p className="mt-2 text-lg font-semibold">
              {tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString('en-GB') : "-"}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Deposit Balance</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(depositSummary.balance)}</p>
            </div>
            <form onSubmit={handleDepositSubmit} className="flex flex-wrap items-end gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Amount
                <input
                  type="number"
                  name="amount"
                  value={depositForm.amount}
                  onChange={handleDepositChange}
                  className="mt-2 w-28 rounded-full border border-ink/10 px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Date
                <input
                  type="date"
                  name="date"
                  value={depositForm.date}
                  onChange={handleDepositChange}
                  className="mt-2 w-36 rounded-full border border-ink/10 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Note
                <input
                  name="note"
                  value={depositForm.note}
                  onChange={handleDepositChange}
                  className="mt-2 w-40 rounded-full border border-ink/10 px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Add Deposit
              </button>
            </form>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-4 py-3">Deposit Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {depositPayments.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-6 text-center text-muted">
                    No deposit payments recorded yet.
                  </td>
                </tr>
              ) : (
                depositPayments.map((deposit) => (
                  <tr key={deposit._id} className="border-t border-ink/10">
                    <td className="px-4 py-3 font-semibold">
                      {deposit.date ? new Date(deposit.date).toLocaleDateString('en-GB') : "-"}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(deposit.amount)}</td>
                    <td className="px-4 py-3 text-muted">{deposit.note || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Paid On</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-muted">
                    No payment history recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="border-t border-ink/10">
                    <td className="px-4 py-3 font-semibold">{payment.month}</td>
                    <td className="px-4 py-3">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                          payment.status === "Paid"
                            ? "bg-paid/10 text-paid"
                            : "bg-pending/10 text-pending"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {payment.date ? new Date(payment.date).toLocaleDateString('en-GB') : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TenantHistoryModal;
