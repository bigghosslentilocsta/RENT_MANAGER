import { useState } from "react";
import { RentProvider, useRent } from "./context/RentContext.jsx";
import { useTranslation } from "./context/TranslationContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RentHistory from "./pages/RentHistory.jsx";
import TenantHistory from "./pages/TenantHistory.jsx";
import LoginPage from "./components/LoginPage.jsx";

const HeaderContent = ({ view, setView }) => {
  const { language, toggleLanguage, t } = useTranslation();

  return (
    <header className="px-6 py-6 md:px-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted">Rent Management</p>
          <h1 className="text-3xl font-semibold md:text-4xl">11-Flat Overview</h1>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
          <nav className="flex gap-3">
            <button
              type="button"
              onClick={() => setView("dashboard")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                view === "dashboard"
                  ? "bg-gradient-to-r from-accentPink via-accentOrange to-accentBlue text-white shadow-card"
                  : "bg-white/80 text-ink border border-white/60"
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setView("rentHistory")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                view === "rentHistory"
                  ? "bg-gradient-to-r from-accentBlue via-accentPink to-accentOrange text-white shadow-card"
                  : "bg-white/80 text-ink border border-white/60"
              }`}
            >
              Rent {t("history")}
            </button>
            <button
              type="button"
              onClick={() => setView("tenantHistory")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                view === "tenantHistory"
                  ? "bg-gradient-to-r from-accentOrange via-accentBlue to-accentPink text-white shadow-card"
                  : "bg-white/80 text-ink border border-white/60"
              }`}
            >
              Tenant {t("history")}
            </button>
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-full border border-white/60 bg-white/80 px-5 py-2 text-sm font-semibold text-ink"
            >
              Translate ({language === "en" ? "తెలుగు" : "English"})
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

const App = () => {
  const [view, setView] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("isLoggedIn") === "true");

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <RentProvider>
      <div className="min-h-screen">
        <HeaderContent view={view} setView={setView} />
        <main className="px-6 pb-16 md:px-12">
          {view === "dashboard" && <Dashboard />}
          {view === "rentHistory" && <RentHistory />}
          {view === "tenantHistory" && <TenantHistory />}
        </main>
      </div>
    </RentProvider>
  );
};

export default App;
