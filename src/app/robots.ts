import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ✅ Default: allow all
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/*", "/_next/*", "/static/*"],
      },

      // ✅ Googlebot-specific rules
      {
        userAgent: "Googlebot",
        disallow: ["*?lightbox=", "/server/*"],
      },

      // ✅ Google Ads bots (avoid wasting crawl budget)
      {
        userAgent: ["AdsBot-Google-Mobile", "AdsBot-Google"],
        disallow: ["/_api/*", "/_partials*", "/pro-gallery-webapp/v1/galleries/*"],
      },

      // ✅ AhrefsBot — delay crawling
      {
        userAgent: "AhrefsBot",
        crawlDelay: 10,
      },

      // ✅ NaverBot (Yeti)
      {
        userAgent: "Yeti",
        allow: "/",
        crawlDelay: 2,
      },

      // ✅ Block aggressive / unwanted crawlers
      {
        userAgent: "PetalBot",
        disallow: "/",
      },
    ],

    // ✅ Use canonical .com sitemap and host
    sitemap: [`${SITE_URL}/sitemap.xml`],
    host: SITE_URL,
  };
}
