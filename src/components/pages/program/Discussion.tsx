"use client";

import { useEffect, useMemo, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Lightbulb, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

interface ActivityCardProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

export default function DiscussionSection({ lng }: { lng: string }) {
  const { t, i18n, ready } = useTranslation("program");
  const pathname = usePathname() || "/";

  // Extract language from pathname (e.g., "/en/discussion" → "en")
  const currentLng = pathname.split("/")[1] || "en";

  useEffect(() => {
    if (i18n.language !== currentLng) {
      i18n.changeLanguage(currentLng);
    }
  }, [currentLng, i18n]);

  // Memoized activity items
  const activityItems: ActivityCardProps[] = useMemo(
    () => [
      { icon: <MessageSquare size={32} />, title: t("discussion.activities.discussions.title"), description: t("discussion.activities.discussions.description") },
      { icon: <Lightbulb size={32} />, title: t("discussion.activities.criticalThinking.title"), description: t("discussion.activities.criticalThinking.description") },
      { icon: <MessageCircle size={32} />, title: t("discussion.activities.expression.title"), description: t("discussion.activities.expression.description") },
    ],
    [t]
  );

  if (!ready) return <div className="text-center p-4">Loading...</div>; // Graceful fallback

  return (
    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
      <section id="discussion" className="py-16 bg-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{t("discussion.title")}</h2>
          <p className="text-lg mb-8 text-center">{t("discussion.description")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {activityItems.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-purple-600 mb-4">{item.icon}</div>
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
