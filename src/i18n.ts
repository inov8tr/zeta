import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "ko"],
    ns: ["common", "home", "program"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    debug: process.env.NODE_ENV === "development",
    returnObjects: true, // ✅ Enables returning objects in translations
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
  });

export default i18n;
