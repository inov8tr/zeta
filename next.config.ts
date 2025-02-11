import type { NextConfig } from "next";
import i18nConfig from "./next-i18next.config";

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  i18n: {
    ...i18nConfig.i18n,
    localeDetection: false,  // Ensure localeDetection is properly disabled
  },
  reactStrictMode: true
};

export default nextConfig;
