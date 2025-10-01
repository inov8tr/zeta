import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { HomeDictionary, SupportedLanguage } from "@/lib/i18n";

interface HeroProps {
  lng: SupportedLanguage;
  dictionary: HomeDictionary["hero"];
}

const PRIMARY_CTA_PATH = "/enrollment";
const SECONDARY_CTA_PATH = "/program";

const HeroSection = ({ lng, dictionary }: HeroProps) => {
  const { headline, tagline, description, primaryCta, secondaryCta, imageAlt } = dictionary;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary-light via-brand-primary to-brand-primary-dark text-white">
      <div className="absolute inset-0">
        <div className="absolute left-8 top-12 hidden h-56 w-56 rounded-full bg-brand-accent/30 blur-3xl md:block" aria-hidden="true" />
        <div className="absolute bottom-0 right-[-3rem] h-60 w-60 rounded-full bg-white/15 blur-2xl" aria-hidden="true" />
        <div className="absolute inset-y-0 right-1/3 hidden w-px bg-white/10 lg:block" aria-hidden="true" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-14 px-4 py-24 text-center sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-20 lg:py-32">
        <div className="w-full max-w-2xl">
          <span className="inline-flex items-center justify-center rounded-full bg-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
            {tagline}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
            {headline}
          </h1>
          {description && (
            <p className="mt-6 text-lg leading-relaxed text-white/80">
              {description}
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="bg-brand-accent text-gray-900 shadow-lg shadow-brand-accent/40">
              <Link href={`/${lng}${PRIMARY_CTA_PATH}`}>{primaryCta}</Link>
            </Button>
            {secondaryCta && (
              <Button
                asChild
                variant="outline"
                className="border-white/60 text-white hover:bg-white/10"
              >
                <Link href={`/${lng}${SECONDARY_CTA_PATH}`}>{secondaryCta}</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="absolute -top-12 left-10 hidden h-24 w-24 rounded-full border border-white/25 md:block" aria-hidden="true" />
          <div className="absolute -bottom-14 right-8 hidden h-28 w-28 rounded-full border border-brand-accent/40 md:block" aria-hidden="true" />

          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-brand-accent/20" aria-hidden="true" />
            <div className="relative aspect-square w-full">
              <Image
                src="/images/BookR.png"
                alt={imageAlt}
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
