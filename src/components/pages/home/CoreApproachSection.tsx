import { Sparkles, MessageSquare, Target, Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HomeDictionary } from "@/lib/i18n";

interface CoreApproachSectionProps {
  dictionary: HomeDictionary["coreApproach"];
}

type Pillars = NonNullable<HomeDictionary["coreApproach"]["pillars"]>;
type PillarIcon = Pillars[number]["icon"];

const iconMap: Partial<Record<PillarIcon, LucideIcon>> = {
  sparkles: Sparkles,
  messages: MessageSquare,
  target: Target,
  versatile: Sparkles,
  communication: MessageSquare,
  strategy: Target,
};

export default function CoreApproachSection({ dictionary }: CoreApproachSectionProps) {
  const { title, pillars = [] } = dictionary;

  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{title}</h2>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = iconMap[pillar.icon] ?? Compass;

            return (
              <article
                key={pillar.title}
                className="group h-full rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
