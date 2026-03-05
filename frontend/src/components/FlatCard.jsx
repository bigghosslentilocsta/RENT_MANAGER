import { CheckCircle2, DoorOpen, UserMinus2 } from "lucide-react";
import { useRent } from "../context/RentContext.jsx";
import { useTranslation } from "../context/TranslationContext.jsx";

const statusStyles = {
  Paid: "border-paid bg-paid/10 text-paid",
  Pending: "border-pending bg-pending/10 text-pending"
};

const getDueDate = (leaseStart) => {
  if (!leaseStart) return null;
  const date = new Date(leaseStart);
  return date.getDate();
};

const normalizePhoneNumber = (rawPhone = "") => {
  const digitsOnly = String(rawPhone).replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
    return digitsOnly;
  }

  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }

  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
    return `91${digitsOnly.slice(1)}`;
  }

  return digitsOnly;
};

const FlatCard = ({ flat, onAddTenant, onViewHistory }) => {
  const { formatCurrency, togglePayment, vacate, loading } = useRent();
  const { t } = useTranslation();
  const tenant = flat.currentTenant;
  const dueDate = tenant ? getDueDate(tenant.leaseStart) : null;

  const sendWhatsAppReminder = (tenantData) => {
    const normalizedPhone = normalizePhoneNumber(tenantData?.phone);

    if (!normalizedPhone) {
      window.alert("Tenant phone number is missing or invalid.");
      return;
    }

    const amount = tenantData?.agreedRent ?? flat.paymentAmount ?? 0;
    const message = `Hi ${tenantData?.name}, this is a friendly reminder that the rent for Flat ${flat.number} is due. Agreed rent: ${formatCurrency(amount)}. Please ignore if already paid.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  if (!tenant) {
    return (
      <article className="flex h-full flex-col justify-between rounded-3xl border border-white/50 bg-white/75 p-6 shadow-card backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Flat {flat.number}</p>
          <h3 className="mt-3 text-xl font-semibold">{t("vacant")}</h3>
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
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            sendWhatsAppReminder(tenant);
          }}
          disabled={loading || !tenant?.phone || flat.paymentStatus === "Paid"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-green-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.03 0C5.4 0 .03 5.37.03 11.99c0 2.11.55 4.18 1.6 6L0 24l6.2-1.62a11.96 11.96 0 0 0 5.83 1.49h.01c6.62 0 11.99-5.37 11.99-11.99 0-3.2-1.25-6.2-3.51-8.4ZM12.04 21.85h-.01a9.96 9.96 0 0 1-5.08-1.39l-.36-.22-3.68.96.98-3.59-.24-.37a9.92 9.92 0 0 1-1.53-5.28c0-5.5 4.47-9.97 9.98-9.97 2.67 0 5.18 1.04 7.05 2.9a9.9 9.9 0 0 1 2.93 7.06c0 5.5-4.48 9.98-9.99 9.98Zm5.47-7.48c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.19.3-.76.97-.93 1.17-.17.2-.34.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.64-2.03-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.51.15-.17.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.53.08-.8.38-.27.3-1.04 1.01-1.04 2.46s1.06 2.85 1.2 3.05c.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.08-.13-.27-.2-.57-.35Z" />
          </svg>
          <span className="hidden sm:inline">{t("notifyViaWhatsApp")}</span>
          <span className="sm:hidden">Inform</span>
        </button>
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
          className={`rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold ${
            flat.paymentStatus === "Paid" ? "bg-paid/10 text-paid" : "bg-pending/10 text-pending"
          }`}
        >
          {flat.paymentStatus === "Paid" ? t("rentPaid") : t("pending")}
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
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-ink"
        >
          <UserMinus2 size={16} />
          Vacate
        </button>
      </div>
    </article>
  );
};

export default FlatCard;
