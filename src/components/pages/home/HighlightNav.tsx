"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Newspaper, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

const icons = [Users, BookOpen, Newspaper, UserPlus];

interface HighlightNavProps {
  lng: string;
}

export default function HighlightNav({ lng }: HighlightNavProps) {
  const { t } = useTranslation("home");

  const highlights = t("highlightNav.items", { returnObjects: true, lng });

  if (!Array.isArray(highlights)) {
    return null;
  }

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">{t("highlightNav.header")}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item, index) => {
            const Icon = icons[index % icons.length];
            return (
              <Link key={item.title} href={`/${lng}${item.href}`}>
                <Card>
                  <CardContent>
                    <Icon className="h-8 w-8" />
                    <h3>{item.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
