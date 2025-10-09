import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { AboutDictionary } from "@/lib/i18n";

interface AboutHeroSectionProps {
  dictionary: AboutDictionary["hero"];
  cta?: {
    primary?: string;
    href?: string;
    secondary?: string;
    secondaryHref?: string;
  };
  highlights?: string[];
}

const AboutHeroSection: React.FC<AboutHeroSectionProps> = ({ dictionary, cta, highlights }) => {
  const { title, tagline, description } = dictionary;
  const highlightItems = (highlights ?? []).filter(Boolean);
  const hasPrimaryCta = Boolean(cta?.primary && cta?.href);
  const hasSecondaryCta = Boolean(cta?.secondary && cta?.secondaryHref);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-primary-light text-white">
      <div className="absolute inset-0">
        <div className="absolute left-8 top-12 hidden h-56 w-56 rounded-full bg-brand-accent/30 blur-3xl md:block" aria-hidden />
        <div className="absolute bottom-0 right-[-4rem] h-64 w-64 rounded-full bg-white/15 blur-3xl" aria-hidden />
        <div className="absolute inset-y-0 right-1/3 hidden w-px bg-white/10 lg:block" aria-hidden />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 lg:py-32">
        <span className="inline-flex items-center justify-center rounded-full bg-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
          {tagline}
        </span>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/80">
            {description}
          </p>
        ) : null}

        {(hasPrimaryCta || hasSecondaryCta) && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {hasPrimaryCta && (
              <Button asChild className="bg-brand-accent text-gray-900 shadow-lg shadow-brand-accent/40">
                <Link href={cta!.href!}>{cta!.primary}</Link>
              </Button>
            )}
            {hasSecondaryCta && (
              <Button
                asChild
                variant="outline"
                className="border-white/60 text-white hover:bg-white/10"
              >
                <Link href={cta!.secondaryHref!}>{cta!.secondary}</Link>
              </Button>
            )}
          </div>
        )}

        {highlightItems.length > 0 && (
          <div className="mt-12 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
            {highlightItems.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="group flex flex-col gap-4 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-white/15"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-relaxed text-white/80">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutHeroSection;
