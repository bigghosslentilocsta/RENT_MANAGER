import { createContext, useContext, useMemo, useState } from "react";

const TranslationContext = createContext(null);

const translations = {
  en: {
    flatNumber: "Flat Number",
    tenantName: "Tenant Name",
    rentPaid: "Rent Paid",
    pending: "Pending",
    vacant: "Vacant",
    history: "History",
    backup: "Backup",
    notifyViaWhatsApp: "Notify via WhatsApp"
  },
  te: {
    flatNumber: "ఫ్లాట్ నంబర్",
    tenantName: "అద్దెదారు పేరు",
    rentPaid: "అద్దె చెల్లించబడింది",
    pending: "పెండింగ్",
    vacant: "ఖాళీ",
    history: "చరిత్ర",
    backup: "బ్యాకప్",
    notifyViaWhatsApp: "వాట్సాప్ ద్వారా తెలియజేయండి"
  }
};

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "te" : "en"));
  };

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  const value = useMemo(
    () => ({ language, toggleLanguage, t, translations }),
    [language]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
};
