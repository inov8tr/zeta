import { BookOpen, Lightbulb, PenTool } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import NaverBlogFeed from "@/components/pages/blog/NaverBlogFeed";
import StructuredData from "@/components/seo/StructuredData";
import {
  getDictionaries,
  normalizeLanguage,
  type BlogDictionary,
  type SupportedLanguage,
} from "@/lib/i18n";
import { absoluteUrl, buildLocalizedMetadata } from "@/lib/seo";

type PageParams = { lng?: string };

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { blog } = getDictionaries(lng);

  return buildLocalizedMetadata({
    lng,
    path: "/blog",
    title: blog.hero?.title ?? "Blog",
    description:
      blog.hero?.description ?? "Updates and insights from Zeta English Academy.",
    keywords: ["blog", "updates", "English education"],
    image: "/images/pages/home/Strat.webp",
    imageAlt: blog.hero?.title ?? "Zeta English Academy blog",
  });
}

const iconMap: Record<string, LucideIcon> = {
  classroom: BookOpen,
  families: Lightbulb,
  writing: PenTool,
};

const defaultHighlightIcon = BookOpen;

const BlogPage = async ({ params }: { params: Promise<PageParams> }) => {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { blog, common } = getDictionaries(lng);
  const highlights = (blog.hero?.highlights ?? []) as BlogDictionary["hero"]["highlights"];

  const breadcrumbsStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: common.menu?.home ?? "Home",
        item: absoluteUrl(`/${lng}`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: blog.hero?.title ?? "Blog & Insights",
        item: absoluteUrl(`/${lng}/blog`),
      },
    ],
  };

  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: blog.hero?.title ?? "Blog & Insights",
    url: absoluteUrl(`/${lng}/blog`),
    description:
      blog.hero?.description ??
      "Stay up to date with stories from our classrooms, reflections from Zeta coaches, and practical tips to help your child thrive in English.",
  };

  return (
    <main className="bg-neutral-50 pb-24">
      <StructuredData data={breadcrumbsStructuredData} />
      <StructuredData data={blogStructuredData} />
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-primary-light text-white">
        <div className="absolute inset-0">
          <div className="absolute left-20 top-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" aria-hidden />
          <div className="absolute -bottom-28 right-6 h-80 w-80 rounded-full bg-brand-accent/30 blur-3xl" aria-hidden />
          <div className="absolute inset-y-0 right-1/2 hidden w-px bg-white/10 lg:block" aria-hidden />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-white/15 px-5 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
              {blog.hero?.eyebrow ?? "Zeta English Academy"}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
              {blog.hero?.title ?? "Blog & Insights"}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/80">
              {blog.hero?.description ??
                "Stay up to date with stories from our classrooms, reflections from Zeta coaches, and practical tips to help your child thrive in English."}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {highlights.map(({ title, description, href, key }) => {
              const Icon = key ? iconMap[key] ?? defaultHighlightIcon : defaultHighlightIcon;
              return (
              <a
                key={title ?? href}
                href={href ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
                {description && (
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{description}</p>
                )}
                <span className="mt-6 inline-flex items-center text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition group-hover:text-white">
                  {blog.hero?.highlightCta ?? blog.feed?.cardCta ?? "Read story"}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 h-4 w-4"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </span>
              </a>
            );
            })}
          </div>
        </div>
      </section>

      <section className="-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-4xl border border-white/40 bg-white/90 p-8 shadow-2xl shadow-brand-primary/10 backdrop-blur-sm sm:p-10 lg:p-14">
            <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl" aria-hidden />
            <div className="absolute -bottom-24 right-12 h-56 w-56 rounded-full bg-brand-accent/10 blur-3xl" aria-hidden />

            <header className="relative z-10 flex flex-col gap-3 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary-dark">
                  {blog.feed?.eyebrow ?? "Latest from the community"}
                </p>
                <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">
                  {blog.feed?.title ?? "Recent Articles & Updates"}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">
                  {blog.feed?.description ??
                    "Explore the newest posts pulled straight from our Naver blog. Tap any card to read the full story in a new tab."}
                </p>
              </div>
            </header>

            <div className="relative z-10 mt-10">
              <NaverBlogFeed dictionary={blog.feed} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default BlogPage;
