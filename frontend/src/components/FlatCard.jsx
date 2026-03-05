import { CheckCircle2, DoorOpen, UserMinus2 } from "lucide-react";
import { useRent } from "../context/RentContext.jsx";

const statusStyles = {
  Paid: "border-paid bg-paid/10 text-paid",
  Pending: "border-pending bg-pending/10 text-pending"
};

const getDueDate = (leaseStart) => {
  if (!leaseStart) return null;
  const date = new Date(leaseStart);
  return date.getDate();
};

const FlatCard = ({ flat, onAddTenant, onViewHistory }) => {
  const { formatCurrency, togglePayment, vacate, loading } = useRent();
  const tenant = flat.currentTenant;
  const dueDate = tenant ? getDueDate(tenant.leaseStart) : null;

  if (!tenant) {
    return (
      <article className="flex h-full flex-col justify-between rounded-3xl border border-white/50 bg-white/75 p-6 shadow-card backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Flat {flat.number}</p>
          <h3 className="mt-3 text-xl font-semibold">Vacant</h3>
          <p className="mt-2 text-sm text-muted">Ready for move-in.</p>
        </div>
        <button
          type="button"
          onClick={() => onAddTenant(flat)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          <DoorOpen size={16} />
          Add Tenant
        </button>
      </article>
    );
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onViewHistory?.(tenant)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onViewHistory?.(tenant);
        }
      }}
      className="group flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-white/50 bg-white/75 p-6 shadow-card backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(45,21,86,0.18)]"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Flat {flat.number}</p>
        <h3 className="mt-3 text-xl font-semibold">{tenant.name}</h3>
        <p className="mt-1 text-sm text-muted">Rent: {formatCurrency(flat.paymentAmount)}</p>
        {dueDate && (
          <p className="mt-1 text-sm text-muted">Due: <span className="font-semibold">Every {dueDate}th</span></p>
        )}
        <div
          className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
            statusStyles[flat.paymentStatus] || "border-muted text-muted"
          }`}
        >
          <CheckCircle2 size={14} />
          {flat.paymentStatus || "Pending"}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            const shouldToggle = window.confirm(
              `Change payment status for ${tenant.name} in Flat ${flat.number}?`
            );
            if (!shouldToggle) return;
            togglePayment(flat.paymentId);
          }}
          disabled={loading || !flat.paymentId}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            flat.paymentStatus === "Paid" ? "bg-paid/10 text-paid" : "bg-pending/10 text-pending"
          }`}
        >
          {flat.paymentStatus === "Paid" ? "Rent Paid" : "Rent Pending"}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            const shouldVacate = window.confirm(
              `Vacate ${tenant.name} from Flat ${flat.number}? This action cannot be undone.`
            );
            if (!shouldVacate) return;
            vacate(tenant._id);
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink"
        >
          <UserMinus2 size={16} />
          Vacate
        </button>
      </div>
    </article>
  );
};

export default FlatCard;
