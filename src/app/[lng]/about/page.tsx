import AboutHeroSection from "@/components/pages/about/AboutHeroSection";
import MissionBlock from "@/components/pages/about/MissionBlock";
import PhilosophyBlock from "@/components/pages/about/PhilosophyBlock";
import LevelsGrid from "@/components/pages/about/LevelsGrid";
import WritingProgramInfo from "@/components/pages/about/WritingProgramInfo";
import GlobalPerspectiveSection from "@/components/pages/about/GlobalPerspectiveSection";
import WhatMakesUsDifferent from "@/components/pages/about/WhatMakesUsDifferent";
import AboutTestimonialsSection from "@/components/pages/about/AboutTestimonialsSection";
import CallToActionBanner from "@/components/pages/about/CallToActionBanner";
import StructuredData from "@/components/seo/StructuredData";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import { absoluteUrl, buildLocalizedMetadata } from "@/lib/seo";

type PageParams = { lng?: string };

export const revalidate = 3600;

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
  const { about, common, home } = getDictionaries(lng);

  const heroHighlights = Array.isArray(about.mission?.points)
    ? about.mission.points.slice(0, 3)
    : undefined;

  return (
    <main className="space-y-0">
      <StructuredData
        data={{
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
              name: about.metadata?.title ?? "About",
              item: absoluteUrl(`/${lng}/about`),
            },
          ],
        }}
      />
      <AboutHeroSection
        dictionary={about.hero}
        cta={
          about.cta
            ? {
                primary: about.cta.primary,
                href: about.cta.href,
              }
            : undefined
        }
        highlights={heroHighlights}
      />
      <MissionBlock dictionary={about.mission} />
      <PhilosophyBlock dictionary={about.philosophy} />
      <LevelsGrid dictionary={about.levels} />
      <WritingProgramInfo dictionary={about.writingProgram} />
      <GlobalPerspectiveSection dictionary={about.globalPerspective} />
      <WhatMakesUsDifferent dictionary={about.differentiators} />
      {home?.testimonialSection && (
        <AboutTestimonialsSection dictionary={home.testimonialSection} />
      )}
      <CallToActionBanner lng={lng} dictionary={about.cta} />
    </main>
  );
};

export default AboutPage;
