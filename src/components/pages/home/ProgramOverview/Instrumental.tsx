"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface InstrumentalProps {
  lng: string;
}

const Instrumental: React.FC<InstrumentalProps> = ({ lng }) => {
  const { t, ready } = useTranslation("home", { lng });

  if (!ready) return null;

  return (
    <section className="flex flex-col items-center py-6 md:py-8 px-4 bg-gray-100 rounded-lg">
      <div className="w-full text-center space-y-2 mb-4">
        <h3 className="text-lg md:text-xl font-bold tracking-tight text-brand-primary">{t("instrumental.title")}</h3>
        <p className="text-sm md:text-base text-gray-600 leading-snug">{t("instrumental.description")}</p>
      </div>

      <div className="relative w-full h-[150px] md:h-[200px] overflow-hidden bg-gray-100 mb-4">
        <Image src="/images/pages/home/Levels.svg" alt={t("instrumental.imageAlt")} fill className="object-contain" />
      </div>

      <Link href="/programs" className="text-white font-semibold bg-brand-primary px-4 py-2 hover:bg-brand-primary-dark">
        {t("instrumental.buttonText")}
      </Link>
    </section>
  );
};

export default Instrumental;
