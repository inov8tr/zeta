"use client";

import { useEffect, useMemo, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, GitBranch, BookCheck } from "lucide-react";
import { usePathname } from "next/navigation";

interface LevelCardProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

export default function GrammarSection({ lng }: { lng: string }) {
  const { t, i18n, ready } = useTranslation("program");
  const pathname = usePathname() || "/";

  // Extract language from pathname (e.g., "/en/grammar" → "en")
  const currentLng = pathname.split("/")[1] || "en";

  useEffect(() => {
    if (i18n.language !== currentLng) {
      i18n.changeLanguage(currentLng);
    }
  }, [currentLng, i18n]);

  // Memoized level items
  const levelItems: LevelCardProps[] = useMemo(
    () => [
      { icon: <BookOpen size={32} />, title: t("grammar.levels.basic.title"), description: t("grammar.levels.basic.description") },
      { icon: <GitBranch size={32} />, title: t("grammar.levels.intermediate.title"), description: t("grammar.levels.intermediate.description") },
      { icon: <BookCheck size={32} />, title: t("grammar.levels.advanced.title"), description: t("grammar.levels.advanced.description") },
    ],
    [t]
  );

  if (!ready) return <div className="text-center p-4">Loading...</div>; // Graceful fallback

  return (
    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
      <section id="grammar" className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{t("grammar.title")}</h2>
          <p className="text-lg mb-8 text-center">{t("grammar.description")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {levelItems.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-green-600 mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Suspense>
  );
}
