import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { numberFormatter, type ActiveAssignmentItem } from "@/app/teacher/dashboardData";

interface ActiveAssignmentListProps {
  items: ActiveAssignmentItem[];
  totalCount: number;
}

const ActiveAssignmentList = ({ items, totalCount }: ActiveAssignmentListProps) => (
  <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
    <header className="flex items-center justify-between border-b border-teacher-primary/10 px-6 py-4">
      <div>
        <h3 className="text-lg font-semibold text-teacher-primary-text">Active assignments</h3>
        <p className="text-xs text-neutral-muted">
          {totalCount > 0
            ? `${numberFormatter.format(totalCount)} test${totalCount === 1 ? "" : "s"} underway`
            : "No live assessments right now"}
        </p>
      </div>
    </header>
    {items.length === 0 ? (
      <div className="px-6 py-10 text-sm text-neutral-muted">
        When you assign new tests, progress will appear here.
      </div>
    ) : (
      <ul className="divide-y divide-teacher-primary/10">
        {items.map((item) => {
          const assignedLabel =
            item.assignedAt != null
              ? formatDistanceToNow(new Date(item.assignedAt), { addSuffix: true })
              : "Awaiting schedule";
          const statusLabel = (item.status ?? "assigned")
            .split("_")
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(" ");
          return (
            <li
              key={item.id}
              className="flex flex-col gap-1 px-6 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium text-teacher-primary-text">{item.studentName}</p>
                <p className="text-xs uppercase tracking-widest text-neutral-muted">
                  {statusLabel} • Assigned {assignedLabel}
                </p>
              </div>
              <Link
                href="/teacher/assessments"
                className="inline-flex items-center justify-center rounded-full border border-teacher-primary/30 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-teacher-primary-text transition hover:border-teacher-primary hover:bg-teacher-primary/10"
              >
                Monitor progress
              </Link>
            </li>
          );
        })}
      </ul>
    )}
  </article>
);

export default ActiveAssignmentList;
