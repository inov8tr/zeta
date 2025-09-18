"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface ContentSection {
  heading?: string;
  paragraphs?: string[];
  listTitle?: string;
  list?: string[];
  closing?: string;
}

interface ProgramSectionCardProps {
  id: string;
  title: string;
  summary: string;
  highlights?: string[];
  imageSrc: string;
  imageAlt: string;
  readMoreLabel: string;
  seeLessLabel: string;
  contentSections?: ContentSection[];
}

export default function ProgramSectionCard({
  id,
  title,
  summary,
  highlights = [],
  imageSrc,
  imageAlt,
  readMoreLabel,
  seeLessLabel,
  contentSections = [],
}: ProgramSectionCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasMoreContent = contentSections.length > 0;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="rounded-3xl border border-neutral-200 bg-white/70 p-8 shadow-sm transition-shadow hover:shadow-lg backdrop-blur"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <h2 id={`${id}-heading`} className="text-3xl font-bold text-neutral-900">
            {title}
          </h2>
          <p className="mt-4 text-base text-neutral-700">{summary}</p>

          {highlights.length > 0 && (
            <ul className="mt-6 space-y-2 text-sm text-neutral-700">
              {highlights.map((highlight, index) => (
                <li key={`highlight-${index}`} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          )}

          {hasMoreContent && (
            <div className="mt-6">
              <Button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="bg-brand-primary text-white hover:bg-brand-primary-dark"
              >
                {isOpen ? seeLessLabel : readMoreLabel}
              </Button>
            </div>
          )}

          {hasMoreContent && isOpen && (
            <div className="mt-8 space-y-6 text-sm text-neutral-700">
              {contentSections.map((content, idx) => (
                <div key={`content-${idx}`} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  {content.heading && (
                    <h3 className="text-lg font-semibold text-neutral-900">{content.heading}</h3>
                  )}
                  {content.paragraphs &&
                    content.paragraphs.map((paragraph, paragraphIdx) => (
                      <p key={`paragraph-${idx}-${paragraphIdx}`} className="mt-4">
                        {paragraph}
                      </p>
                    ))}
                  {content.listTitle && (
                    <p className="mt-6 text-sm font-semibold text-neutral-900">
                      {content.listTitle}
                    </p>
                  )}
                  {content.list && (
                    <ul className="mt-3 space-y-2">
                      {content.list.map((item, itemIdx) => (
                        <li key={`item-${idx}-${itemIdx}`} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {content.closing && <p className="mt-4">{content.closing}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative mx-auto h-64 w-full max-w-sm overflow-hidden rounded-3xl bg-neutral-100 shadow">
          <Image src={imageSrc} alt={imageAlt || title} fill className="object-contain p-6" />
        </div>
      </div>
    </section>
  );
}
