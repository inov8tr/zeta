"use client";

import { useTranslation } from "react-i18next";
import HeroSection from "@/components/pages/home/HeroSection";
import HighlightNav from "@/components/pages/home/HighlightNav";
import ProgramOverview from "@/components/pages/home/ProgramOverview/ProgramOverview";
import TestimonialSection from "@/components/pages/home/TestimonialSection";
import BookAppointmentCTA from "@/components/pages/home/BookAppointmentCTA";

export default function HomePage() {
  const { t, ready } = useTranslation("home");

  if (!ready) return <p>Loading translations...</p>;

  return (
    <main>
      <h1 className="text-center text-2xl font-bold">{t("hero.heading.academyName")}</h1>
      <HeroSection />
      <HighlightNav />
      <ProgramOverview />
      <TestimonialSection />
      <BookAppointmentCTA />
    </main>
  );
}
