import type { Metadata } from "next";
import AboutHeroSection from "@/components/pages/about/AboutHeroSection";
import MissionBlock from "@/components/pages/about/MissionBlock";
import PhilosophyBlock from "@/components/pages/about/PhilosophyBlock";
import LevelsGrid from "@/components/pages/about/LevelsGrid";
import WritingProgramInfo from "@/components/pages/about/WritingProgramInfo";
import GlobalPerspectiveSection from "@/components/pages/about/GlobalPerspectiveSection";
import WhatMakesUsDifferent from "@/components/pages/about/WhatMakesUsDifferent";
import AboutTestimonialsSection from "@/components/pages/about/AboutTestimonialsSection";
import CallToActionBanner from "@/components/pages/about/CallToActionBanner";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";

interface PageParams {
  lng?: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { about } = getDictionaries(lng);

  return {
    title: about.metadata?.title,
    description: about.metadata?.description,
  } satisfies Metadata;
}

export default async function AboutPage({ params }: PageProps) {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { about } = getDictionaries(lng);

  return (
    <main className="space-y-0">
      <AboutHeroSection dictionary={about.hero} />
      <MissionBlock dictionary={about.mission} />
      <PhilosophyBlock dictionary={about.philosophy} />
      <LevelsGrid dictionary={about.levels} />
      <WritingProgramInfo dictionary={about.writingProgram} />
      <GlobalPerspectiveSection dictionary={about.globalPerspective} />
      <WhatMakesUsDifferent dictionary={about.differentiators} />
      <AboutTestimonialsSection dictionary={about.testimonial} />
      <CallToActionBanner lng={lng} dictionary={about.cta} />
    </main>
  );
}
