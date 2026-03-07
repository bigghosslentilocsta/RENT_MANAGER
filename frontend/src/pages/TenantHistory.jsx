import { useEffect } from "react";
import { useRent } from "../context/RentContext.jsx";
import { useTranslation } from "../context/TranslationContext.jsx";

const TenantHistory = () => {
  const { history, loadHistory, formatCurrency, error } = useRent();
  const { t } = useTranslation();

  useEffect(() => {
    loadHistory();

    // Auto-refresh every 30 seconds to sync data across devices
    const intervalId = setInterval(() => {
      loadHistory();
    }, 30000);

    // Refresh when tab/app becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadHistory();
      }
    };

    // Refresh when window gains focus
    const handleFocus = () => {
      loadHistory();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup listeners
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <section>
      <div className="flex flex-col items-start gap-3 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Past Tenants</h2>
          <p className="text-xs sm:text-sm text-muted">Stay duration based on lease start and vacating date.</p>
        </div>
        {error ? <p className="text-xs sm:text-sm text-pending">{error}</p> : null}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-card backdrop-blur-xl">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="px-5 py-3">{t("tenantName")}</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Agreed Rent</th>
              <th className="px-5 py-3">Lease Start</th>
              <th className="px-5 py-3">Vacated</th>
              <th className="px-5 py-3">Days Stayed</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-6 text-center text-muted">
                  No past tenants yet.
                </td>
              </tr>
            ) : (
              history.map((tenant) => (
                <tr key={tenant._id} className="border-t border-ink/10">
                  <td className="px-5 py-3 font-semibold">{tenant.name}</td>
                  <td className="px-5 py-3 text-muted">{tenant.phone}</td>
                  <td className="px-5 py-3">{formatCurrency(tenant.agreedRent)}</td>
                  <td className="px-5 py-3">{new Date(tenant.leaseStart).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3">
                    {tenant.vacatingDate ? new Date(tenant.vacatingDate).toLocaleDateString('en-GB') : "-"}
                  </td>
                  <td className="px-5 py-3">{tenant.stayDurationDays ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-card">
            <p className="text-sm text-muted">No past tenants yet.</p>
          </div>
        ) : (
          history.map((tenant) => (
            <div key={tenant._id} className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card">
              <div className="mb-3">
                <p className="text-base font-semibold">{tenant.name}</p>
                <p className="mt-0.5 text-xs text-muted">{tenant.phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink/10">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-muted">Agreed Rent</p>
                  <p className="mt-1 text-sm font-semibold">{formatCurrency(tenant.agreedRent)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-muted">Days Stayed</p>
                  <p className="mt-1 text-sm font-semibold">{tenant.stayDurationDays ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-muted">Lease Start</p>
                  <p className="mt-1 text-xs">{new Date(tenant.leaseStart).toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-muted">Vacated</p>
                  <p className="mt-1 text-xs">
                    {tenant.vacatingDate ? new Date(tenant.vacatingDate).toLocaleDateString('en-GB') : "-"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default TenantHistory;
