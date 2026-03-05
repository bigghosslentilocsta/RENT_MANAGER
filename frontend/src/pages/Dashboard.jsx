import { useState } from "react";
import { useRent } from "../context/RentContext.jsx";
import FlatCard from "../components/FlatCard.jsx";
import AddTenantModal from "../components/AddTenantModal.jsx";
import TenantHistoryModal from "../components/TenantHistoryModal.jsx";

const Dashboard = () => {
  const { flats, month, loading, error, loadTenantHistory, clearTenantHistory } = useRent();
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const openModal = () => {
    setModalOpen(true);
  };
  const openHistory = async (tenant) => {
    if (!tenant?._id) {
      return;
    }
    await loadTenantHistory(tenant._id);
    setHistoryOpen(true);
  };
  const closeHistory = () => {
    setHistoryOpen(false);
    clearTenantHistory();
  };

  return (
    <section>
      <div className="flex flex-col items-start gap-3 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Current Month</h2>
          <p className="text-sm text-muted">{month ? `Status for ${month}` : ""}</p>
        </div>
        {error ? <p className="text-sm text-pending">{error}</p> : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {flats.map((flat) => (
          <FlatCard key={flat._id} flat={flat} onAddTenant={openModal} onViewHistory={openHistory} />
        ))}
      </div>
      {loading && flats.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Loading flats...</p>
      ) : null}
      <AddTenantModal open={modalOpen} flats={flats} onClose={() => setModalOpen(false)} />
      <TenantHistoryModal open={historyOpen} onClose={closeHistory} />
    </section>
  );
};

export default Dashboard;
