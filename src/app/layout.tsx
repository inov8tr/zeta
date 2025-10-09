import Script from "next/script";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ReactNode } from "react";
import { SITE_URL, absoluteUrl, defaultKeywords, getOrganizationStructuredData } from "@/lib/seo";
import "../styles/globals.css";

const siteDescription = "Zeta English Academy guides K-12 learners through joyful English experiences that build confidence, curiosity, and future-ready skills.";
const naverSiteVerification = process.env.NAVER_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Zeta English Academy",
    template: "%s | Zeta English Academy",
  },
  description: siteDescription,
  keywords: defaultKeywords,
  icons: {
    icon: "/images/ZetaLogo.svg",
  },
  openGraph: {
    title: "Zeta English Academy",
    description: siteDescription,
    url: SITE_URL,
    siteName: "Zeta English Academy",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: absoluteUrl("/images/pages/home/Strat.webp"),
        width: 1200,
        height: 630,
        alt: "Students learning with Zeta English Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zeta English Academy",
    description: siteDescription,
    images: [absoluteUrl("/images/pages/home/Strat.webp")],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: absoluteUrl("/en"),
      ko: absoluteUrl("/ko"),
      "x-default": absoluteUrl("/en"),
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "lYIgsNGnEpFny_l7OzLgaQMgnpkfqjrKMNx1z_DGBRM",
    other: naverSiteVerification
      ? {
          "naver-site-verification": naverSiteVerification,
        }
      : undefined,
  },
};

const organizationStructuredData = getOrganizationStructuredData();

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="THtFfxDCbg4Ttp8pyLU84A"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-neutral-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
