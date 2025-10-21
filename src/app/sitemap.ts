import type { MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"];
type Priority = MetadataRoute.Sitemap[number]["priority"];

interface RouteConfig {
  path: string;
  changeFrequency: ChangeFreq;
  priority: Priority;
}

const STATIC_ROUTES: RouteConfig[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/program", changeFrequency: "monthly", priority: 0.9 },
  { path: "/program-overview", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/enrollment", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/search", changeFrequency: "weekly", priority: 0.5 },
];

// (External blog URLs removed from sitemap to keep only site URLs)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const localizedRoutes: MetadataRoute.Sitemap = SUPPORTED_LANGUAGES.flatMap((lang) =>
    STATIC_ROUTES.map(({ path, changeFrequency, priority }) => {
      const localizedPath = path ? `/${lang}${path}` : `/${lang}`;
      return {
        url: absoluteUrl(localizedPath),
        lastModified,
        changeFrequency,
        priority,
      };
    })
  );

  // Only include locale-specific homepages and internal routes.
  return [...localizedRoutes];
}
