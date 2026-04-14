import { createContext, useContext, useEffect, useMemo, useState } from "react";

const RentContext = createContext(null);

const apiBase = import.meta.env.VITE_API_URL || "/api";
const AUTH_TOKEN_KEY = "authToken";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const apiFetch = async (path, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  const isGet = method === "GET";
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      cache: isGet ? "no-store" : options.cache,
      headers: {
        ...(isGet ? { "Cache-Control": "no-cache" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem("isLoggedIn");
      window.dispatchEvent(new Event("auth:logout"));
      return response;
    }

    const contentType = response.headers.get("content-type") || "";
    const isHtmlError = contentType.includes("text/html") && response.status >= 500;
    if (isHtmlError && attempt < maxAttempts) {
      await delay(500 * attempt);
      continue;
    }

    return response;
  }

  return fetch(`${apiBase}${path}`, {
    ...options,
    cache: isGet ? "no-store" : options.cache,
    headers: {
      ...(isGet ? { "Cache-Control": "no-cache" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    return "Server is temporarily unavailable (returned HTML error page). Please wait a few seconds and retry.";
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
      if (!response.ok) {
        const message = await getErrorMessage(response, "Unable to load dashboard data.");
        throw new Error(message);
      }
      const data = await response.json();
      setFlats(data.flats || []);
      setMonth(data.month || "");
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await apiFetch("/history");
      if (!response.ok) {
        const message = await getErrorMessage(response, "Unable to load history.");
        throw new Error(message);
      }
      const data = await response.json();
      setHistory(data.tenants || []);
    } catch (err) {
      setError(err.message || "Unable to load history.");
    }
  };

  const loadTenantHistory = async (tenantId) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/tenants/${tenantId}/history`);
      if (!response.ok) {
        const message = await getErrorMessage(response, "Unable to load tenant history.");
        throw new Error(message);
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
        const message = await getErrorMessage(response, "Unable to add deposit payment.");
        throw new Error(message);
      }
      await loadTenantHistory(tenantId);
    } catch (err) {
      setError(err.message || "Unable to add deposit payment.");
    } finally {
      setLoading(false);
    }
  };

  const updateTenantRent = async (tenantId, agreedRent) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/tenants/${tenantId}/rent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreedRent })
      });
      if (!response.ok) {
        const message = await getErrorMessage(response, "Unable to update tenant rent.");
        throw new Error(message);
      }

      // Optimistically reflect updated rent immediately in modal and flat cards.
      setTenantHistory((prev) => ({
        ...prev,
        tenant: prev.tenant && prev.tenant._id === tenantId
          ? { ...prev.tenant, agreedRent }
          : prev.tenant,
        payments: (prev.payments || []).map((payment) => {
          if (payment.month >= month) {
            return { ...payment, amount: agreedRent };
          }
          return payment;
        })
      }));

      setFlats((prev) =>
        (prev || []).map((flat) => {
          if (flat?.currentTenant?._id === tenantId) {
            return {
              ...flat,
              paymentAmount: agreedRent,
              currentTenant: {
                ...flat.currentTenant,
                agreedRent
              }
            };
          }
          return flat;
        })
      );

      // Refresh in background; keep optimistic values if transient API outage occurs.
      loadTenantHistory(tenantId).catch(() => {});
      loadDashboard().catch(() => {});
    } catch (err) {
      setError(err.message || "Unable to update tenant rent.");
      throw err;
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
        const message = await getErrorMessage(response, "Move-in failed.");
        throw new Error(message);
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
        const message = await getErrorMessage(response, "Vacate failed.");
        throw new Error(message);
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
        const message = await getErrorMessage(response, "Payment update failed.");
        throw new Error(message);
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
        const message = await getErrorMessage(response, "Unable to load rent history.");
        throw new Error(message);
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

    // Auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      loadDashboard();
    }, 300000);

    return () => {
      clearInterval(intervalId);
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
      updateTenantRent,
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
