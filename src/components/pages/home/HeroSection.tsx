"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

interface HeroProps {
  lng: string;
}

interface HeroHeading {
  academyName: string;
  belief: string;
  funLearning: string;
  creativity: string;
}

export default function Hero({ lng }: HeroProps) {
  const { t, ready } = useTranslation("home", { lng });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!ready || !isClient) return <div className="text-center p-4">Loading...</div>;

  const heading = t("hero.heading", { returnObjects: true }) as HeroHeading;

  return (
    <section className="relative bg-brand-primary-dark py-16 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl">
          {heading.academyName} {heading.belief} {heading.funLearning} {heading.creativity}
        </h1>

        <Button>
          <Link href={`/${lng}/enrollment`}>{t("hero.buttons.enroll")}</Link>
        </Button>
      </div>
    </section>
  );
}
