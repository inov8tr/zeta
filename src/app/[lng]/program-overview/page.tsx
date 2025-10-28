import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import StructuredData from "@/components/seo/StructuredData";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import { absoluteUrl, buildLocalizedMetadata } from "@/lib/seo";

type PageParams = { lng?: string };

export const revalidate = 3600;

const ProgramOverviewPage = async ({ params }: { params: Promise<PageParams> }) => {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { programOverview, common } = getDictionaries(lng);

  type SectionContent = {
    heading?: string;
    paragraphs?: string[];
    listTitle?: string;
    list?: string[];
    closing?: string;
  };

  type ProgramOverviewSection = {
    id: string;
    title: string;
    summary: string;
    detailsTitle?: string;
    details?: string[];
    ctaLabel?: string;
    ctaHref?: string;
    image?: string;
    imageAlt?: string;
    contentSections?: SectionContent[];
  };

  const sections: ProgramOverviewSection[] = [
    { id: "lab", ...programOverview.sections.lab },
    { id: "grammar", ...programOverview.sections.grammar },
    { id: "discussion", ...programOverview.sections.discussion },
  ];

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
        name: programOverview.hero.title ?? "Program Overview",
        item: absoluteUrl(`/${lng}/program-overview`),
      },
    ],
  };

  return (
    <main className="bg-white pb-24 pt-28">
      <StructuredData data={breadcrumbsStructuredData} />
      <section className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary/10 via-white to-brand-primary/5 px-4 py-16 shadow-xl">
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-brand-primary/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -right-10 h-56 w-56 rounded-full bg-brand-accent/20 blur-3xl" aria-hidden />

        <div className="relative z-10 flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl text-center lg:text-left">
            {programOverview.hero.eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-brand-primary">
                {programOverview.hero.eyebrow}
              </p>
            )}
          <h1 className="mt-4 text-4xl font-extrabold text-neutral-900 md:text-5xl">
            {programOverview.hero.title}
          </h1>
          <p className="mt-6 text-lg text-neutral-700">
            {programOverview.hero.description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild>
              <Link href={`/${lng}/program`}>Explore Full Program</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${lng}/contact`}>Talk with Us</Link>
            </Button>
          </div>
          </div>

          <div className="relative w-full max-w-md">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white/70 shadow-lg backdrop-blur">
              <Image
                src="/images/BookR.webp"
                alt={programOverview.hero.imageAlt}
                fill
                priority
                className="object-contain p-6"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-24 flex max-w-6xl flex-col gap-16 px-4">
        {sections.map((section, index) => {
          const isReversed = index % 2 === 1;
          const sectionBackground = isReversed
            ? "bg-brand-primary/5 ring-1 ring-brand-primary/10"
            : "bg-white ring-1 ring-neutral-200";
          const contentSections = Array.isArray(section.contentSections)
            ? section.contentSections
            : [];

          return (
            <section
              key={section.id}
              className={`grid items-center gap-12 rounded-3xl px-8 py-12 shadow-md transition-shadow hover:shadow-lg lg:grid-cols-2 ${sectionBackground}`}
            >
              <div className={isReversed ? "lg:order-2" : ""}>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-primary">
                  {section.title}
                </p>
                <p className="mt-4 text-xl text-neutral-700">{section.summary}</p>
                {section.detailsTitle && (
                  <p className="mt-6 text-base font-semibold text-neutral-900">
                    {section.detailsTitle}
                  </p>
                )}
                {Array.isArray(section.details) && section.details.length > 0 && (
                  <ul className="mt-4 space-y-3 text-neutral-700">
                    {section.details.map((item: string) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.ctaHref && section.ctaLabel && (
                  <div className="mt-8">
                    <Button asChild>
                      <Link href={`/${lng}${section.ctaHref}`}>{section.ctaLabel}</Link>
                    </Button>
                  </div>
                )}

                {contentSections.map((content, contentIndex) => (
                  <div
                    key={`${section.id}-content-${contentIndex}`}
                    className="mt-10 rounded-2xl bg-white/70 p-6 backdrop-blur"
                  >
                    {content.heading && (
                      <h3 className="text-xl font-semibold text-neutral-900">
                        {content.heading}
                      </h3>
                    )}
                    {content.paragraphs &&
                      content.paragraphs.map((paragraph: string, idx: number) => (
                        <p key={`paragraph-${idx}`} className="mt-4 text-sm text-neutral-700">
                          {paragraph}
                        </p>
                      ))}
                    {content.listTitle && (
                      <p className="mt-6 text-sm font-semibold text-neutral-900">
                        {content.listTitle}
                      </p>
                    )}
                    {content.list && (
                      <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                        {content.list.map((item: string, idx: number) => (
                          <li key={`list-${idx}`} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {content.closing && (
                      <p className="mt-4 text-sm text-neutral-700">{content.closing}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className={`relative w-full ${isReversed ? "lg:order-1" : ""}`}>
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-neutral-100 shadow-lg">
                  {section.image ? (
                    <Image
                      src={section.image}
                      alt={section.imageAlt ?? `${section.title} illustration`}
                      fill
                      className="object-contain p-6"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                      Image coming soon
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
};

export default ProgramOverviewPage;

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { programOverview } = getDictionaries(lng);
  const title = programOverview?.metadata?.title ?? programOverview?.hero?.title ?? "Program Overview";
  const description =
    programOverview?.metadata?.description ??
    programOverview?.hero?.description ??
    "Preview Zeta English Academy's LAB, Grammar, and Discussion classes.";
  const keywords = [
    programOverview?.sections?.lab?.title,
    programOverview?.sections?.grammar?.title,
    programOverview?.sections?.discussion?.title,
  ].filter((keyword): keyword is string => Boolean(keyword));

  return buildLocalizedMetadata({
    lng,
    path: "/program-overview",
    title,
    description,
    keywords,
    image: "/images/BookR.webp",
    imageAlt: programOverview?.hero?.imageAlt ?? "Program overview illustration",
    useTitleTemplate: programOverview?.metadata?.title ? false : undefined,
  });
}
