"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Newspaper, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

const icons = [Users, BookOpen, Newspaper, UserPlus];

export default function HighlightNav() {
  const { t, ready } = useTranslation("home");

  if (!ready) return null; // ✅ Prevents rendering before translations load

  // Ensure highlightNav.items is an array
  const highlights = t("highlightNav.items", { returnObjects: true });

  console.log("🚨 highlightNav.items content:", highlights);

  if (!Array.isArray(highlights)) {
    console.error("❌ Translation Error: highlightNav.items is not an array", highlights);
    return null; // ✅ Prevents errors from rendering incorrect data
  }

  return (
    <section className="bg-white py-10 sm:py-12 lg:py-14"> {/* Reduced vertical padding */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10"> {/* Reduced bottom margin */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {t("highlightNav.header")}
          </h2>
          <p className="mt-2 text-md sm:text-lg text-gray-700">
            {t("highlightNav.description")}
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"> {/* Reduced gap */}
          {highlights.map((item, index) => {
            const Icon = icons[index % icons.length]; // Prevent out-of-bounds error
            return (
              <Link key={item.title} href={item.href} aria-label={item.title}>
                <Card className="bg-gray-50 border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-center">
                  <CardContent className="p-6 sm:p-8 flex flex-col items-center"> {/* Reduced padding */}
                    {/* Icon Design */}
                    <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-brand-primary to-brand-primary-dark rounded-full shadow-md">
                      <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold text-gray-900">{item.title}</h3>
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
