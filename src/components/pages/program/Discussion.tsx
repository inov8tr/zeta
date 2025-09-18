"use client";

import { MessageSquare, Lightbulb, MessageCircle } from "lucide-react";
import type { ProgramDictionary } from "@/lib/i18n";

interface DiscussionSectionProps {
  dictionary: ProgramDictionary["discussion"];
}

export default function DiscussionSection({ dictionary }: DiscussionSectionProps) {
  const activityItems = [
    {
      icon: <MessageSquare size={32} />,
      title: dictionary.activities.discussions.title,
      description: dictionary.activities.discussions.description,
    },
    {
      icon: <Lightbulb size={32} />,
      title: dictionary.activities.criticalThinking.title,
      description: dictionary.activities.criticalThinking.description,
    },
    {
      icon: <MessageCircle size={32} />,
      title: dictionary.activities.expression.title,
      description: dictionary.activities.expression.description,
    },
  ];

  return (
    <section id="discussion" className="py-16 bg-purple-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">{dictionary.title}</h2>
        <p className="text-lg mb-8 text-center">{dictionary.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {activityItems.map((item) => (
            <div key={item.title} className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-purple-600 mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
