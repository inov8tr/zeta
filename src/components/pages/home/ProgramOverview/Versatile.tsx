"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import FeatureSection from "./FeatureSection";
import { useTranslation } from "react-i18next";

interface VersatileProps {
  lng: string;
}

const Versatile: React.FC<VersatileProps> = ({ lng }) => {
  const { t, ready } = useTranslation("home", { lng });
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!ready) return null;

  const images = [
    "/images/pages/home/SA.svg",
    "/images/pages/home/SS.svg",
    "/images/pages/home/SSA.svg",
  ];

  return (
    <FeatureSection
      title={t("versatile.title")}
      description={t("versatile.description")}
      customImageComponent={
        <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden group">
          <Image
            src={images[currentSlide]}
            alt={t("versatile.imageAlt")}
            fill
            className="object-contain transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
        </div>
      }
      fontSize="text-xl md:text-2xl"
      paddingClass="py-8 md:py-10 px-4"
    >
      <Button asChild size="lg" className="bg-gradient-to-r from-brand-blue to-brand-accent text-white">
        <Link href="#">{t("versatile.buttonText")}</Link>
      </Button>
    </FeatureSection>
  );
};

export default Versatile;
