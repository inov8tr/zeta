"use client";

import { useEffect, useMemo, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, ClipboardList, FileText } from "lucide-react";
import { usePathname } from "next/navigation";

interface ActivityCardProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

export default function WritingSection({ lng }: { lng: string }) {
  const { t, i18n, ready } = useTranslation("program");
  const pathname = usePathname() || "/";
  
  // Extract valid language from URL (e.g., "/en/program" → "en")
  const currentLng = pathname.split("/")[1] || "en";

  // Ensure correct language setting (memoized)
  useEffect(() => {
    if (i18n.language !== currentLng) {
      i18n.changeLanguage(currentLng);
    }
  }, [currentLng, i18n]);

  // Activity Items (memoized for performance)
  const activityItems: ActivityCardProps[] = useMemo(
    () => [
      {
        icon: <BookOpen size={32} />,
        title: t("writing.activities.creativeWriting.title"),
        description: t("writing.activities.creativeWriting.description"),
      },
      {
        icon: <ClipboardList size={32} />,
        title: t("writing.activities.academicWriting.title"),
        description: t("writing.activities.academicWriting.description"),
      },
      {
        icon: <FileText size={32} />,
        title: t("writing.activities.editingRevisions.title"),
        description: t("writing.activities.editingRevisions.description"),
      },
    ],
    [t]
  );

  if (!ready) return <div className="text-center p-4">Loading...</div>; // Graceful fallback

  return (
    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
      <section id="writing" className="py-16 bg-yellow-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{t("writing.title")}</h2>
          <p className="text-lg mb-8 text-center">{t("writing.description")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {activityItems.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-yellow-600 mb-4">{item.icon}</div>
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
