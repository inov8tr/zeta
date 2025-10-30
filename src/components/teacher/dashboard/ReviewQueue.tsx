import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { decimalFormatter, type ReviewQueueItem } from "@/app/teacher/dashboardData";

interface ReviewQueueProps {
  items: ReviewQueueItem[];
  totalPending: number;
}

const ReviewQueue = ({ items, totalPending }: ReviewQueueProps) => (
  <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
    <header className="flex items-center justify-between border-b border-teacher-primary/10 px-6 py-4">
      <div>
        <h3 className="text-lg font-semibold text-teacher-primary-text">Review queue</h3>
        <p className="text-xs text-neutral-muted">
          {totalPending > 0
            ? `${totalPending} assessment${totalPending === 1 ? "" : "s"} waiting for feedback`
            : "All assessments reviewed — nice work!"}
        </p>
      </div>
    </header>
    {items.length === 0 ? (
      <div className="px-6 py-10 text-sm text-neutral-muted">
        Once students submit, you can release feedback from this inbox.
      </div>
    ) : (
      <ul className="divide-y divide-teacher-primary/10">
        {items.map((item) => {
          const reviewLabel =
            item.completedAt != null
              ? formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })
              : "Recently completed";
          return (
            <li key={item.id} className="flex flex-col gap-1 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-teacher-primary-text">{item.studentName}</p>
                <span className="text-sm font-semibold text-teacher-primary-text">
                  {item.score != null ? `${decimalFormatter.format(item.score)}%` : "Score pending"}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs uppercase tracking-widest text-neutral-muted">
                  Awaiting review • Completed {reviewLabel}
                </p>
                <Link
                  href="/teacher/gradebook"
                  className="inline-flex items-center justify-center rounded-full border border-teacher-primary/30 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-teacher-primary-text transition hover:border-teacher-primary hover:bg-teacher-primary/10"
                >
                  Start review
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </article>
);

export default ReviewQueue;
