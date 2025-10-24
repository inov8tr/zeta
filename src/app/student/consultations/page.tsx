import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { formatDateTime } from "@/lib/formatDateTime";
import StudentConsultationScheduler from "@/components/student/ConsultationScheduler";

type ConsultationRow = Pick<
  Database["public"]["Tables"]["consultations"]["Row"],
  "id" | "status" | "preferred_start" | "preferred_end" | "timezone" | "notes" | "created_at"
>;

type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "phone">;

const STATUS_BADGE: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", tone: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", tone: "bg-red-100 text-red-600" },
};

const StudentConsultationsPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const consultationsPromise = supabase
    .from("consultations")
    .select("id, status, preferred_start, preferred_end, timezone, notes, created_at")
    .eq("user_id", user.id)
    .order("preferred_start", { ascending: true })
    .returns<ConsultationRow[]>();

  const profilePromise = supabase
    .from("profiles")
    .select("phone")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  const [consultationsResult, profileResult] = await Promise.all([consultationsPromise, profilePromise]);

  const consultations = (consultationsResult.data ?? []) as ConsultationRow[];
  const error = consultationsResult.error;
  const profile = profileResult.data ?? null;

  const now = Date.now();
  const upcoming = consultations.filter((consultation) => {
    if (!consultation.preferred_start || consultation.status === "cancelled") {
      return false;
    }
    const start = new Date(consultation.preferred_start).getTime();
    return Number.isFinite(start) && start >= now;
  });
  const past = consultations.filter((consultation) => !upcoming.includes(consultation));
  const hasUpcoming = upcoming.length > 0;
  const nextConsultation = upcoming[0] ?? null;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Consultations</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-muted">
          Keep track of your scheduled meetings, Zoom links, and notes from previous consultations.
        </p>
      </header>

      {error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          We couldn&rsquo;t load your consultation schedule. Please refresh or contact support if this continues.
        </section>
      ) : null}

      <StudentConsultationScheduler
        hasUpcoming={hasUpcoming}
        existingConsultation={
          nextConsultation
            ? {
                status: nextConsultation.status,
                preferred_start: nextConsultation.preferred_start,
                preferred_end: nextConsultation.preferred_end,
              }
            : null
        }
        contactPhone={profile?.phone ?? undefined}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Upcoming</h2>
        {upcoming.length > 0 ? (
          <ul className="space-y-3">
            {upcoming.map((consultation) => {
              const badge = STATUS_BADGE[consultation.status] ?? STATUS_BADGE.pending;
              const start = formatDateTime(consultation.preferred_start, consultation.timezone);
              const end = formatDateTime(consultation.preferred_end, consultation.timezone);
              return (
                <li key={consultation.id} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{start ?? "Scheduling soon"}</p>
                      {end ? <p className="text-xs text-neutral-500">Approx. until {end}</p> : null}
                      {consultation.notes ? (
                        <p className="mt-3 text-sm text-neutral-600">Notes: {consultation.notes}</p>
                      ) : null}
                    </div>
                    <span
                      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.tone}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm text-sm text-neutral-600">
            No upcoming consultations yet. Once your teacher schedules one, it will appear here with joining details.
          </section>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">History</h2>
        {past.length > 0 ? (
          <ul className="space-y-3 text-sm text-neutral-700">
            {past.map((consultation) => {
              const badge =
                consultation.status === "cancelled"
                  ? STATUS_BADGE.cancelled
                  : consultation.status === "confirmed"
                    ? STATUS_BADGE.confirmed
                    : STATUS_BADGE.pending;
              return (
                <li
                  key={consultation.id}
                  className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{formatDateTime(consultation.preferred_start, consultation.timezone) ?? "Previously scheduled"}</p>
                    <p className="text-xs text-neutral-500">
                      Created {formatDateTime(consultation.created_at) ?? "recently"}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm text-sm text-neutral-600">
            You haven&rsquo;t completed any consultations yet. We&rsquo;ll keep track of them here once you do.
          </section>
        )}
      </section>
    </main>
  );
};

export default StudentConsultationsPage;
