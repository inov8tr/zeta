"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import ProgramHeroSlider from "@/components/pages/program/ProgramHeroSlider";
import { cn } from "@/utils/classNames";

interface ContentSection {
  heading?: string;
  paragraphs?: string[];
  listTitle?: string;
  list?: string[];
  closing?: string;
}

type Tone = "primary" | "accent" | "neutral";

interface ProgramSectionCardProps {
  id: string;
  title: string;
  summary: string;
  highlights?: string[];
  imageSrc?: string;
  imageAlt?: string;
  readMoreLabel: string;
  seeLessLabel: string;
  contentSections?: ContentSection[];
  sliderImages?: { src: string; alt: string }[];
  sliderIntervalMs?: number;
  tone?: Tone;
  isReversed?: boolean;
}

const toneStyles: Record<Tone, { wrapper: string; blobPrimary: string; blobSecondary: string }> = {
  primary: {
    wrapper: "bg-gradient-to-br from-brand-primary/10 via-white to-brand-primary/5 ring-1 ring-brand-primary/10",
    blobPrimary: "bg-brand-primary/20",
    blobSecondary: "bg-brand-accent/30",
  },
  accent: {
    wrapper: "bg-gradient-to-br from-brand-accent/10 via-white to-brand-accent/5 ring-1 ring-brand-accent/20",
    blobPrimary: "bg-brand-accent/25",
    blobSecondary: "bg-brand-primary/20",
  },
  neutral: {
    wrapper: "bg-white/90 ring-1 ring-neutral-200",
    blobPrimary: "bg-brand-primary/15",
    blobSecondary: "bg-brand-accent/15",
  },
};

const ProgramSectionCard = ({
  id,
  title,
  summary,
  highlights = [],
  imageSrc,
  imageAlt,
  readMoreLabel,
  seeLessLabel,
  contentSections = [],
  sliderImages,
  sliderIntervalMs,
  tone = "primary",
  isReversed = false,
}: ProgramSectionCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasMoreContent = contentSections.length > 0;
  const toneStyle = toneStyles[tone];

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn(
        "relative overflow-hidden rounded-4xl p-10 shadow-lg transition-shadow duration-300 hover:shadow-2xl",
        toneStyle.wrapper
      )}
    >
      <div
        className={cn(
          "absolute -top-40 left-0 hidden h-64 w-64 rounded-full blur-3xl lg:block",
          toneStyle.blobPrimary
        )}
        aria-hidden
      />
      <div
        className={cn(
          "absolute -bottom-36 right-4 hidden h-56 w-56 rounded-full blur-3xl lg:block",
          toneStyle.blobSecondary
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_360px]",
          isReversed && "lg:grid-cols-[360px_minmax(0,1fr)]"
        )}
      >
        <div className={cn(isReversed && "lg:order-2")}>
          <h2 id={`${id}-heading`} className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base text-neutral-700 sm:text-lg">{summary}</p>

          {highlights.length > 0 && (
            <ul className="mt-6 space-y-3 text-sm text-neutral-700">
              {highlights.map((highlight, index) => (
                <li key={`highlight-${index}`} className="flex items-start gap-3 leading-relaxed">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          )}

          {hasMoreContent && (
            <div className="mt-8">
              <Button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="bg-brand-primary text-white shadow-sm hover:bg-brand-primary-dark"
              >
                {isOpen ? seeLessLabel : readMoreLabel}
              </Button>
            </div>
          )}

          {hasMoreContent && isOpen && (
            <div className="mt-10 space-y-6 rounded-3xl border border-white/40 bg-white/70 p-6 text-sm leading-relaxed text-neutral-700 shadow-inner backdrop-blur">
              {contentSections.map((content, idx) => (
                <div key={`content-${idx}`} className="space-y-4">
                  {content.heading && (
                    <h3 className="text-lg font-semibold text-neutral-900">{content.heading}</h3>
                  )}
                  {content.paragraphs?.map((paragraph, paragraphIdx) => (
                    <p key={`paragraph-${idx}-${paragraphIdx}`}>{paragraph}</p>
                  ))}
                  {content.listTitle && (
                    <p className="pt-2 text-sm font-semibold uppercase tracking-wide text-neutral-900">
                      {content.listTitle}
                    </p>
                  )}
                  {content.list && (
                    <ul className="space-y-2">
                      {content.list.map((item, itemIdx) => (
                        <li key={`item-${idx}-${itemIdx}`} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {content.closing && <p>{content.closing}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cn("relative", isReversed && "lg:order-1")}>
          {sliderImages?.length ? (
            <ProgramHeroSlider
              images={sliderImages}
              intervalMs={sliderIntervalMs}
              heightClass="h-72"
              className="bg-white/70 shadow-xl backdrop-blur"
            />
          ) : (
            <div className="relative mx-auto h-72 w-full max-w-sm overflow-hidden rounded-3xl bg-white/80 shadow-xl backdrop-blur">
              {imageSrc && (
                <Image src={imageSrc} alt={imageAlt || title} fill className="object-contain p-6" />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProgramSectionCard;
