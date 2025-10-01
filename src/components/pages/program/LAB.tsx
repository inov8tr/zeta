"use client";

import { useState } from "react";
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
import type { ProgramDictionary } from "@/lib/i18n";

interface LABSectionProps {
  dictionary: ProgramDictionary["lab"];
}

const LABSection = ({ dictionary }: LABSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const activityItems = [
    {
      icon: <Book size={32} />,
      title: dictionary.activities.reading.title,
      description: dictionary.activities.reading.description,
    },
    {
      icon: <Lightbulb size={32} />,
      title: dictionary.activities.vocabulary.title,
      description: dictionary.activities.vocabulary.description,
    },
    {
      icon: <FileText size={32} />,
      title: dictionary.activities.summaries.title,
      description: dictionary.activities.summaries.description,
    },
    {
      icon: <Mic size={32} />,
      title: dictionary.activities.presentations.title,
      description: dictionary.activities.presentations.description,
    },
  ];

  const labDetails = [
    {
      title: dictionary.details.whatIs.title,
      icon: <BookOpen size={28} className="text-blue-600" />,
      content: <p className="text-lg">{dictionary.details.whatIs.description}</p>,
    },
    {
      title: dictionary.details.howItWorks.title,
      icon: <ListChecks size={28} className="text-blue-600" />,
      content: (
        <div className="space-y-3 text-lg">
          <p className="flex items-center"><CheckCircle size={28} className="text-blue-500 mr-2" />{dictionary.details.howItWorks.steps.readBook}</p>
          <p className="flex items-center"><ClipboardList size={28} className="text-blue-500 mr-2" />{dictionary.details.howItWorks.steps.findWords}</p>
          <p className="flex items-center"><ListChecks size={28} className="text-blue-500 mr-2" />{dictionary.details.howItWorks.steps.writeSummaries}</p>
          <p className="flex items-center"><Lightbulb size={28} className="text-blue-500 mr-2" />{dictionary.details.howItWorks.steps.discussWithTeacher}</p>
          <p className="flex items-center"><Brain size={28} className="text-blue-500 mr-2" />{dictionary.details.howItWorks.steps.presentIdeas}</p>
        </div>
      ),
    },
  ];

  const extendedSections = dictionary.contentSections ?? [];

  return (
    <section id="lab" className="w-full max-w-5xl px-6 my-12">
      <div className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{dictionary.title}</h2>
          <p className="text-lg mb-8 text-center">{dictionary.description}</p>
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
                type="button"
                onClick={() => setIsExpanded(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                aria-label={dictionary.readMore}
              >
                {dictionary.readMore}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setOpenIndex(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                aria-label={dictionary.seeLess}
              >
                {dictionary.seeLess}
              </button>
            )}
          </div>
          {isExpanded && (
            <div className="mt-6 space-y-6">
              {labDetails.map((section, index) => (
                <div key={section.title} className="border border-gray-300 rounded-lg overflow-hidden shadow-md bg-white">
                  <button
                    type="button"
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

              {extendedSections.map((content, idx) => (
                <div key={`lab-extended-${idx}`} className="rounded-2xl bg-white p-6 shadow">
                  {content.heading && (
                    <h3 className="text-xl font-semibold text-neutral-900">{content.heading}</h3>
                  )}
                  {content.paragraphs &&
                    content.paragraphs.map((paragraph: string, paragraphIdx: number) => (
                      <p key={`lab-paragraph-${idx}-${paragraphIdx}`} className="mt-4 text-sm text-neutral-700">
                        {paragraph}
                      </p>
                    ))}
                  {content.listTitle && (
                    <p className="mt-6 text-sm font-semibold text-neutral-900">{content.listTitle}</p>
                  )}
                  {content.list && (
                    <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                      {content.list.map((item: string, itemIdx: number) => (
                        <li key={`lab-list-${idx}-${itemIdx}`} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {content.closing && (
                    <p className="mt-4 text-sm text-neutral-700">{content.closing}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LABSection;
