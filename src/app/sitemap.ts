import type { MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import Parser from "rss-parser";

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

// ✅ FIX 1: Use full valid RSS feed URL
const BLOG_RSS_URL = "https://rss.blog.naver.com/zeta-eng.xml"; // Correct format for Naver RSS

export async function GET(): Promise<Response> {
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

  const rootEntry: MetadataRoute.Sitemap[number] = {
    url: SITE_URL,
    lastModified,
    changeFrequency: "weekly",
    priority: 1,
  };

  const parser = new Parser();
  let blogEntries: MetadataRoute.Sitemap = [];

  try {
    const feed = await parser.parseURL(BLOG_RSS_URL);
    blogEntries = feed.items
      .filter((item): item is Required<typeof item> => !!item.link)
      .map((item) => ({
        url: item.link!,
        lastModified: item.pubDate ? new Date(item.pubDate) : lastModified,
        changeFrequency: "monthly" as ChangeFreq,
        priority: 0.5,
      }));
  } catch (error) {
    console.error("Failed to parse blog RSS feed:", error);
  }

  // ✅ FIX 2: Wrap result in JSON response for Next.js App Router
  return Response.json([rootEntry, ...localizedRoutes, ...blogEntries]);
}
