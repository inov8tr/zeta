import Link from "next/link";
import { ArrowRight } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import { absoluteUrl, buildLocalizedMetadata } from "@/lib/seo";
import {
  getDictionaries,
  normalizeLanguage,
  type SearchDictionary,
  type SupportedLanguage,
} from "@/lib/i18n";

type PageParams = { lng?: string };

type SearchPageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<{ q?: string }>;
};

const FALLBACK_POPULAR: Record<string, { label: string; href: string }[]> = {
  en: [
    { label: "Writing program", href: "/en/program#writing" },
    { label: "Grammar levels", href: "/en/program#grammar" },
    { label: "Contact", href: "/en/contact" },
    { label: "Blog", href: "/en/blog" }
  ],
  ko: [
    { label: "글쓰기 프로그램", href: "/ko/program#writing" },
    { label: "문법 수업", href: "/ko/program#grammar" },
    { label: "상담 예약", href: "/ko/enrollment" },
    { label: "블로그", href: "/ko/blog" }
  ]
};

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { search } = getDictionaries(lng);

  return buildLocalizedMetadata({
    lng,
    path: "/search",
    title: search.page?.title ?? "Search",
    description:
      search.page?.description ??
      "Search Zeta English Academy programs, blog posts, and enrollment resources.",
    keywords: ["search", "Zeta English Academy"],
  });
}

const SearchPage = async ({ params, searchParams }: SearchPageProps) => {
  const { lng: rawLng } = await params;
  const resolvedParams = (await searchParams) ?? {};
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { search, common } = getDictionaries(lng);
  const query = resolvedParams.q?.trim();
  const suggestionsFromDictionary = search.popular as SearchDictionary["popular"] | undefined;
  const suggestions = suggestionsFromDictionary ?? FALLBACK_POPULAR[lng] ?? FALLBACK_POPULAR.en;
  const index = (search.index as SearchDictionary["index"]) ?? [];
  const results = query ? index.filter((item) => matchesQuery(item, query)) : [];

  if (query) {
    await logSearchQuery(query, results.length, lng);
  }

  return (
    <main className="bg-white pb-24 pt-28">
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: common.menu?.home ?? "Home",
              item: absoluteUrl(`/${lng}`)
            },
            {
              "@type": "ListItem",
              position: 2,
              name: search.page?.title ?? "Search",
              item: absoluteUrl(`/${lng}/search`)
            }
          ]
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Zeta English Academy",
          url: absoluteUrl(""),
          potentialAction: {
            "@type": "SearchAction",
            target: `${absoluteUrl(`/${lng}/search`)}?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        }}
      />

      <section className="mx-auto max-w-3xl px-4">
        <h1 className="text-4xl font-extrabold text-neutral-900">{search.page?.title}</h1>
        <p className="mt-4 text-lg text-neutral-700">{search.page?.description}</p>

        <form className="mt-10 flex flex-col gap-3 sm:flex-row" method="get">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={search.page?.placeholder ?? "Search Zeta"}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-base shadow-sm focus:border-brand-primary focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-white shadow-sm transition hover:bg-brand-primary-dark"
          >
            {search.page?.cta ?? "Search"}
          </button>
        </form>

        {!query && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">
              {search.page?.popular ?? "Popular searches"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <Link
                  key={suggestion.href}
                  href={suggestion.href}
                  className="group flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
                >
                  {suggestion.label}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {query && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">
              {search.page?.results ?? "Search results"}
            </h2>
            {results.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-600">
                {search.page?.noResults ??
                  "No matches yet. Try a different keyword or explore the popular searches below."}
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {results.map((result) => (
                  <Link
                    key={`${result.href}-${result.title}`}
                    href={result.href}
                    className="group block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary/60 hover:shadow-md"
                  >
                    <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-brand-primary">
                      {result.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600">{result.description}</p>
                    <span className="mt-3 inline-flex items-center text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary group-hover:text-brand-primary-dark">
                      {result.href}
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
};

export default SearchPage;

type SearchIndexItem = SearchDictionary["index"][number];

function matchesQuery(item: SearchIndexItem, query: string) {
  const normalized = query.toLowerCase();
  const haystack = [item.title, item.description, ...(item.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
}

async function logSearchQuery(query: string, results: number, lng: SupportedLanguage) {
  try {
    await fetch(absoluteUrl("/api/search-log"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ query, results, lng, timestamp: new Date().toISOString() }),
    });
  } catch (error) {
    console.error("Search log failed", error);
  }
}
