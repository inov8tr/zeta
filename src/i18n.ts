import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

const isServer = typeof window === "undefined"; // ✅ Detects if running on server

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",
    supportedLngs: ["en", "ko"],
    ns: ["common", "home"], // ✅ Keep only relevant namespaces
    defaultNS: "common",
    interpolation: { escapeValue: false },
    backend: {
      loadPath: isServer
        ? "http://localhost:3000/locales/{{lng}}/{{ns}}.json"
        : `${window.location.origin}/locales/{{lng}}/{{ns}}.json`,
    },
    react: { 
      useSuspense: false 
    },
  });

export default i18n;
