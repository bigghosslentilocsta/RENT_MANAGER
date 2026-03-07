import { createContext, useContext, useEffect, useMemo, useState } from "react";

const RentContext = createContext(null);

const apiBase = import.meta.env.VITE_API_URL || "/api";

const apiFetch = (path, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  const isGet = method === "GET";

  return fetch(`${apiBase}${path}`, {
    ...options,
    cache: isGet ? "no-store" : options.cache,
    headers: {
      ...(isGet ? { "Cache-Control": "no-cache" } : {}),
      ...(options.headers || {})
    }
  });
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    value || 0
  );
};

const getErrorMessage = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    return payload?.message || fallbackMessage;
  }

  const text = await response.text().catch(() => "");
  if (text.includes("<!DOCTYPE") || text.includes("<html")) {
    return "API returned HTML instead of JSON. Ensure backend is running and frontend proxy/API URL points to /api.";
  }

  return fallbackMessage;
};

export const RentProvider = ({ children }) => {
  const [flats, setFlats] = useState([]);
  const [month, setMonth] = useState("");
  const [history, setHistory] = useState([]);
  const [rentHistory, setRentHistory] = useState([]);
  const [tenantHistory, setTenantHistory] = useState({
    tenant: null,
    payments: [],
    depositPayments: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/dashboard");
      const data = await response.json();
      setFlats(data.flats || []);
      setMonth(data.month || "");
    } catch (err) {
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await apiFetch("/history");
      const data = await response.json();
      setHistory(data.tenants || []);
    } catch (err) {
      setError("Unable to load history.");
    }
  };

  const loadTenantHistory = async (tenantId) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/tenants/${tenantId}/history`);
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.message || "Unable to load tenant history.");
      }
      const data = await response.json();
      setTenantHistory({
        tenant: data.tenant,
        payments: data.payments || [],
        depositPayments: data.depositPayments || []
      });
    } catch (err) {
      setError(err.message || "Unable to load tenant history.");
    } finally {
      setLoading(false);
    }
  };

  const clearTenantHistory = () => {
    setTenantHistory({ tenant: null, payments: [], depositPayments: [] });
  };

  const addDepositPayment = async (tenantId, payload) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/tenants/${tenantId}/deposits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.message || "Unable to add deposit payment.");
      }
      await loadTenantHistory(tenantId);
    } catch (err) {
      setError(err.message || "Unable to add deposit payment.");
    } finally {
      setLoading(false);
    }
  };

  const moveIn = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/move-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.message || "Move-in failed.");
      }
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Move-in failed.");
      throw err; // Re-throw so modal can catch and stay open
    } finally {
      setLoading(false);
    }
  };

  const vacate = async (tenantId) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/vacate/${tenantId}`, { method: "POST" });
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.message || "Vacate failed.");
      }
      await loadDashboard();
      await loadHistory();
    } catch (err) {
      setError(err.message || "Vacate failed.");
    } finally {
      setLoading(false);
    }
  };

  const togglePayment = async (paymentId) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/payments/${paymentId}`, {
        method: "PATCH"
      });
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.message || "Payment update failed.");
      }
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Payment update failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadRentHistory = async (monthKey) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/rent-history?month=${monthKey}`);
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.message || "Unable to load rent history.");
      }
      const data = await response.json();
      setRentHistory(data.records || []);
    } catch (err) {
      setError(err.message || "Unable to load rent history.");
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentDate = async (paymentId, paidDate, monthKey) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/payments/${paymentId}/date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidDate })
      });
      if (!response.ok) {
        const message = await getErrorMessage(response, "Unable to update paid date.");
        throw new Error(message);
      }
      await loadRentHistory(monthKey);
    } catch (err) {
      setError(err.message || "Unable to update paid date.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    // Auto-refresh every 30 seconds to sync data across devices
    const intervalId = setInterval(() => {
      loadDashboard();
    }, 30000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboard();
      }
    };

    const handleFocus = () => {
      loadDashboard();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const value = useMemo(
    () => ({
      flats,
      month,
      history,
      rentHistory,
      tenantHistory,
      loading,
      error,
      formatCurrency,
      loadDashboard,
      loadHistory,
      loadRentHistory,
      updatePaymentDate,
      loadTenantHistory,
      clearTenantHistory,
      addDepositPayment,
      moveIn,
      vacate,
      togglePayment
    }),
    [flats, month, history, rentHistory, tenantHistory, loading, error]
  );

  return <RentContext.Provider value={value}>{children}</RentContext.Provider>;
};

export const useRent = () => {
  const context = useContext(RentContext);
  if (!context) {
    throw new Error("useRent must be used within RentProvider");
  }
  return context;
};
