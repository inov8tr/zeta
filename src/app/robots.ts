import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        disallow: "*?lightbox=",
      },
      {
        userAgent: ["AdsBot-Google-Mobile", "AdsBot-Google"],
        disallow: ["/_api/*", "/_partials*", "/pro-gallery-webapp/v1/galleries/*"],
      },
      {
        userAgent: "PetalBot",
        disallow: "/",
      },
      {
        userAgent: "AhrefsBot",
        crawlDelay: 10,
      },
      {
        userAgent: "Yeti",
        allow: "/",
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`],
    host: SITE_URL,
  };
}
