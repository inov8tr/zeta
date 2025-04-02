"use client";

import { useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Book, MessageCircle, GraduationCap, ScrollText, Key } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

interface QuickNavItem {
  title: string;
  href: string;
}

const icons = [Book, MessageCircle, GraduationCap, ScrollText];

export default function QuickNav({ lng }: { lng: string }) {
  const { t, i18n, ready } = useTranslation("program");
  const pathname = usePathname() || "/";

  // Extract the current language from the pathname
  const currentLng = pathname.split("/")[1] || "en";

  // Ensure correct language setting (memoized)
  useEffect(() => {
    if (i18n.language !== currentLng) {
      i18n.changeLanguage(currentLng);
    }
  }, [currentLng, i18n]);

  // Memoize navigation items to prevent unnecessary re-renders
  const quickNavItems: QuickNavItem[] = useMemo(
    () => [
      { title: t("quickNav.lab"), href: "#lab" },
      { title: t("quickNav.discussion"), href: "#discussion" },
      { title: t("quickNav.grammar"), href: "#grammar" },
      { title: t("quickNav.writingDebate"), href: "#writing" },
    ],
    [t]
  );

  if (!ready) return <div className="text-center p-4">Loading...</div>; // Graceful fallback

  return (
    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
      <section className="w-full bg-white z-10 shadow-md">
        <div className="bg-white py-10 sm:py-12 lg:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* 📌 Heading Section */}
            <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
              <Key size={48} className="text-blue-600 mb-2" />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                {t("strategic.heading")}
              </h2>
              <p className="mt-2 text-md sm:text-lg text-gray-700 max-w-3xl">
                {t("strategic.description")}
              </p>
            </div>

            {/* 📌 Quick Navigation Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 lg:grid-cols-4">
              {quickNavItems.map((item, index) => {
                const Icon = icons[index % icons.length]; // Prevents index errors
                return (
                  <Link key={item.title} href={item.href} aria-label={item.title}>
                    <Card className="bg-gray-50 border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-center">
                      <CardContent className="p-6 sm:p-8 flex flex-col items-center">
                        <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-brand-primary to-brand-primary-dark rounded-full shadow-md">
                          <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                        </div>
                        <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold text-gray-900">{item.title}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </Suspense>
  );
}
