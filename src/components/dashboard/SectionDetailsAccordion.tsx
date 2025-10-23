"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface SectionDetailItem {
  tag: string;
  accuracy: number;
  attempts: number;
  correct: number;
  averageTimeMs: number | null;
}

export interface SectionDetail {
  section: string;
  items: SectionDetailItem[];
}

const formatTime = (ms: number | null) => {
  if (!ms || ms <= 0) {
    return "—";
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining.toString().padStart(2, "0")}s`;
};

const accuracyColor = (value: number) => {
  if (value >= 80) {
    return "bg-emerald-500";
  }
  if (value >= 50) {
    return "bg-amber-500";
  }
  return "bg-rose-500";
};

const SectionDetailsAccordion = ({ sections }: { sections: SectionDetail[] }) => {
  const [expanded, setExpanded] = useState(false);

  if (!sections.length) {
    return null;
  }

  const sortedSections = [...sections]
    .map((section) => ({
      ...section,
      items: [...section.items].sort((a, b) => b.accuracy - a.accuracy),
    }))
    .sort((a, b) => a.section.localeCompare(b.section));

  return (
    <div className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-brand-primary-dark"
      >
        <span>Detailed Skill Breakdown</span>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {expanded ? (
        <div className="divide-y divide-brand-primary/10">
          {sortedSections.map((section) => (
            <div key={section.section} className="space-y-4 px-6 py-4 text-sm text-neutral-700">
              <div className="font-semibold text-brand-primary-dark">{section.section}</div>
              {section.items.length === 0 ? (
                <p className="text-xs text-neutral-muted">No tagged question types yet.</p>
              ) : (
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div key={`${section.section}-${item.tag}`} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span>{item.tag}</span>
                        <span className="text-sm font-semibold text-brand-primary-dark">{item.accuracy}%</span>
                      </div>
                      <div className="relative h-2 rounded-full bg-brand-primary/10">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${accuracyColor(item.accuracy)}`}
                          style={{ width: `${Math.min(Math.max(item.accuracy, 0), 100)}%` }}
                        />
                      </div>
                      <div className="grid gap-2 text-xs text-neutral-muted sm:grid-cols-3">
                        <div>
                          <span className="font-semibold text-brand-primary-dark">Questions:</span> {item.correct}/{item.attempts}
                        </div>
                        <div>
                          <span className="font-semibold text-brand-primary-dark">Avg. time:</span> {formatTime(item.averageTimeMs)}
                        </div>
                        <div>
                          <span className="font-semibold text-brand-primary-dark">Accuracy:</span> {item.accuracy}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SectionDetailsAccordion;

