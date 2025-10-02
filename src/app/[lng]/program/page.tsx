import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import ProgramSectionCard from "@/components/pages/program/ProgramSectionCard";
import BookAppointmentCTA from "@/components/pages/home/BookAppointmentCTA";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo";

type PageParams = { lng?: string };

const ProgramPage = async ({ params }: { params: Promise<PageParams> }) => {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { program, home } = getDictionaries(lng);

  const sections = [
    {
      id: "lab",
      title: program.lab.title,
      summary: program.lab.description,
      highlights: Object.values(program.lab.activities ?? {}).map(
        (activity: { title: string; description: string }) => `${activity.title}: ${activity.description}`
      ),
      imageSrc: "/images/pages/home/Strat.png",
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
      imageSrc: "/images/BookR.png",
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
      imageSrc: "/images/pages/home/Levels.svg",
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
      imageSrc: "/images/BookR.png",
      imageAlt: program.writing.title,
      readMoreLabel: program.writing.readMore,
      seeLessLabel: program.writing.seeLess,
      contentSections: program.writing.contentSections ?? [],
    },
  ];

  return (
    <main className="bg-white pb-24 pt-28">
      <section className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary/10 via-white to-brand-primary/5 px-6 py-16 shadow-xl">
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-brand-primary/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -right-12 h-56 w-56 rounded-full bg-brand-accent/20 blur-3xl" aria-hidden />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-brand-primary">
              {program.hero?.backgroundAlt ?? "Program Overview"}
            </p>
            <h1 className="mt-4 text-4xl font-extrabold text-neutral-900 md:text-5xl">
              {program.hero?.title ?? "Master English with Zeta"}
            </h1>
            <p className="mt-6 text-lg text-neutral-700">
              {program.hero?.description ?? "A comprehensive program combining LAB, Grammar, and Discussion."}
            </p>
            <p className="mt-4 text-base text-neutral-600">
              Zeta English Academy weaves three core experiences—Reading Lab, Discussion Class, and Grammar Class—
              with writing and debate electives so students can think, speak, and write in English with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button>
                <Link href={`/${lng}/contact`}>Book a Consultation</Link>
              </Button>
              <Button variant="outline">
                <Link href={`/${lng}/program-overview`}>View Summary Page</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto h-72 w-full max-w-sm overflow-hidden rounded-3xl bg-white/80 shadow-lg backdrop-blur">
            <Image
              src="/images/pages/home/SA.svg"
              alt="Zeta English Academy"
              fill
              className="object-contain p-8"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto mt-20 flex max-w-6xl flex-col gap-12 px-4">
        {sections.map((section) => (
          <ProgramSectionCard key={section.id} {...section} />
        ))}
      </div>

      <div className="mx-auto mt-24 max-w-6xl px-4">
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
  const description = program?.hero?.description ?? "Explore LAB, Grammar, and Discussion classes at Zeta.";
  const keywords = [
    program?.lab?.title,
    program?.discussion?.title,
    program?.grammar?.title,
    program?.writing?.title,
  ].filter((keyword): keyword is string => Boolean(keyword));

  return buildLocalizedMetadata({
    lng,
    path: "/program",
    title: program?.hero?.title ?? "Our Program",
    description,
    keywords,
    image: "/images/pages/program/SystemBG.png",
    imageAlt: program?.hero?.backgroundAlt ?? "Zeta English Academy program overview",
  });
}
