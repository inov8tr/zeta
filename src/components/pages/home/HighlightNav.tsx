"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Newspaper, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

const icons = [Users, BookOpen, Newspaper, UserPlus];

export default function HighlightNav() {
  const { t } = useTranslation("home");

  // Log translation output
  const highlights = t("highlightNav.items", { returnObjects: true });

  console.log("🚨 highlightNav.items content:", highlights);

  if (!Array.isArray(highlights)) {
    console.error("❌ Translation Error: highlightNav.items is not an array", highlights);
    return null; // Prevent rendering if data is incorrect
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {t("highlightNav.header")}
          </h2>
          <p className="mt-2 text-lg text-gray-700">
            {t("highlightNav.description")}
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item, index) => {
            const Icon = icons[index % icons.length]; // Prevent out-of-bounds error
            return (
              <Link key={item.title} href={item.href} aria-label={item.title}>
                <Card className="bg-gray-50 border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-center">
                  <CardContent className="p-8 flex flex-col items-center">
                    {/* Icon Design */}
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-primary-dark rounded-full shadow-md">
                      <Icon className="h-10 w-10 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="mt-4 text-xl font-bold text-gray-900">{item.title}</h3>
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
