import type { ReactNode } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

import { Database } from "@/lib/database.types";
import AssignTestButton from "@/components/admin/AssignTestButton";
import VerifyUserButton from "@/components/admin/VerifyUserButton";
import ArchiveToggleButton from "@/components/admin/ArchiveToggleButton";
import SendSurveyInviteButton from "@/components/admin/SendSurveyInviteButton";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/Button";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileWithRelations = ProfileRow & {
  classes: { name: string; level: string | null } | { name: string; level: string | null }[] | null;
};
type TestRow = Database["public"]["Tables"]["tests"]["Row"];
type ConsultationRow = Database["public"]["Tables"]["consultations"]["Row"];
type StudentMetaRow = Database["public"]["Tables"]["students"]["Row"];
type ParentSurveyRow = Database["public"]["Tables"]["parent_surveys"]["Row"];

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

const UserDetailPage = async ({ params }: UserDetailPageProps) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const admin = createAdminClient();

  let archivingEnabled = true;
  const profileQuery = supabase
    .from("profiles")
    .select("user_id, full_name, username, role, phone, class_id, test_status, archived, archived_at, classes(name, level)")
    .eq("user_id", id)
    .maybeSingle<ProfileWithRelations>();

  let { data: profile, error: profileError } = await profileQuery;

  if (profileError && profileError.message?.toLowerCase().includes("archived")) {
    archivingEnabled = false;
    const fallback = await supabase
      .from("profiles")
      .select("user_id, full_name, username, role, phone, class_id, test_status, classes(name, level)")
      .eq("user_id", id)
      .maybeSingle<ProfileWithRelations>();
    profile = fallback.data;
    profileError = fallback.error;
  }

  const testsPromise = supabase
    .from("tests")
    .select("id, type, status, total_score, assigned_at, completed_at")
    .eq("student_id", id)
    .order("assigned_at", { ascending: false })
    .returns<TestRow[]>();

  const consultationsPromise = supabase
    .from("consultations")
    .select("id, status, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .returns<ConsultationRow[]>();

  const authUserPromise = admin.auth.admin.getUserById(id);
  const studentMetaPromise = admin
    .from("students")
    .select("id, student_name, parent_email, survey_completed, survey_token, survey_token_expiry")
    .eq("id", id)
    .maybeSingle<StudentMetaRow>();
  const parentSurveyPromise = admin
    .from("parent_surveys")
    .select("student_id, completed_by, created_at, data")
    .eq("student_id", id)
    .maybeSingle<ParentSurveyRow>();

  const [testsResult, consultationsResult, authUserResult, studentMetaResult, parentSurveyResult] = await Promise.all([
    testsPromise,
    consultationsPromise,
    authUserPromise,
    studentMetaPromise,
    parentSurveyPromise,
  ]);

  const { data: authUserData } = authUserResult;
  const authUser = authUserData?.user ?? null;
  const emailConfirmed = Boolean(authUser?.email_confirmed_at);
  const emailAddress = authUser?.email ?? null;

  const tests = (testsResult.data as TestRow[] | null) ?? [];
  const consultations = (consultationsResult.data as ConsultationRow[] | null) ?? [];
  const studentMeta = (studentMetaResult.data as StudentMetaRow | null) ?? null;
  const parentSurvey = (parentSurveyResult.data as ParentSurveyRow | null) ?? null;
  const surveyCompleted = studentMeta?.survey_completed ?? false;
  const surveySubmittedAt = parentSurvey?.created_at ?? null;
  const surveyToken = studentMeta?.survey_token ?? null;
  const adminSurveyLink =
    surveyToken != null
      ? `/survey?student_id=${encodeURIComponent(id)}&token=${encodeURIComponent(surveyToken)}&admin=true`
      : null;

  if (studentMetaResult.error && studentMetaResult.error.code !== "PGRST116") {
    console.error("Failed to load student metadata", studentMetaResult.error);
  }
  if (parentSurveyResult.error && parentSurveyResult.error.code !== "PGRST116") {
    console.error("Failed to load parent survey", parentSurveyResult.error);
  }

  
  if (profileError || !profile) {
    notFound();
  }

  const classData = Array.isArray(profile.classes) ? profile.classes[0] : profile.classes;
  const isArchived = archivingEnabled && (profile as ProfileWithRelations & { archived?: boolean }).archived ? true : false;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/dashboard/users" className="text-xs font-semibold uppercase text-brand-primary/60">
            ← Back to users
          </Link>
          <h1 className="text-3xl font-semibold text-brand-primary-dark">{profile.full_name ?? "Unnamed user"}</h1>
          <p className="flex flex-wrap items-center gap-3 text-sm text-neutral-muted">
            <span>
              Role: <span className="font-medium text-brand-primary-dark">{profile.role ?? "student"}</span>
            </span>
            {archivingEnabled && isArchived ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                Archived
              </span>
            ) : null}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-start gap-2 sm:mt-0 sm:justify-end">
          <Link
            href={`/dashboard/users/${id}/edit`}
            className="inline-flex items-center rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
          >
            Edit user
          </Link>
          {archivingEnabled && !isArchived ? <AssignTestButton studentId={id} /> : null}
          {archivingEnabled && !isArchived ? <VerifyUserButton userId={id} emailConfirmed={emailConfirmed} /> : null}
          {!isArchived ? (
            <SendSurveyInviteButton
              studentId={id}
              parentEmail={emailAddress}
              studentName={profile.full_name}
              revalidatePath={`/dashboard/users/${id}`}
            />
          ) : null}
          {adminSurveyLink ? (
            <Button asChild size="sm" variant="outline">
              <Link href={adminSurveyLink} target="_blank" rel="noreferrer">
                Fill survey
              </Link>
            </Button>
          ) : null}
          {archivingEnabled ? <ArchiveToggleButton userId={id} archived={isArchived} /> : null}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <DetailCard title="Contact">
          <dl className="space-y-2 text-sm text-neutral-800">
            <div>
              <dt className="font-medium text-brand-primary-dark">Username</dt>
              <dd>{profile.username ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-primary-dark">Email</dt>
              <dd className="flex items-center gap-2">
                <span>{emailAddress ?? "—"}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    emailConfirmed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {emailConfirmed ? "Verified" : "Pending"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-primary-dark">Phone</dt>
              <dd>{profile.phone ?? "—"}</dd>
            </div>
            {archivingEnabled && isArchived ? (
              <div>
                <dt className="font-medium text-brand-primary-dark">Archived on</dt>
                <dd>{profile.archived_at ? format(new Date(profile.archived_at), "MMM d, yyyy") : "—"}</dd>
              </div>
            ) : null}
          </dl>
        </DetailCard>
        <DetailCard title="Assignments">
          <dl className="space-y-2 text-sm text-neutral-800">
            <div>
              <dt className="font-medium text-brand-primary-dark">Class</dt>
              <dd>{classData ? classData.name : "Unassigned"}</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-primary-dark">Test status</dt>
              <dd>{profile.test_status ?? "none"}</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-primary-dark">Parent survey</dt>
              <dd className="flex items-center gap-2">
                <span className={surveyCompleted ? "text-emerald-600" : "text-amber-600"}>
                  {surveyCompleted ? "Completed" : "Pending"}
                </span>
                {surveySubmittedAt ? (
                  <span className="text-xs text-neutral-muted">
                    {format(new Date(surveySubmittedAt), "MMM d, yyyy")}
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </DetailCard>
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Tests</h2>
        </header>
        <div className="divide-y divide-brand-primary/10">
          {tests.length === 0 ? (
            <EmptyRow message="No tests assigned yet." />
          ) : (
            tests.map((test) => (
              <article key={test.id} className="grid gap-3 px-6 py-4 text-sm text-neutral-800 sm:grid-cols-5">
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Type</div>
                  <div className="font-medium text-brand-primary-dark">{test.type}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Status</div>
                  <div>{test.status}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Assigned</div>
                  <div className="text-brand-primary-dark">
                    {test.assigned_at ? format(new Date(test.assigned_at), "MMM d, yyyy") : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-brand-primary/70">Score</div>
                  <div className="text-brand-primary-dark">{test.total_score ?? "Pending"}</div>
                </div>
                <div className="flex items-end justify-start sm:justify-end">
                  <Link
                    href={`/dashboard/result/${test.id}`}
                    className="inline-flex rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold uppercase text-white transition hover:bg-brand-primary-dark"
                  >
                    View
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-primary-dark">Consultation history</h2>
        </header>
        <div className="divide-y divide-brand-primary/10">
          {consultations.length === 0 ? (
            <EmptyRow message="No consultations recorded." />
          ) : (
            consultations.map((consultation) => (
              <article key={consultation.id} className="flex items-center justify-between px-6 py-4 text-sm text-neutral-800">
                <div>
                  <div className="font-medium text-brand-primary-dark">{consultation.status}</div>
                  <div className="text-xs text-neutral-muted">
                    {consultation.created_at ? format(new Date(consultation.created_at), "MMM d, yyyy p") : "—"}
                  </div>
                </div>
                <Link
                  href={`/dashboard/consultations`}
                  className="text-xs font-semibold uppercase text-brand-primary hover:text-brand-primary-dark"
                >
                  Manage
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
};

const DetailCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-brand-primary-dark">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
);

const EmptyRow = ({ message }: { message: string }) => (
  <div className="px-6 py-8 text-center text-sm text-neutral-muted">{message}</div>
);

export default UserDetailPage;
