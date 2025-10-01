import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, PencilLine, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HomeDictionary, SupportedLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/classNames";

interface ProgramLevelsSectionProps {
  lng: SupportedLanguage;
  dictionary: HomeDictionary["programLevels"];
}

const ProgramLevelsSection = ({ lng, dictionary }: ProgramLevelsSectionProps) => {
  const { title, intro, levels = [], ctaLabel } = dictionary;

  type LevelKey = "lab" | "grammar" | "discussion" | "default";

  const iconMap: Record<LevelKey, LucideIcon> = {
    lab: BookOpen,
    grammar: PencilLine,
    discussion: Mic,
    default: ArrowRight,
  };

  const themeMap: Record<LevelKey, { iconClass: string; buttonClass: string; badgeClass: string; hoverBorder: string }> = {
    lab: {
      iconClass: "bg-brand-primary/10 text-brand-primary",
      buttonClass: "bg-brand-primary text-white hover:bg-brand-primary-dark",
      badgeClass: "text-brand-primary/80",
      hoverBorder: "group-hover:border-brand-primary",
    },
    grammar: {
      iconClass: "bg-brand-accent/20 text-brand-primary-dark",
      buttonClass: "bg-brand-accent text-gray-900 hover:bg-brand-accent-dark",
      badgeClass: "text-brand-primary-dark",
      hoverBorder: "group-hover:border-brand-accent",
    },
    discussion: {
      iconClass: "bg-brand-primary-dark/15 text-brand-primary-dark",
      buttonClass: "bg-brand-primary-dark text-white hover:bg-brand-primary",
      badgeClass: "text-brand-primary-dark",
      hoverBorder: "group-hover:border-brand-primary-dark",
    },
    default: {
      iconClass: "bg-brand-primary/10 text-brand-primary",
      buttonClass: "bg-brand-primary text-white hover:bg-brand-primary-dark",
      badgeClass: "text-brand-primary/80",
      hoverBorder: "group-hover:border-brand-primary",
    },
  };

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{title}</h2>
          {intro && <p className="mt-4 text-lg leading-relaxed text-gray-600">{intro}</p>}
        </header>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {levels.map((level, index) => {
            const badgeText = level.badge ?? `Section ${String(index + 1).padStart(2, "0")}`;
            const summary = level.summary;
            const sectionHref = level.href
              ? level.href.startsWith("/")
                ? level.href
                : `/${level.href}`
              : null;
            const key = (level.badge ?? level.name ?? "").toLowerCase();
            const themeKey: LevelKey = key.includes("lab")
              ? "lab"
              : key.includes("grammar")
                ? "grammar"
                : key.includes("discussion")
                  ? "discussion"
                  : "default";
            const Icon = iconMap[themeKey];
            const theme = themeMap[themeKey];

            return (
              <article
                key={level.name}
                className={cn(
                  "group relative flex h-full flex-col rounded-3xl border border-gray-100 bg-white/80 p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                  theme.hoverBorder
                )}
              >
                <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary/80">
                  <span className={theme.badgeClass}>{badgeText}</span>
                  <ArrowRight className="h-4 w-4 text-brand-primary" />
                </div>
                <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-inner">
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl text-brand-primary",
                      theme.iconClass
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-bold text-gray-900">{level.name}</h3>
                {summary && (
                  <p className="mt-4 text-sm leading-relaxed text-gray-600">{summary}</p>
                )}
                {sectionHref && level.ctaLabel && (
                  <Button
                    asChild
                    className={cn(
                      "mt-6 inline-flex w-fit items-center gap-2 px-5 py-2 text-sm font-semibold",
                      theme.buttonClass
                    )}
                  >
                    <Link href={`/${lng}${sectionHref}`}>
                      {level.ctaLabel}
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </article>
            );
          })}
        </div>

        {ctaLabel && (
          <div className="mt-12 flex justify-center">
            <Button asChild className="bg-brand-primary text-white shadow-sm hover:bg-brand-primary-dark">
              <Link href={`/${lng}/program`}>{ctaLabel}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProgramLevelsSection;
