import Link from "next/link";

interface WelcomeCardProps {
  fullName: string;
  testStatus: string | null;
  className?: string | null;
}

const statusCopy: Record<string, { label: string; description: string }> = {
  none: {
    label: "Getting Started",
    description: "Work with your teacher to schedule your first assessment.",
  },
  assigned: {
    label: "Assessment Assigned",
    description: "You have an assessment waiting. Start when you feel ready.",
  },
  in_progress: {
    label: "Assessment In Progress",
    description: "Continue your test when you’re ready to finish.",
  },
  completed: {
    label: "Assessment Completed",
    description: "Great work! Review your results and next steps.",
  },
  reviewed: {
    label: "Assessment Reviewed",
    description: "Check your feedback and upcoming recommendations.",
  },
};

const WelcomeCard = ({ fullName, testStatus, className }: WelcomeCardProps) => {
  const normalizedStatus = (testStatus ?? "none").toLowerCase();
  const copy = statusCopy[normalizedStatus] ?? statusCopy.none;

  return (
    <section className="rounded-3xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary/5 via-white to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-primary/80">Welcome back</p>
          <h1 className="mt-1 text-3xl font-semibold text-brand-primary-dark">{fullName}</h1>
          <p className="mt-2 text-sm text-neutral-muted">
            {copy.description}
            {className ? ` Your current class: ${className}.` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <span className="text-sm font-semibold">{copy.label.slice(0, 2)}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-primary/60">Status</p>
            <p className="text-sm font-semibold text-brand-primary-dark">{copy.label}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-brand-primary">
        <Link
          href="/resources/prep"
          className="inline-flex items-center rounded-full border border-brand-primary/30 px-4 py-2 text-xs font-semibold uppercase text-brand-primary transition hover:border-brand-primary hover:text-brand-primary-dark"
        >
          Review prep resources
        </Link>
        <Link
          href="/enrollment"
          className="inline-flex items-center rounded-full border border-transparent bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
        >
          Request support
        </Link>
      </div>
    </section>
  );
};

export default WelcomeCard;
