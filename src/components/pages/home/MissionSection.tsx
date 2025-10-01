import { Palette, GraduationCap, MessageCircle, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HomeDictionary } from "@/lib/i18n";

interface MissionSectionProps {
  dictionary: HomeDictionary["mission"];
}

type MissionHighlights = NonNullable<HomeDictionary["mission"]["highlights"]>;
type IconKey = MissionHighlights[number]["icon"];

const iconMap: Partial<Record<IconKey, LucideIcon>> = {
  creativity: Palette,
  success: GraduationCap,
  communication: MessageCircle,
  versatile: Sparkles,
};

const MissionSection = ({ dictionary }: MissionSectionProps) => {
  const { title, description, highlights = [] } = dictionary;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-center">
        <div className="lg:w-1/2">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{title}</h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">{description}</p>
        </div>

        {highlights.length > 0 && (
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            {highlights.map((highlight) => {
              const Icon = iconMap[highlight.icon] ?? Sparkles;
              return (
                <div
                  key={highlight.label}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center shadow-sm"
                >
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-gray-900">{highlight.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default MissionSection;
