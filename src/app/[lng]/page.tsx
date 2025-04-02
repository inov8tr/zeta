"use client";

import { Suspense } from "react";
import HeroSection from "@/components/pages/home/HeroSection";
import HighlightNav from "@/components/pages/home/HighlightNav";
import ProgramOverview from "@/components/pages/home/ProgramOverview/ProgramOverview";
import TestimonialSection from "@/components/pages/home/TestimonialSection";
import BookAppointmentCTA from "@/components/pages/home/BookAppointmentCTA";
import { usePathname } from "next/navigation";

export default function HomePage() {
  const pathname = usePathname() || "/";
  const lng: string = pathname.split("/")[1] || "en"; // Ensure `lng` is always a string

  return (
    <main>
      <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
        <HeroSection lng={lng} />
        <HighlightNav lng={lng} />
        <ProgramOverview lng={lng} />
        <TestimonialSection lng={lng} />
        <BookAppointmentCTA lng={lng} />
      </Suspense>
    </main>
  );
}
