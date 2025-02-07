import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

// Initialize i18n
console.log("Initializing i18n...");

i18n
  .use(HttpApi) // Load translation files via HTTP
  .use(LanguageDetector) // Detect user's language from browser settings
  .use(initReactI18next) // Initialize react-i18next
  .init({
    // Languages configuration
    fallbackLng: "en",
    supportedLngs: ["en", "ko"],
    debug: true,

    // Namespace settings
    ns: ["common"],
    defaultNS: "common",

    // Backend settings for loading translation files
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json", // Path to your translation files
    },

    // React integration settings
    react: {
      useSuspense: false, // Disable suspense for translations
    },

    // String interpolation settings
    interpolation: {
      escapeValue: false, // Prevent double-escaping in React
    },

    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator"], // Order of language detection
      caches: ["cookie", "localStorage"], // Cache detected language in cookies or local storage
    },
  })
  .then(() => console.log("i18n initialized successfully"))
  .catch((error) => console.error("i18n initialization failed:", error));

// **Debug Event Listeners** to track i18n lifecycle events
i18n.on("initialized", () => {
  console.log("i18next initialized. Current language:", i18n.language);
});

i18n.on("loaded", (loaded) => {
  console.log("Translation resources loaded successfully:", loaded);
});

i18n.on("failedLoading", (lng, ns, msg) => {
  console.error(`Failed to load resources for ${lng}/${ns}:`, msg);
});

i18n.on("languageChanged", (lng) => {
  console.log("Language changed to:", lng);
});

export default i18n;
