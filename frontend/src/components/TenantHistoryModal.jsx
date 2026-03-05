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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-3 sm:p-6">
      <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white/95 p-4 sm:p-6 shadow-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted">Tenant History</p>
            <h2 className="text-xl sm:text-2xl font-semibold">{tenant.name}</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">Phone: {tenant.phone}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-ink/5">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 sm:mt-5 grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl sm:rounded-2xl border border-ink/10 bg-white p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted">Agreed Rent</p>
            <p className="mt-1 sm:mt-2 text-base sm:text-lg font-semibold">{formatCurrency(tenant.agreedRent)}</p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-ink/10 bg-white p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted">Deposit</p>
            <p className="mt-1 sm:mt-2 text-base sm:text-lg font-semibold">{formatCurrency(depositSummary.total)}</p>
            <p className="mt-1 text-xs text-muted">Paid {formatCurrency(depositSummary.paid)}</p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-ink/10 bg-white p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted">Lease Start</p>
            <p className="mt-1 sm:mt-2 text-base sm:text-lg font-semibold">
              {tenant.leaseStart ? new Date(tenant.leaseStart).toLocaleDateString('en-GB') : "-"}
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-ink/10 bg-white p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted">Lease End</p>
            <p className="mt-1 sm:mt-2 text-base sm:text-lg font-semibold">
              {tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString('en-GB') : "-"}
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-5 rounded-xl sm:rounded-2xl border border-ink/10 bg-white p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted">Deposit Balance</p>
              <p className="mt-1 text-base sm:text-lg font-semibold">{formatCurrency(depositSummary.balance)}</p>
            </div>
            <form onSubmit={handleDepositSubmit} className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-2 sm:gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted flex-1 min-w-[120px]">
                Amount
                <input
                  type="number"
                  name="amount"
                  value={depositForm.amount}
                  onChange={handleDepositChange}
                  className="mt-2 w-full rounded-full border border-ink/10 px-3 py-2 text-xs sm:text-sm"
                  required
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted flex-1 min-w-[120px]">
                Date
                <input
                  type="date"
                  name="date"
                  value={depositForm.date}
                  onChange={handleDepositChange}
                  className="mt-2 w-full rounded-full border border-ink/10 px-3 py-2 text-xs sm:text-sm"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted flex-1 min-w-[120px]">
                Note
                <input
                  name="note"
                  value={depositForm.note}
                  onChange={handleDepositChange}
                  className="mt-2 w-full rounded-full border border-ink/10 px-3 py-2 text-xs sm:text-sm"
                  placeholder="Optional"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-ink px-4 py-2 text-xs sm:text-sm font-semibold text-white w-full sm:w-auto"
              >
                Add Deposit
              </button>
            </form>
          </div>
        </div>

        {/* Deposit Payments - Desktop Table */}
        <div className="mt-5 sm:mt-6 hidden sm:block overflow-hidden rounded-xl sm:rounded-2xl border border-ink/10">
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

        {/* Deposit Payments - Mobile Cards */}
        <div className="mt-5 sm:mt-6 sm:hidden space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted px-1">Deposit Payments</p>
          {depositPayments.length === 0 ? (
            <div className="rounded-xl border border-ink/10 bg-white p-4 text-center">
              <p className="text-sm text-muted">No deposit payments recorded yet.</p>
            </div>
          ) : (
            depositPayments.map((deposit) => (
              <div key={deposit._id} className="rounded-xl border border-ink/10 bg-white p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.1em] text-muted">Date</p>
                    <p className="mt-1 text-sm font-semibold">
                      {deposit.date ? new Date(deposit.date).toLocaleDateString('en-GB') : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.1em] text-muted">Amount</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(deposit.amount)}</p>
                  </div>
                  {deposit.note && (
                    <div className="col-span-2">
                      <p className="text-xs uppercase tracking-[0.1em] text-muted">Note</p>
                      <p className="mt-1 text-sm text-muted">{deposit.note}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rent Payments - Desktop Table */}
        <div className="mt-5 sm:mt-6 hidden sm:block overflow-hidden rounded-xl sm:rounded-2xl border border-ink/10">
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

        {/* Rent Payments - Mobile Cards */}
        <div className="mt-5 sm:mt-6 sm:hidden space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted px-1">Rent Payments</p>
          {payments.length === 0 ? (
            <div className="rounded-xl border border-ink/10 bg-white p-4 text-center">
              <p className="text-sm text-muted">No payment history recorded yet.</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment._id} className="rounded-xl border border-ink/10 bg-white p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{payment.month}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatCurrency(payment.amount)}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                      payment.status === "Paid"
                        ? "bg-paid/10 text-paid"
                        : "bg-pending/10 text-pending"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
                <div className="pt-2 border-t border-ink/10">
                  <p className="text-xs uppercase tracking-[0.1em] text-muted">Paid On</p>
                  <p className="mt-1 text-sm">
                    {payment.date ? new Date(payment.date).toLocaleDateString('en-GB') : "-"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantHistoryModal;
