import HeroSection from "@/components/pages/home/HeroSection";
import MissionSection from "@/components/pages/home/MissionSection";
import CoreApproachSection from "@/components/pages/home/CoreApproachSection";
import ProgramLevelsSection from "@/components/pages/home/ProgramLevelsSection";
import TestimonialSection from "@/components/pages/home/TestimonialSection";
import BookAppointmentCTA from "@/components/pages/home/BookAppointmentCTA";
import type { Metadata } from "next";
import type { SupportedLanguage } from "@/lib/i18n";
import { getDictionaries, normalizeLanguage } from "@/lib/i18n";

type PageParams = { lng?: string };

const HomePage = async ({ params }: { params: Promise<PageParams> }) => {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { home } = getDictionaries(lng);

  return (
    <main>
      <HeroSection lng={lng} dictionary={home.hero} />
      <MissionSection dictionary={home.mission} />
      <CoreApproachSection dictionary={home.coreApproach} />
      <ProgramLevelsSection lng={lng} dictionary={home.programLevels} />
      <TestimonialSection dictionary={home.testimonialSection} />
      <BookAppointmentCTA lng={lng} dictionary={home.callToAction} />
    </main>
  );
};

export default HomePage;

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { lng: rawLng } = await params;
  const lng: SupportedLanguage = normalizeLanguage(rawLng);
  const { home } = getDictionaries(lng);
  const title = home.hero?.headline ? `${home.hero.headline}` : "Zeta English Academy";
  const description = home.hero?.description ?? "Zeta English Academy — joyful English learning for curious students.";
  return { title, description } satisfies Metadata;
}
