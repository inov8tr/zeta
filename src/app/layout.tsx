import Script from "next/script";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ReactNode } from "react";
import { SITE_URL, absoluteUrl, defaultKeywords, getOrganizationStructuredData } from "@/lib/seo";
import "../styles/globals.css";

const siteDescription = "Zeta English Academy guides K-12 learners through joyful English experiences that build confidence, curiosity, and future-ready skills.";
const naverSiteVerification = process.env.NAVER_SITE_VERIFICATION;
const naverMetaVerification = process.env.NAVER_VERIFICATION_ALT;
const googleTagManagerId = process.env.NEXT_PUBLIC_GTM_ID;

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
        {naverMetaVerification ? (
          <meta name="naver-site-verification" content={naverMetaVerification} />
        ) : null}
        {googleTagManagerId ? (
          <Script id="gtm-base" strategy="beforeInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${googleTagManagerId}');
            `}
          </Script>
        ) : null}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="THtFfxDCbg4Ttp8pyLU84A"
          strategy="beforeInteractive"
        />
        <Script id="matomo-tracker" strategy="afterInteractive">
          {`
            var _paq = window._paq = window._paq || [];
            _paq.push(["setDocumentTitle", document.domain + "/" + document.title]);
            (function() {
              var prodDomain = "zeta-eng.co.kr";
              var host = window.location.hostname || "localhost";
              if (host === prodDomain || host.endsWith("." + prodDomain)) {
                _paq.push(["setCookieDomain", ".zeta-eng.co.kr"]);
                _paq.push(["setDomains", ["*.zeta-eng.co.kr", "zeta-eng.co.kr"]]);
              } else {
                _paq.push(["disableCookies"]);
                _paq.push(["setDomains", [host]]);
              }
            })();
            _paq.push(["setDoNotTrack", true]);
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="https://zetaeng.matomo.cloud/";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '1']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.async=true; g.src='https://cdn.matomo.cloud/zetaeng.matomo.cloud/matomo.js'; s.parentNode.insertBefore(g,s);
            })();
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col bg-white text-neutral-950">
        {googleTagManagerId ? (
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            }}
          />
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        {children}
        <Analytics />
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              '<p><img referrerpolicy="no-referrer-when-downgrade" src="https://zetaeng.matomo.cloud/matomo.php?idsite=1&rec=1" style="border:0;" alt="" /></p>',
          }}
        />
      </body>
    </html>
  );
};

export default RootLayout;
