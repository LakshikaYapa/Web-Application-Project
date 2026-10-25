import { useCallback, useEffect, useState } from "react";
import { LanguageContext } from "./context";
import sinhala from "./si.json";

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("floodguard-language") === "si" ? "si" : "en";
    } catch { return "en"; }
  });
  const t = useCallback((text) => language === "si" ? (sinhala[text] ?? text) : text, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem("floodguard-language", language); }
    catch { /* Switching works even when persistent storage is unavailable. */ }
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}
