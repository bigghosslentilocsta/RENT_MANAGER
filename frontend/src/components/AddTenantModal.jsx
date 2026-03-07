import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useRent } from "../context/RentContext.jsx";

const AddTenantModal = ({ open, flats, onClose }) => {
  const { moveIn, loading, error } = useRent();
  const vacantFlats = useMemo(() => flats.filter((flat) => !flat.currentTenant), [flats]);
  const [form, setForm] = useState({
    flatNumber: "",
    name: "",
    phone: "",
    agreedRent: "",
    agreedDeposit: "",
    leaseStart: "",
    leaseEnd: ""
  });

  useEffect(() => {
    if (open) {
      setForm({
        flatNumber: vacantFlats[0]?.number || "",
        name: "",
        phone: "",
        agreedRent: "",
        agreedDeposit: "",
        leaseStart: "",
        leaseEnd: ""
      });
    }
  }, [open, vacantFlats]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!vacantFlats.length) {
      return;
    }
    try {
      await moveIn({
        ...form,
        flatNumber: String(form.flatNumber),
        agreedRent: Number(form.agreedRent),
        agreedDeposit: Number(form.agreedDeposit)
      });
      onClose(); // Only close if successful
    } catch (error) {
      alert(`Failed to add tenant: ${error.message}`);
      // Modal stays open so user can correct the data
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/40 p-3 sm:p-6">
      <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/60 bg-white/90 p-4 sm:p-6 shadow-card backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">Add Tenant</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-ink/5">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 grid gap-3 sm:gap-4">
          <label className="text-xs sm:text-sm font-semibold text-muted">
            Flat
            <select
              name="flatNumber"
              value={form.flatNumber}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl sm:rounded-2xl border border-ink/10 px-3 sm:px-4 py-2 text-sm"
              required
            >
              {vacantFlats.map((flat) => (
                <option key={flat.number} value={flat.number}>
                  {flat.number}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs sm:text-sm font-semibold text-muted">
            Full Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl sm:rounded-2xl border border-ink/10 px-3 sm:px-4 py-2 text-sm"
              required
            />
          </label>
          <label className="text-xs sm:text-sm font-semibold text-muted">
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl sm:rounded-2xl border border-ink/10 px-3 sm:px-4 py-2 text-sm"
              required
            />
          </label>
          <label className="text-xs sm:text-sm font-semibold text-muted">
            Agreed Rent
            <input
              type="number"
              name="agreedRent"
              value={form.agreedRent}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl sm:rounded-2xl border border-ink/10 px-3 sm:px-4 py-2 text-sm"
              required
            />
          </label>
          <label className="text-xs sm:text-sm font-semibold text-muted">
            Deposit Amount
            <input
              type="number"
              name="agreedDeposit"
              value={form.agreedDeposit}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl sm:rounded-2xl border border-ink/10 px-3 sm:px-4 py-2 text-sm"
            />
          </label>
          <label className="text-xs sm:text-sm font-semibold text-muted">
            Lease Start
            <input
              type="date"
              name="leaseStart"
              value={form.leaseStart}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl sm:rounded-2xl border border-ink/10 px-3 sm:px-4 py-2 text-sm"
              required
            />
          </label>
          <label className="text-xs sm:text-sm font-semibold text-muted">
            Lease End
            <input
              type="date"
              name="leaseEnd"
              value={form.leaseEnd}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl sm:rounded-2xl border border-ink/10 px-3 sm:px-4 py-2 text-sm"
            />
          </label>
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ink/10 px-4 py-2 text-xs sm:text-sm font-semibold w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-ink px-4 py-2 text-xs sm:text-sm font-semibold text-white w-full sm:w-auto"
            >
              Save Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTenantModal;
