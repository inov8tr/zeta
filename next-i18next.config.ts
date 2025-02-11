import type { UserConfig } from "next-i18next";

const i18nConfig: UserConfig = {
  i18n: {
    locales: ["en", "ko"],
    defaultLocale: "en",
    localeDetection: false,
  },
};

export default i18nConfig;
