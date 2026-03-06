import { useEffect, useState } from "react";
import { useRent } from "../context/RentContext.jsx";
import { useTranslation } from "../context/TranslationContext.jsx";

const RentHistory = () => {
  const { rentHistory, loadRentHistory, updatePaymentDate, formatCurrency, error, loading } = useRent();
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [editingPaymentId, setEditingPaymentId] = useState("");
  const [editingPaidDate, setEditingPaidDate] = useState("");

  const getDateInputValue = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const beginEditPaidDate = (record) => {
    setEditingPaymentId(record._id);
    setEditingPaidDate(getDateInputValue(record.paidDate));
  };

  const cancelEditPaidDate = () => {
    setEditingPaymentId("");
    setEditingPaidDate("");
  };

  const savePaidDate = async (paymentId) => {
    if (!editingPaidDate || !selectedMonth || !selectedYear) {
      return;
    }

    const monthKey = `${selectedYear}-${selectedMonth}`;
    await updatePaymentDate(paymentId, editingPaidDate, monthKey);
    cancelEditPaidDate();
  };

  // Initialize with current month/year
  useEffect(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    setSelectedMonth(month);
    setSelectedYear(year);
  }, []);

  // Load rent history when month/year changes, with auto-refresh
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      const monthKey = `${selectedYear}-${selectedMonth}`;
      loadRentHistory(monthKey);

      // Auto-refresh every 15 seconds to sync data across devices
      const intervalId = setInterval(() => {
        loadRentHistory(monthKey);
      }, 15000);

      // Refresh when tab/app becomes visible again
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          loadRentHistory(monthKey);
        }
      };

      // Refresh when window gains focus
      const handleFocus = () => {
        loadRentHistory(monthKey);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);

      // Cleanup listeners
      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [selectedMonth, selectedYear]);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i);
  }

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  const calculateTotalRent = () => rentHistory.reduce((sum, record) => sum + record.amount, 0);
  const calculateTotalPaid = () =>
    rentHistory.filter((r) => r.status === "Paid").reduce((sum, r) => sum + r.amount, 0);
  const calculateTotalPending = () =>
    rentHistory.filter((r) => r.status === "Pending").reduce((sum, r) => sum + r.amount, 0);

  return (
    <section>
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Rent History</h2>
          <p className="text-xs sm:text-sm text-muted">View and track rent payments by month.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="month" className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Month
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs sm:text-sm font-medium"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="year" className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Year
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs sm:text-sm font-medium"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-pending">{error}</p> : null}

      {/* Summary Cards */}
      <div className="mb-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-2xl sm:rounded-3xl border border-white/60 bg-white/80 p-4 sm:p-6 shadow-card backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Total Due</p>
          <p className="mt-2 text-xl sm:text-2xl font-semibold">{formatCurrency(calculateTotalRent())}</p>
        </div>
        <div className="rounded-2xl sm:rounded-3xl border border-white/60 bg-white/80 p-4 sm:p-6 shadow-card backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-paid">Paid</p>
          <p className="mt-2 text-xl sm:text-2xl font-semibold text-paid">{formatCurrency(calculateTotalPaid())}</p>
        </div>
        <div className="rounded-2xl sm:rounded-3xl border border-white/60 bg-white/80 p-4 sm:p-6 shadow-card backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-pending">Pending</p>
          <p className="mt-2 text-xl sm:text-2xl font-semibold text-pending">
            {formatCurrency(calculateTotalPending())}
          </p>
        </div>
      </div>

      {/* Rent Records Table - Desktop */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-card backdrop-blur-xl">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="px-5 py-3">{t("flatNumber")}</th>
              <th className="px-5 py-3">{t("tenantName")}</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Paid Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-5 py-6 text-center text-muted">
                  Loading...
                </td>
              </tr>
            ) : rentHistory.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-6 text-center text-muted">
                  No rent records for this month.
                </td>
              </tr>
            ) : (
              rentHistory.map((record) => (
                <tr key={record._id} className="border-t border-ink/10">
                  <td className="px-5 py-3 font-semibold">{t("flatNumber")}: {record.flatNumber}</td>
                  <td className="px-5 py-3">{record.tenantName}</td>
                  <td className="px-5 py-3 text-muted">{record.tenantPhone}</td>
                  <td className="px-5 py-3 font-semibold">{formatCurrency(record.amount)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                        record.status === "Paid"
                          ? "border border-paid bg-paid/10 text-paid"
                          : "border border-pending bg-pending/10 text-pending"
                      }`}
                    >
                      {record.status === "Paid" ? t("rentPaid") : t("pending")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {record.status === "Paid" ? (
                      editingPaymentId === record._id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="date"
                            value={editingPaidDate}
                            onChange={(event) => setEditingPaidDate(event.target.value)}
                            className="rounded-lg border border-ink/20 bg-white px-2 py-1 text-xs font-medium text-ink"
                          />
                          <button
                            type="button"
                            onClick={() => savePaidDate(record._id)}
                            disabled={loading || !editingPaidDate}
                            className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditPaidDate}
                            disabled={loading}
                            className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{record.paidDate ? new Date(record.paidDate).toLocaleDateString("en-GB") : "-"}</span>
                          <button
                            type="button"
                            onClick={() => beginEditPaidDate(record)}
                            disabled={loading}
                            className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink"
                          >
                            Change
                          </button>
                        </div>
                      )
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rent Records - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-card">
            <p className="text-sm text-muted">Loading...</p>
          </div>
        ) : rentHistory.length === 0 ? (
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-card">
            <p className="text-sm text-muted">No rent records for this month.</p>
          </div>
        ) : (
          rentHistory.map((record) => (
            <div key={record._id} className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{t("flatNumber")}: {record.flatNumber}</p>
                  <p className="mt-1 text-base font-semibold">{record.tenantName}</p>
                  <p className="mt-0.5 text-xs text-muted">{record.tenantPhone}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                    record.status === "Paid"
                      ? "border border-paid bg-paid/10 text-paid"
                      : "border border-pending bg-pending/10 text-pending"
                  }`}
                >
                  {record.status === "Paid" ? t("rentPaid") : t("pending")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink/10">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-muted">Amount</p>
                  <p className="mt-1 text-sm font-semibold">{formatCurrency(record.amount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-muted">Paid Date</p>
                  {record.status === "Paid" ? (
                    editingPaymentId === record._id ? (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <input
                          type="date"
                          value={editingPaidDate}
                          onChange={(event) => setEditingPaidDate(event.target.value)}
                          className="rounded-lg border border-ink/20 bg-white px-2 py-1 text-xs font-medium text-ink"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => savePaidDate(record._id)}
                            disabled={loading || !editingPaidDate}
                            className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditPaidDate}
                            disabled={loading}
                            className="rounded-full border border-ink/20 px-2.5 py-1 text-xs font-semibold text-ink"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-sm">{record.paidDate ? new Date(record.paidDate).toLocaleDateString("en-GB") : "-"}</p>
                        <button
                          type="button"
                          onClick={() => beginEditPaidDate(record)}
                          disabled={loading}
                          className="rounded-full border border-ink/20 px-2.5 py-1 text-xs font-semibold text-ink self-start"
                        >
                          Change
                        </button>
                      </div>
                    )
                  ) : (
                    <p className="mt-1 text-sm text-muted">-</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default RentHistory;
