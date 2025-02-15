"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import FeatureSection from "./FeatureSection";

const Strategic = () => {
  const { t, ready } = useTranslation("home"); // Ensure translations are ready

  if (!ready) return null; // Prevent rendering mismatched content

  return (
    <FeatureSection
      title={t("strategic.title")}
      description={t("strategic.description")}
      customImageComponent={
        <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden bg-gray-100">
          <Image
            src="/images/pages/home/Strat.png"
            alt={t("strategic.imageAlt")}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain"
          />
        </div>
      }
      fontSize="text-lg md:text-xl"
      paddingClass="py-6 md:py-8 px-4"
    >
      <Link
        href="/programs"
        className="text-white font-semibold bg-brand-primary px-4 py-2 hover:bg-brand-primary-dark transition"
        aria-label={t("strategic.buttonAriaLabel")}
      >
        {t("strategic.buttonText")}
      </Link>
    </FeatureSection>
  );
};

export default Strategic;
