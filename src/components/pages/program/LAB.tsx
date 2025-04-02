"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
  Book,
  Lightbulb,
  FileText,
  Mic,
  BookOpen,
  ListChecks,
  CheckCircle,
  ClipboardList,
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface ActivityCardProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

export default function LABSection({ lng }: { lng: string }) {
  const { t, i18n, ready } = useTranslation("program");
  const pathname = usePathname() || "/";

  // Extract language from pathname (e.g., "/en/lab" → "en")
  const currentLng = pathname.split("/")[1] || "en";

  useEffect(() => {
    if (i18n.language !== currentLng) {
      i18n.changeLanguage(currentLng);
    }
  }, [currentLng, i18n]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoized activity items
  const activityItems: ActivityCardProps[] = useMemo(
    () => [
      { icon: <Book size={32} />, title: t("lab.activities.reading.title"), description: t("lab.activities.reading.description") },
      { icon: <Lightbulb size={32} />, title: t("lab.activities.vocabulary.title"), description: t("lab.activities.vocabulary.description") },
      { icon: <FileText size={32} />, title: t("lab.activities.summaries.title"), description: t("lab.activities.summaries.description") },
      { icon: <Mic size={32} />, title: t("lab.activities.presentations.title"), description: t("lab.activities.presentations.description") },
    ],
    [t]
  );

  // Memoized lab details
  const labDetails = useMemo(
    () => [
      {
        title: t("lab.details.whatIs.title"),
        icon: <BookOpen size={28} className="text-blue-600" />,
        content: <p className="text-lg">{t("lab.details.whatIs.description")}</p>,
      },
      {
        title: t("lab.details.howItWorks.title"),
        icon: <ListChecks size={28} className="text-blue-600" />,
        content: (
          <div className="space-y-3 text-lg">
            <p className="flex items-center"><CheckCircle size={28} className="text-blue-500 mr-2" />{t("lab.details.howItWorks.steps.readBook")}</p>
            <p className="flex items-center"><ClipboardList size={28} className="text-blue-500 mr-2" />{t("lab.details.howItWorks.steps.findWords")}</p>
            <p className="flex items-center"><ListChecks size={28} className="text-blue-500 mr-2" />{t("lab.details.howItWorks.steps.writeSummaries")}</p>
            <p className="flex items-center"><Lightbulb size={28} className="text-blue-500 mr-2" />{t("lab.details.howItWorks.steps.discussWithTeacher")}</p>
            <p className="flex items-center"><Brain size={28} className="text-blue-500 mr-2" />{t("lab.details.howItWorks.steps.presentIdeas")}</p>
          </div>
        ),
      },
    ],
    [t]
  );

  if (!ready) return <div className="text-center p-4">Loading...</div>; // Graceful fallback

  return (
    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
      <section id="lab" className="w-full max-w-5xl px-6 my-12">
        <div className="py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">{t("lab.title")}</h2>
            <p className="text-lg mb-8 text-center">{t("lab.description")}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {activityItems.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-blue-600 mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              {!isExpanded ? (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                  aria-label={t("lab.readMore")}
                >
                  {t("lab.readMore")}
                </button>
              ) : (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                  aria-label={t("lab.seeLess")}
                >
                  {t("lab.seeLess")}
                </button>
              )}
            </div>
            {isExpanded &&
              labDetails.map((section, index) => (
                <div key={index} className="border border-gray-300 rounded-lg overflow-hidden shadow-md bg-white mt-4">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full text-left px-6 py-4 text-lg font-bold flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label={section.title}
                  >
                    <span className="flex items-center gap-2">{section.icon}{section.title}</span>
                    <span>{openIndex === index ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</span>
                  </button>
                  {openIndex === index && <div className="p-6 bg-gray-50 text-gray-700">{section.content}</div>}
                </div>
              ))}
          </div>
        </div>
      </section>
    </Suspense>
  );
}
