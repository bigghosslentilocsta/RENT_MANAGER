import { useEffect } from "react";
import { useRent } from "../context/RentContext.jsx";
import { useTranslation } from "../context/TranslationContext.jsx";

const TenantHistory = () => {
  const { history, loadHistory, formatCurrency, error } = useRent();
  const { t } = useTranslation();

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <section>
      <div className="flex flex-col items-start gap-3 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Past Tenants</h2>
          <p className="text-sm text-muted">Stay duration based on lease start and vacating date.</p>
        </div>
        {error ? <p className="text-sm text-pending">{error}</p> : null}
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-card backdrop-blur-xl">
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
    </section>
  );
};

export default TenantHistory;
