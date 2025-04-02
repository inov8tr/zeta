"use client";

import { useEffect, Suspense } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import VennDiagram from "./VennDiagram"; // ✅ Corrected import
import { usePathname } from "next/navigation";

export default function Hero({ lng }: { lng: string }) {
  const { t, i18n, ready } = useTranslation("program");
  const pathname = usePathname() || "/";

  // Extract language from pathname (e.g., "/en/program" → "en")
  const currentLng = pathname.split("/")[1] || "en";

  useEffect(() => {
    if (i18n.language !== currentLng) {
      i18n.changeLanguage(currentLng);
    }
  }, [currentLng, i18n]);

  if (!ready) return <div className="text-center p-4">Loading...</div>; // Graceful fallback

  return (
    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
      <section className="relative w-full overflow-hidden py-12 sm:py-16 lg:py-20 text-white flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/pages/program/SystemBG.png"
            alt={t("hero.backgroundAlt")}
            fill
            className="object-cover object-center w-full h-full"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-black opacity-50"></div>

        {/* Hero Content */}
        <div className="relative z-20 w-full px-6 lg:px-12 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
            {/* Text Content */}
            <div className="text-center lg:text-left max-w-3xl mx-auto lg:mx-0 text-white">
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                {t("hero.title")}
              </h1>
              <p className="text-md lg:text-lg opacity-90">{t("hero.description")}</p>
            </div>

            {/* Venn Diagram */}
            <div className="w-full flex justify-center">
              <VennDiagram /> {/* ✅ Now correctly using VennDiagram.tsx */}
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center mt-8">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
              aria-label={t("hero.cta")}
            >
              {t("hero.cta")}
            </button>
          </div>
        </div>
      </section>
    </Suspense>
  );
}
