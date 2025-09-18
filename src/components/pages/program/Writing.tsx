"use client";

import { BookOpen, ClipboardList, FileText } from "lucide-react";
import type { ProgramDictionary } from "@/lib/i18n";

interface WritingSectionProps {
  dictionary: ProgramDictionary["writing"];
}

export default function WritingSection({ dictionary }: WritingSectionProps) {
  const activityItems = [
    {
      icon: <BookOpen size={32} />,
      title: dictionary.activities.creativeWriting.title,
      description: dictionary.activities.creativeWriting.description,
    },
    {
      icon: <ClipboardList size={32} />,
      title: dictionary.activities.academicWriting.title,
      description: dictionary.activities.academicWriting.description,
    },
    {
      icon: <FileText size={32} />,
      title: dictionary.activities.editingRevisions.title,
      description: dictionary.activities.editingRevisions.description,
    },
  ];

  return (
    <section id="writing" className="py-16 bg-yellow-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">{dictionary.title}</h2>
        <p className="text-lg mb-8 text-center">{dictionary.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {activityItems.map((item) => (
            <div key={item.title} className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-yellow-600 mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
