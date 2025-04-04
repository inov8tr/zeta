"use client";

import { useTranslation } from "react-i18next";
import Versatile from "@/components/pages/home/ProgramOverview/Versatile";
import Instrumental from "@/components/pages/home/ProgramOverview/Instrumental";
import Strategic from "@/components/pages/home/ProgramOverview/Strategic";

interface ProgramOverviewProps {
  lng: string;
}

const ProgramOverview: React.FC<ProgramOverviewProps> = ({ lng }) => {
  const { t, ready } = useTranslation("home", { lng });

  if (!ready) return null;

  return (
    <section className="py-24 bg-white">
      <header className="max-w-5xl mx-auto text-center mb-16 px-6 sm:px-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">{t("programOverview.header")}</h2>
        <p className="mt-4 text-lg text-gray-600">{t("programOverview.description")}</p>
      </header>

      <div className="space-y-16 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <Versatile lng={lng} />
        <Instrumental lng={lng} />
        <Strategic lng={lng} />
      </div>
    </section>
  );
};

export default ProgramOverview;
