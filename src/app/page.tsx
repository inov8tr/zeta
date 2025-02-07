import React from "react";
import HeroSection from "@/components/pages/home/HeroSection";
import HighlightNav from "@/components/pages/home/HighlightNav";
import ProgramOverview from "@/components/pages/home/ProgramOverview";
import TestimonialSection from "@/components/pages/home/TestimonialSection";
import BookAppointmentCTA from "@/components/pages/home/BookAppointmentCTA";

const HomePage = () => (
  <main>
    <HeroSection />
    <HighlightNav />
    <ProgramOverview />
    <TestimonialSection />
    <BookAppointmentCTA />
  </main>
);

export default HomePage;
