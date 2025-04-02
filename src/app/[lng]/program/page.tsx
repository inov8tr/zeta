// src/app/[lng]/program/page.tsx
import Hero from "@/components/pages/program/Hero";
import QuickNav from "@/components/pages/program/QuickNav";
import LABSection from "@/components/pages/program/LAB";
import GrammarSection from "@/components/pages/program/Grammar";
import DiscussionSection from "@/components/pages/program/Discussion";
import WritingSection from "@/components/pages/program/Writing";
import BookAppointmentCTA from "@/components/pages/home/BookAppointmentCTA";

export default async function ProgramPage({ params }: { params: Promise<{ lng: string }> }) {
  const resolvedParams = await params;
  const { lng } = resolvedParams;
  console.log("🚨 ProgramPage - Rendering with lng:", lng);

  return (
    <main className="flex flex-col items-center justify-center w-full">
      <Hero lng={lng} />
      <QuickNav lng={lng} />
      <LABSection lng={lng} />
      <GrammarSection lng={lng} />
      <DiscussionSection lng={lng} />
      <WritingSection lng={lng} />
      <BookAppointmentCTA lng={lng} />
    </main>
  );
}