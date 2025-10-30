import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import TeacherQuickActions, {
  type QuickAction,
} from "@/components/teacher/dashboard/TeacherQuickActions";
import type { Database } from "@/lib/database.types";

import {
  loadTeacherDashboardData,
  numberFormatter,
} from "./dashboardData";

const quickActions: QuickAction[] = [
  {
    title: "Assign assessment",
    description: "Create or reuse an assessment for one of your classes.",
    href: "/assessment",
  },
  {
    title: "Message classes",
    description: "Send reminders or celebrate wins with targeted notes.",
    href: "mailto:info@zeta-eng.co.kr?subject=Zeta%20Teacher%20Update",
    external: true,
  },
  {
    title: "Book consultation",
    description: "Coordinate planning time or a speaking workshop.",
    href: "/teacher/communications",
  },
];

const TeacherOverviewPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const data = await loadTeacherDashboardData(
    supabase as unknown as Parameters<typeof loadTeacherDashboardData>[0],
    user.id,
  );

  const {
    summaryCards,
    assignmentList,
    activeAssignmentsCount,
    reviewQueue,
    outstandingReviewsCount,
    classRosterSummary,
    totals,
  } = data;

  const nextAssignments = assignmentList.slice(0, 3);
  const nextReviews = reviewQueue.slice(0, 3);
  const primaryClass = classRosterSummary[0];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-teacher-primary-text">Classroom insights</h1>
          <p className="text-sm text-neutral-muted">
            Monitor progress, jump into grading, and keep every class supported in one place.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col justify-between rounded-3xl border border-teacher-primary/10 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="text-xs uppercase tracking-[0.4em] text-teacher-primary-text/60">
                {card.title}
              </div>
              <div className="py-4 text-4xl font-semibold text-teacher-primary-text">{card.value}</div>
              <p className="text-sm font-medium text-teacher-primary-text/80">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <TeacherQuickActions actions={quickActions} />

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
          <header className="flex items-start justify-between gap-3 border-b border-teacher-primary/10 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-teacher-primary-text">Assessments in motion</h2>
              <p className="text-xs text-neutral-muted">
                {activeAssignmentsCount > 0
                  ? `${numberFormatter.format(activeAssignmentsCount)} tests underway right now`
                  : "No live assessments at the moment"}
              </p>
            </div>
            <Link
              href="/teacher/assessments"
              className="text-xs font-semibold uppercase tracking-widest text-teacher-primary-text transition hover:text-teacher-primary-text/80"
            >
              Open assessments
            </Link>
          </header>
          {nextAssignments.length === 0 ? (
            <div className="px-6 py-6 text-sm text-neutral-muted">
              Assign a new assessment to see live progress here.
            </div>
          ) : (
            <ul className="divide-y divide-teacher-primary/10 px-6 py-4 text-sm text-neutral-800">
              {nextAssignments.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="font-semibold text-teacher-primary-text">{item.studentName}</p>
                  <p className="text-xs uppercase tracking-widest text-neutral-muted">
                    Status: {(item.status ?? "assigned").replace(/_/g, " ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
          <header className="flex items-start justify-between gap-3 border-b border-teacher-primary/10 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-teacher-primary-text">Gradebook follow-up</h2>
              <p className="text-xs text-neutral-muted">
                {outstandingReviewsCount > 0
                  ? `${numberFormatter.format(outstandingReviewsCount)} submissions waiting for review`
                  : "All assessments graded — great job!"}
              </p>
            </div>
            <Link
              href="/teacher/gradebook"
              className="text-xs font-semibold uppercase tracking-widest text-teacher-primary-text transition hover:text-teacher-primary-text/80"
            >
              Go to gradebook
            </Link>
          </header>
          {nextReviews.length === 0 ? (
            <div className="px-6 py-6 text-sm text-neutral-muted">
              Students will appear here as they complete assessments.
            </div>
          ) : (
            <ul className="divide-y divide-teacher-primary/10 px-6 py-4 text-sm text-neutral-800">
              {nextReviews.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="font-semibold text-teacher-primary-text">{item.studentName}</p>
                  <p className="text-xs uppercase tracking-widest text-neutral-muted">
                    Score: {item.score != null ? `${item.score}%` : "Pending"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
          <header className="flex items-start justify-between gap-3 border-b border-teacher-primary/10 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-teacher-primary-text">Class coverage</h2>
              <p className="text-xs text-neutral-muted">
                {totals.classesCount > 0
                  ? `${totals.classesCount === 1 ? "1 class" : `${totals.classesCount} classes`} and ${numberFormatter.format(
                      totals.totalStudents,
                    )} students assigned`
                  : "No classes are linked to your account yet"}
              </p>
            </div>
            <Link
              href="/teacher/classes"
              className="text-xs font-semibold uppercase tracking-widest text-teacher-primary-text transition hover:text-teacher-primary-text/80"
            >
              View classes
            </Link>
          </header>
          {primaryClass ? (
            <div className="px-6 py-6 text-sm text-neutral-800">
              <p className="font-semibold text-teacher-primary-text">{primaryClass.className}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-neutral-muted">
                {primaryClass.level ? `Level ${primaryClass.level}` : "Mixed level"} •{" "}
                {numberFormatter.format(primaryClass.studentCount)} students
              </p>
            </div>
          ) : (
            <div className="px-6 py-6 text-sm text-neutral-muted">
              Reach out to an admin to connect your classes.
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
          <header className="flex items-start justify-between gap-3 border-b border-teacher-primary/10 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-teacher-primary-text">Keep everyone in sync</h2>
              <p className="text-xs text-neutral-muted">
                Share updates or coordinate support without leaving the dashboard.
              </p>
            </div>
            <Link
              href="/teacher/communications"
              className="text-xs font-semibold uppercase tracking-widest text-teacher-primary-text transition hover:text-teacher-primary-text/80"
            >
              Open messaging
            </Link>
          </header>
          <div className="px-6 py-6 text-sm text-neutral-muted">
            Draft announcements, contact support, or log outreach all in one place.
          </div>
        </article>
      </section>
    </main>
  );
};

export default TeacherOverviewPage;
