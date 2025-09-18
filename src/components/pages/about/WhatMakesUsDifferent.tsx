import { BadgeCheck } from "lucide-react";
import type { AboutDictionary } from "@/lib/i18n";

interface WhatMakesUsDifferentProps {
  dictionary: AboutDictionary["differentiators"];
}

const WhatMakesUsDifferent: React.FC<WhatMakesUsDifferentProps> = ({ dictionary }) => {
  const { title, items = [] } = dictionary;

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-24" id="why-zeta">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{title}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item}
              className="flex items-start gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-lg"
            >
              <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <p className="text-base leading-relaxed text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatMakesUsDifferent;
