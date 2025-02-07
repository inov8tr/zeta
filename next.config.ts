import type { NextConfig } from "next";
import i18nConfig from "./next-i18next.config";

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  // i18n configuration
  i18n: i18nConfig.i18n,

  // Enable React strict mode for better development warnings
  reactStrictMode: true,

  // Remove experimental features and unsupported options for Turbopack
  experimental: {},
};

export default nextConfig;
