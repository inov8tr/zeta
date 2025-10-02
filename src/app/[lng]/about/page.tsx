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
import { buildLocalizedMetadata } from "@/lib/seo";

type PageParams = { lng?: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { about } = getDictionaries(lng);

  const keywords = Array.isArray(about.differentiators?.items)
    ? about.differentiators.items
    : undefined;

  return buildLocalizedMetadata({
    lng,
    path: "/about",
    title: about.metadata?.title ?? "About Zeta English Academy",
    description:
      about.metadata?.description ??
      "Learn about Zeta English Academy's mission, levels, and educational philosophy.",
    keywords,
    image: "/images/pages/home/SSA.svg",
    imageAlt: about.hero?.title ?? "About Zeta English Academy",
    useTitleTemplate: about.metadata?.title ? false : undefined,
  });
}

const AboutPage = async ({ params }: { params: Promise<PageParams> }) => {
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
};

export default AboutPage;
