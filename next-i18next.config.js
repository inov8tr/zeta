/** @type {import('next').NextConfig['i18n']} */
const i18n = {
    locales: ['en', 'ko'],      // Supported locales
    defaultLocale: 'en',        // Default locale
    localeDetection: true,      // Enable locale detection based on system/browser settings
  };
  
  module.exports = {
    i18n,
  };
  