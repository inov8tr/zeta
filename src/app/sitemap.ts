import type { MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

type RouteConfig = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: MetadataRoute.Sitemap[number]["priority"];
};

const STATIC_ROUTES: RouteConfig[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/program", changeFrequency: "monthly", priority: 0.9 },
  { path: "/program-overview", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/enrollment", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const localizedRoutes = SUPPORTED_LANGUAGES.flatMap((lng) =>
    STATIC_ROUTES.map((route) => {
      const localizedPath = route.path ? `/${lng}${route.path}` : `/${lng}`;
      return {
        url: absoluteUrl(localizedPath),
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      } satisfies MetadataRoute.Sitemap[number];
    })
  );

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...localizedRoutes,
  ];
}
