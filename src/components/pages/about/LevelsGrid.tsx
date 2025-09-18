"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Sparkles, BookOpenText, Brain, UsersRound, Trophy, Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AboutDictionary } from "@/lib/i18n";
import { LEVEL_ARROW_CLIP_PATH, createLevelsDiagram } from "@/lib/levels-diagram";

interface LevelsGridProps {
  dictionary: AboutDictionary["levels"];
}

const iconMap: Partial<Record<string, LucideIcon>> = {
  early: Sparkles,
  foundation: BookOpenText,
  knowledge: Compass,
  skill: Brain,
  advanced: GraduationCap,
  critical: UsersRound,
  leadership: Trophy,
};

const LevelsGrid: React.FC<LevelsGridProps> = ({ dictionary }) => {
  const { title, description, detailLabels, items = [], footnote } = dictionary;
  const purposeLabel = detailLabels?.purpose ?? "Purpose";
  const skillsLabel = detailLabels?.coreSkills ?? "Core skills";
  const [activeIndex, setActiveIndex] = useState<number | null>(items.length > 0 ? 0 : null);
  const diagramItems = useMemo(() => createLevelsDiagram(items), [items]);

  if (items.length === 0) {
    return null;
  }

  const activeItem = activeIndex !== null ? diagramItems[activeIndex] : null;
  const activePalette = activeItem?.palette ?? null;
  const ActiveIcon = activeItem?.icon ? iconMap[activeItem.icon] ?? Sparkles : Sparkles;
  const detailLabel = activeItem?.label;
  const detailPurpose = activeItem?.purpose ?? activeItem?.subtitle;
  const detailSkills = activeItem?.coreSkills;

  return (
    <section className="bg-white py-24" id="levels">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-lg leading-relaxed text-gray-600">{description}</p>}
        </header>

        <div className="mt-12 flex flex-col items-center">
          <div
            className="flex h-60 w-full max-w-5xl items-end justify-between gap-2 sm:gap-4"
            aria-hidden="true"
          >
            {diagramItems.map(({ title: itemTitle, palette, barHeight }, index) => {
              const isActive = activeIndex === index;

              return (
                <div key={`${itemTitle}-bar`} className="flex flex-1 justify-center">
                  <div
                    className="w-full max-w-[72px] rounded-t-3xl border-2 transition-all duration-200"
                    style={{
                      height: `${barHeight}px`,
                      background: `linear-gradient(180deg, ${palette.bar.from} 0%, ${palette.bar.to} 100%)`,
                      borderColor: palette.bar.border,
                      boxShadow: `0 10px 24px -14px ${palette.shadow}`,
                      transform: isActive ? "translateY(-4px)" : undefined,
                      outline: isActive ? `3px solid ${palette.bar.border}` : undefined,
                      outlineOffset: isActive ? "4px" : undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div
            className="mt-6 flex w-full max-w-5xl flex-wrap justify-center gap-2 sm:grid sm:gap-3"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {diagramItems.map(({ title: itemTitle, palette, subtitle, purpose }, index) => {
              const isActive = activeIndex === index;

              return (
                <button
                  key={`${itemTitle}-arrow`}
                  type="button"
                  className="flex min-w-[130px] flex-1 items-center justify-center px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:text-sm"
                  style={{
                    background: `linear-gradient(90deg, ${palette.arrow.from} 0%, ${palette.arrow.to} 100%)`,
                    clipPath: LEVEL_ARROW_CLIP_PATH,
                    color: palette.arrow.text,
                    boxShadow: `0 8px 18px -12px ${palette.shadow}`,
                    opacity: isActive ? 1 : 0.85,
                    transform: isActive ? "scale(1.02)" : undefined,
                  }}
                  aria-pressed={isActive}
                  aria-expanded={isActive}
                  aria-controls="level-detail-panel"
                  aria-describedby={isActive ? undefined : `level-${index}-summary`}
                  aria-labelledby={`level-${index}-label`}
                  title={purpose ?? subtitle ?? itemTitle}
                  onClick={() => setActiveIndex(index)}
                >
                  <span id={`level-${index}-label`}>{itemTitle}</span>
                  {(purpose || subtitle) && (
                    <span id={`level-${index}-summary`} className="sr-only">
                      {purpose ?? subtitle}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {activeItem && activePalette && (
            <div
              className="mt-8 w-full max-w-4xl rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-lg"
              id="level-detail-panel"
              style={{
                background: `linear-gradient(135deg, ${activePalette.bar.from} 0%, ${activePalette.arrow.from} 100%)`,
                boxShadow: `0 16px 34px -18px ${activePalette.shadow}`,
              }}
              role="region"
              aria-live="polite"
              aria-labelledby="level-detail-heading"
            >
              <span
                className="inline-flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.72)",
                  color: activePalette.bar.border,
                  boxShadow: `0 10px 24px -18px ${activePalette.shadow}`,
                }}
              >
                <ActiveIcon className="h-7 w-7" aria-hidden="true" />
              </span>
              {detailLabel && <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700/80">{detailLabel}</p>}
              <h3 id="level-detail-heading" className="mt-5 text-xl font-semibold sm:text-2xl">
                {activeItem.title}
              </h3>
              {detailPurpose && (
                <p className="mt-4 text-base font-medium leading-relaxed text-gray-800/90">
                  <span className="font-semibold text-gray-900">{purposeLabel}:</span> {detailPurpose}
                </p>
              )}
              {detailSkills && (
                <p className="mt-3 text-sm leading-relaxed text-gray-800/80">
                  <span className="font-semibold text-gray-900">{skillsLabel}:</span> {detailSkills}
                </p>
              )}
            </div>
          )}
        </div>

        {footnote && (
          <p className="mt-10 text-center text-sm text-gray-500">{footnote}</p>
        )}
      </div>
    </section>
  );
};

export default LevelsGrid;
