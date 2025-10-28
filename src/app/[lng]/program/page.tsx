import Link from "next/link";
import { BookOpen, Mic, PenSquare, PencilLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ProgramSectionCard from "@/components/pages/program/ProgramSectionCard";
import ProgramHeroSlider from "@/components/pages/program/ProgramHeroSlider";
import BookAppointmentCTA from "@/components/pages/home/BookAppointmentCTA";
import StructuredData from "@/components/seo/StructuredData";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import { absoluteUrl, buildLocalizedMetadata } from "@/lib/seo";

type PageParams = { lng?: string };

export const revalidate = 3600;

const ProgramPage = async ({ params }: { params: Promise<PageParams> }) => {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { program, home, common } = getDictionaries(lng);

  const heroImageAlt = program.hero?.backgroundAlt ?? "Zeta English Academy program highlights";
  const heroImages = ["/images/pages/home/SA.webp", "/images/pages/home/SS.webp", "/images/pages/home/SSA.webp"].map(
    (src, index) => ({
      src,
      alt: `${heroImageAlt} slide ${index + 1}`,
    })
  );

  const sections = [
    {
      id: "lab",
      title: program.lab.title,
      summary: program.lab.description,
      highlights: Object.values(program.lab.activities ?? {}).map(
        (activity: { title: string; description: string }) => `${activity.title}: ${activity.description}`
      ),
      imageSrc: "/images/pages/home/Strat.webp",
      imageAlt: program.lab.activities?.reading?.title ?? program.lab.title,
      readMoreLabel: program.lab.readMore,
      seeLessLabel: program.lab.seeLess,
      contentSections: program.lab.contentSections ?? [],
    },
    {
      id: "discussion",
      title: program.discussion.title,
      summary: program.discussion.description,
      highlights: Object.entries(program.discussion.benefits ?? {})
        .filter(([key]) => key !== "title")
        .map(([, benefit]) => benefit as string),
      imageSrc: "/images/BookR.webp",
      imageAlt: program.discussion.title,
      readMoreLabel: program.discussion.readMore,
      seeLessLabel: program.discussion.seeLess,
      contentSections: program.discussion.contentSections ?? [],
    },
    {
      id: "grammar",
      title: program.grammar.title,
      summary: program.grammar.description,
      highlights: Object.entries(program.grammar.keyFeatures ?? {})
        .filter(([key]) => key !== "title")
        .map(([, feature]) => feature as string),
      imageSrc: "/images/pages/program/class.jpg",
      imageAlt: program.grammar.title,
      readMoreLabel: program.grammar.readMore,
      seeLessLabel: program.grammar.seeLess,
      contentSections: program.grammar.contentSections ?? [],
    },
    {
      id: "writing",
      title: program.writing.title,
      summary: program.writing.description,
      highlights: Object.values(program.writing.activities ?? {}).map(
        (activity: { title: string; description: string }) => `${activity.title}: ${activity.description}`
      ),
      imageSrc: "/images/pages/program/Korean Beginning Writing Class.webp",
      imageAlt: program.writing.title,
      sliderImages: [
        "/images/pages/program/Korean Beginning Writing Class.webp",
        "/images/pages/program/Intermediate Writing Class.webp",
        "/images/pages/program/Advanced Speech.webp",
      ].map((src, index) => ({
        src,
        alt: `${program.writing.title} visual ${index + 1}`,
      })),
      sliderIntervalMs: 6000,
      readMoreLabel: program.writing.readMore,
      seeLessLabel: program.writing.seeLess,
      contentSections: program.writing.contentSections ?? [],
    },
  ];

  const quickNavItems = [
    { id: "lab", label: program.quickNav?.lab ?? program.lab.title },
    { id: "discussion", label: program.quickNav?.discussion ?? program.discussion.title },
    { id: "grammar", label: program.quickNav?.grammar ?? program.grammar.title },
    { id: "writing", label: program.quickNav?.writing ?? program.writing.title },
  ];

  const iconMap: Record<string, LucideIcon> = {
    lab: BookOpen,
    discussion: Mic,
    grammar: PencilLine,
    writing: PenSquare,
  };

  const overviewCards = sections.map((section) => ({
    id: section.id,
    title: section.title,
    summary: section.summary,
    icon: iconMap[section.id] ?? BookOpen,
  }));

  const toneSequence = ["primary", "accent", "neutral"] as const;

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
        name: program.hero?.title ?? "Our Program",
        item: absoluteUrl(`/${lng}/program`),
      },
    ],
  };

  return (
    <main className="bg-neutral-50 pb-0">
      <StructuredData data={breadcrumbsStructuredData} />
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-primary-light text-white">
        <div className="absolute inset-0">
          <div className="absolute left-10 top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" aria-hidden />
          <div className="absolute inset-y-0 right-1/3 hidden w-px bg-white/10 lg:block" aria-hidden />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
              {program.hero?.backgroundAlt ?? "Program Overview"}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              {program.hero?.title ?? "Master English with Zeta"}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/90">
              {program.hero?.description ?? "A comprehensive program combining LAB, Grammar, and Discussion."}
            </p>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              {program.hero?.supporting ??
                "Zeta English Academy weaves three core experiences—Reading Lab, Discussion Class, and Grammar Class—with writing and debate electives so students can think, speak, and write in English with confidence."}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                asChild
                className="bg-white text-brand-primary shadow-lg shadow-white/30 hover:bg-white/90"
              >
                <Link href={`/${lng}/contact`}>
                  {program.hero?.buttons?.primary ?? "Book a Consultation"}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/60 text-white hover:bg-white/10"
              >
                <Link href={`/${lng}/program-overview`}>
                  {program.hero?.buttons?.secondary ?? "View Summary Page"}
                </Link>
              </Button>
            </div>

            <ul className="mt-12 grid gap-4 text-left sm:grid-cols-2">
              {overviewCards.map((card) => {
                const Icon = card.icon;
                return (
                  <li
                    key={`hero-card-${card.id}`}
                    className="group flex items-start gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur-sm transition hover:bg-white/15"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                        {card.title}
                      </p>
                      <p className="mt-2 text-sm text-white/70">{card.summary}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <ProgramHeroSlider
            images={heroImages}
            className="bg-white/10 shadow-2xl shadow-brand-primary/30"
            heightClass="h-80"
          />
        </div>
      </section>

      <nav className="relative -mt-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-brand-primary/5 backdrop-blur">
            {program.strategic?.heading && (
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary">
                {program.strategic.heading}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {quickNavItems.map((item) => (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  className="inline-flex items-center rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <section className="mx-auto mt-24 flex max-w-6xl flex-col gap-14 px-4">
        {sections.map((section, index) => (
          <ProgramSectionCard
            key={section.id}
            {...section}
            tone={toneSequence[index % toneSequence.length]}
            isReversed={index % 2 === 1}
          />
        ))}
      </section>

      <div className="mt-24">
        <BookAppointmentCTA lng={lng} dictionary={home.callToAction} />
      </div>
    </main>
  );
};

export default ProgramPage;

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { program } = getDictionaries(lng);
  const title = program?.metadata?.title ?? program?.hero?.title ?? "Our Program";
  const description =
    program?.metadata?.description ??
    program?.hero?.description ??
    "Explore LAB, Grammar, and Discussion classes at Zeta.";
  const keywords = [
    program?.lab?.title,
    program?.discussion?.title,
    program?.grammar?.title,
    program?.writing?.title,
  ].filter((keyword): keyword is string => Boolean(keyword));

  return buildLocalizedMetadata({
    lng,
    path: "/program",
    title,
    description,
    keywords,
    image: "/images/pages/program/SystemBG.webp",
    imageAlt: program?.hero?.backgroundAlt ?? "Zeta English Academy program overview",
    useTitleTemplate: program?.metadata?.title ? false : undefined,
  });
}
