"use client";

import { useState } from "react";

import { SectionPerformanceChart, type SectionPerformanceDatum } from "./SectionPerformanceChart";

interface Props {
  studentData: SectionPerformanceDatum[];
  classData?: SectionPerformanceDatum[] | null;
}

export const SectionPerformanceComparison = ({ studentData, classData }: Props) => {
  const hasClassData = Boolean(classData && classData.length);
  const [view, setView] = useState<"student" | "class">("student");

  const activeData = view === "class" && hasClassData ? classData ?? [] : studentData;

  return (
    <div className="space-y-4">
      {hasClassData ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-neutral-muted">
            Compare personal accuracy to the latest class average for each section.
          </div>
          <div className="flex items-center gap-2 rounded-full bg-brand-primary/10 p-1 text-xs font-semibold text-brand-primary">
            <button
              type="button"
              onClick={() => setView("student")}
              className={`rounded-full px-3 py-1 transition ${
                view === "student" ? "bg-white text-brand-primary-dark shadow" : "text-brand-primary"
              }`}
            >
              My score
            </button>
            <button
              type="button"
              onClick={() => setView("class")}
              className={`rounded-full px-3 py-1 transition ${
                view === "class" ? "bg-white text-brand-primary-dark shadow" : "text-brand-primary"
              }`}
            >
              Class avg
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-muted">
          We’ll show class averages here once multiple students in this cohort complete the test.
        </p>
      )}

      <SectionPerformanceChart data={activeData} />
    </div>
  );
};

