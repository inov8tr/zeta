import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

interface TeacherQuickActionsProps {
  actions: QuickAction[];
}

const TeacherQuickActions = ({ actions }: TeacherQuickActionsProps) => (
  <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
    <header className="border-b border-teacher-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-teacher-primary-text">Quick actions</h2>
      <p className="text-xs text-neutral-muted">Launch the workflows you rely on throughout the week.</p>
    </header>
    <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
      {actions.map((action) => {
        const isExternal =
          (action.external ?? false) || action.href.startsWith("http") || action.href.startsWith("mailto:");
        return (
          <Link
            key={action.title}
            href={action.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="group flex flex-col justify-between rounded-2xl border border-transparent bg-teacher-primary/5 p-5 transition hover:border-teacher-primary/40 hover:bg-white hover:shadow-lg"
          >
            <div>
              <h3 className="text-base font-semibold text-teacher-primary-text">{action.title}</h3>
              <p className="mt-2 text-sm text-neutral-muted">{action.description}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-teacher-primary-text">
              Start
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </span>
          </Link>
        );
      })}
    </div>
  </article>
);

export type { QuickAction };
export default TeacherQuickActions;
