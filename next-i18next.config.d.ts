declare module "../next-i18next.config.mjs" {
    const config: {
      i18n: {
        locales: string[];
        defaultLocale: string;
        localeDetection: boolean;
      };
    };
    export default config;
  }
  