"use client";

import { BookOpen, GitBranch, BookCheck } from "lucide-react";
import type { ProgramDictionary } from "@/lib/i18n";

interface GrammarSectionProps {
  dictionary: ProgramDictionary["grammar"];
}

const GrammarSection = ({ dictionary }: GrammarSectionProps) => {
  const levelItems = [
    {
      icon: <BookOpen size={32} />,
      title: dictionary.levels.basic.title,
      description: dictionary.levels.basic.description,
    },
    {
      icon: <GitBranch size={32} />,
      title: dictionary.levels.intermediate.title,
      description: dictionary.levels.intermediate.description,
    },
    {
      icon: <BookCheck size={32} />,
      title: dictionary.levels.advanced.title,
      description: dictionary.levels.advanced.description,
    },
  ];

  return (
    <section id="grammar" className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">{dictionary.title}</h2>
        <p className="text-lg mb-8 text-center">{dictionary.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {levelItems.map((item) => (
            <div key={item.title} className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-green-600 mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GrammarSection;
