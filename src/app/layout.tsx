import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ReactNode } from "react";
import { SITE_URL, absoluteUrl, defaultKeywords, getOrganizationStructuredData } from "@/lib/seo";
import "../styles/globals.css";

const siteDescription = "Zeta English Academy guides K-12 learners through joyful English experiences that build confidence, curiosity, and future-ready skills.";

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
        url: absoluteUrl("/images/pages/home/Strat.png"),
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
    images: [absoluteUrl("/images/pages/home/Strat.png")],
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
  },
};

const organizationStructuredData = getOrganizationStructuredData();

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
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
