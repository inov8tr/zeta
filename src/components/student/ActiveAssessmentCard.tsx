import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import StartTestButton from "@/components/student/StartTestButton";

type ActiveStatus = "assigned" | "in_progress";

export interface ActiveAssessmentCardProps {
  test: {
    id: string;
    type: string | null;
    status: ActiveStatus;
    assigned_at: string | null;
    time_limit_seconds: number | null;
    elapsed_ms: number | null;
  };
}

function formatRemainingTime(timeLimitSeconds: number | null, elapsedMs: number | null) {
  if (!timeLimitSeconds) return null;
  const totalMs = timeLimitSeconds * 1000;
  const remaining = Math.max(0, totalMs - (elapsedMs ?? 0));
  if (remaining <= 0) return "Time limit reached";
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  if (minutes === 0) {
    return `${seconds}s remaining`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s remaining`;
}

export default function ActiveAssessmentCard({ test }: ActiveAssessmentCardProps) {
  const friendlyType = test.type === "entrance" ? "Entrance Test" : test.type ?? "Assessment";
  const assignedLabel = test.assigned_at
    ? formatDistanceToNow(new Date(test.assigned_at), { addSuffix: true })
    : "recently";
  const remaining = formatRemainingTime(test.time_limit_seconds, test.elapsed_ms);

  return (
    <section className="h-full rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-brand-primary/70">{friendlyType}</p>
        <h2 className="text-2xl font-semibold text-brand-primary-dark">
          {test.status === "in_progress" ? "Continue your assessment" : "Your assessment is ready"}
        </h2>
        <p className="text-sm text-neutral-muted">Assigned {assignedLabel}</p>
      </header>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              {test.status === "in_progress" ? "⏱" : "🚀"}
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-primary/60">
                {test.status === "in_progress" ? "Time remaining" : "Helpful prep"}
              </p>
              <p className="text-sm font-semibold text-brand-primary-dark">
                {test.status === "in_progress"
                  ? remaining ?? "Unlimited time"
                  : "Review the prep resources before you begin."}
              </p>
            </div>
          </div>
          <p className="text-sm text-neutral-muted">
            Need a break? You can pause anytime. Your progress is saved automatically.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <StartTestButton testId={test.id} status={test.status} />
          <Link
            href="/resources/prep"
            className="inline-flex items-center rounded-full border border-brand-primary/30 px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:border-brand-primary hover:text-brand-primary-dark"
          >
            Review tips
          </Link>
        </div>
      </div>
    </section>
  );
}

