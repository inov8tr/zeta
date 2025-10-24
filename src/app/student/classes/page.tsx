import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { fetchClassroomOverview } from "@/lib/google/classroom";
import { formatDateTime } from "@/lib/formatDateTime";
import DisconnectClassroomButton from "@/components/student/DisconnectClassroomButton";

const connectHref = "/api/google/classroom/connect?redirect=/student/classes";

const StudentClassesPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/student/classes");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("classroom_enabled")
    .eq("user_id", user.id)
    .maybeSingle<{ classroom_enabled: boolean | null }>();

  if (!profile?.classroom_enabled) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-6 px-6 py-12">
        <header>
          <h1 className="text-3xl font-semibold text-brand-primary-dark">Classes</h1>
          <p className="mt-2 text-sm text-neutral-muted">
            The Classes tab has not been enabled for your account yet. Please contact your teacher if you think this is a
            mistake.
          </p>
        </header>
      </main>
    );
  }

  const overview = await fetchClassroomOverview(supabase, user.id);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Classes</h1>
        <p className="max-w-2xl text-sm text-neutral-muted">
          Connect Google Classroom to see your Zeta courses and upcoming assignments in one place.
        </p>
      </header>

      {!overview.connected ? (
        <section className="rounded-3xl border border-student-primary/20 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Google Classroom not connected</h2>
          <p className="mt-2 text-sm text-neutral-600">
            {overview.needsReconnect
              ? "Your Google Classroom connection expired. Reconnect below to sync your classes again."
              : "Connect with your Google Classroom account to load your courses, assignments, and due dates."}
          </p>
          {overview.error ? <p className="mt-3 text-sm text-red-600">{overview.error}</p> : null}
          <div className="mt-4">
            <Link
              href={connectHref}
              className="inline-flex items-center rounded-full bg-student-primary px-5 py-2 text-xs font-semibold uppercase text-white transition hover:bg-student-primary-light"
            >
              Connect Google Classroom
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-3xl border border-student-primary/20 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Connected to Google Classroom</h2>
                <p className="text-sm text-neutral-600">
                  Courses update automatically. Assignments with due dates coming soon appear below.
                </p>
              </div>
              <DisconnectClassroomButton />
            </div>
          </section>

          <section className="space-y-6">
            {overview.data.courses.length === 0 ? (
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
                No active courses were found in Google Classroom. Once your teacher adds you to a class, it will appear
                here.
              </div>
            ) : (
              overview.data.courses.map((course) => {
                const assignments = (overview.data.courseWork[course.id] ?? [])
                  .filter((item) => !item.state || item.state === "PUBLISHED")
                  .sort((a, b) => {
                    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    return aDue - bDue;
                  });

                return (
                  <article key={course.id} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">{course.name}</h3>
                        <p className="text-sm text-neutral-600">
                          {course.section ? `${course.section} • ` : ""}
                          {course.room ?? "Online"}
                        </p>
                      </div>
                      {course.alternateLink ? (
                        <a
                          href={course.alternateLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-student-primary/30 bg-student-primary/10 px-4 py-2 text-xs font-semibold uppercase text-student-primary transition hover:bg-student-primary/20"
                        >
                          Open in Classroom →
                        </a>
                      ) : null}
                    </div>

                    {assignments.length > 0 ? (
                      <ul className="mt-4 space-y-3 text-sm text-neutral-700">
                        {assignments.slice(0, 5).map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-col gap-1 rounded-2xl border border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium text-neutral-900">{item.title}</p>
                              <p className="text-xs text-neutral-500">
                                {item.dueDate
                                  ? `Due ${formatDateTime(item.dueDate, undefined, {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}`
                                  : "No due date posted"}
                              </p>
                            </div>
                            {item.alternateLink ? (
                              <a
                                href={item.alternateLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold uppercase text-student-primary transition hover:text-student-primary-light"
                              >
                                View assignment →
                              </a>
                            ) : null}
                          </li>
                        ))}
                        {assignments.length > 5 ? (
                          <li className="text-xs text-neutral-500">Showing 5 of {assignments.length} assignments.</li>
                        ) : null}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-neutral-600">
                        No upcoming assignments were found for this class.
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </section>
        </>
      )}
    </main>
  );
};

export default StudentClassesPage;
