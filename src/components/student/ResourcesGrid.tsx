"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Feedback = "helpful" | "not-helpful";

export interface StudentResource {
  title: string;
  description: string;
  href: string;
  category?: string;
}

interface ResourcesGridProps {
  resources: StudentResource[];
}

const STORAGE_KEY = "zeta-resource-feedback";

const ResourcesGrid = ({ resources }: ResourcesGridProps) => {
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setFeedback(JSON.parse(raw));
      }
    } catch (error) {
      console.warn("Failed to load resource feedback", error);
    }
  }, []);

  const recordFeedback = (href: string, value: Feedback) => {
    setFeedback((prev) => {
      const next = { ...prev, [href]: value };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.warn("Failed to persist resource feedback", error);
      }
      return next;
    });
  };

  const feedbackCount = useMemo(() => {
    return Object.values(feedback).reduce(
      (acc, value) => {
        acc[value] += 1;
        return acc;
      },
      { helpful: 0, "not-helpful": 0 } as Record<Feedback, number>,
    );
  }, [feedback]);

  if (!resources.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Recommended resources</h2>
      <p className="mt-2 text-sm text-neutral-muted">
        Build consistent practice with these teacher-approved lessons and activities.
      </p>
      <div className="mt-3 text-xs text-neutral-muted">
        <span className="mr-4">
          Marked helpful: <strong>{feedbackCount.helpful}</strong>
        </span>
        <span>
          Marked to review later: <strong>{feedbackCount["not-helpful"]}</strong>
        </span>
      </div>
      <ul className="mt-4 space-y-4">
        {resources.map((resource) => (
          <li key={resource.href} className="rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-brand-primary-dark">{resource.title}</p>
                {resource.category ? (
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase text-brand-primary shadow-sm">
                    {resource.category}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-neutral-muted">{resource.description}</p>
              <Link
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-semibold uppercase text-brand-primary transition hover:text-brand-primary-dark"
              >
                Open resource →
              </Link>
              <div className="flex flex-wrap gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => recordFeedback(resource.href, "helpful")}
                  className={`rounded-full border px-3 py-1 font-semibold uppercase transition ${
                    feedback[resource.href] === "helpful"
                      ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                      : "border-brand-primary/20 bg-white text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/10"
                  }`}
                >
                  Helpful
                </button>
                <button
                  type="button"
                  onClick={() => recordFeedback(resource.href, "not-helpful")}
                  className={`rounded-full border px-3 py-1 font-semibold uppercase transition ${
                    feedback[resource.href] === "not-helpful"
                      ? "border-amber-400 bg-amber-100 text-amber-700"
                      : "border-brand-primary/20 bg-white text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/10"
                  }`}
                >
                  Review later
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ResourcesGrid;
