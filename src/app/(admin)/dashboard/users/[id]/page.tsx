import type { ReactNode } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { format, formatDistanceStrict } from "date-fns";

import { Database } from "@/lib/database.types";
import AssignTestButton from "@/components/admin/AssignTestButton";
import VerifyUserButton from "@/components/admin/VerifyUserButton";
import ArchiveToggleButton from "@/components/admin/ArchiveToggleButton";
import SendSurveyInviteButton from "@/components/admin/SendSurveyInviteButton";
import EditSurveyButton from "@/components/admin/EditSurveyButton";
import PrintButton from "@/components/dashboard/PrintButton";
import { createAdminClient } from "@/lib/supabaseAdmin";
import type { ParentSurveyForm } from "@/app/(public)/survey/shared";
import { generateEntranceFeedback, type EntranceFeedbackInput } from "@/lib/feedback/generateEntranceFeedback";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileWithRelations = ProfileRow & {
  classes: { name: string; level: string | null } | { name: string; level: string | null }[] | null;
};
type TestRow = Database["public"]["Tables"]["tests"]["Row"];
type StudentMetaRow = Database["public"]["Tables"]["students"]["Row"];
type ParentSurveyRow = Database["public"]["Tables"]["parent_surveys"]["Row"];
type EntranceFeedbackRow = Database["public"]["Tables"]["entrance_feedback"]["Row"];

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

const parseIntervalToMilliseconds = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const millisMatch = trimmed.match(/(-?\d+(?:\.\d+)?)\s*milliseconds?/i);
  if (millisMatch) {
    return Math.round(Number.parseFloat(millisMatch[1]));
  }
  const hmsMatch = trimmed.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (hmsMatch) {
    const hours = Number.parseInt(hmsMatch[1] ?? "0", 10);
    const minutes = Number.parseInt(hmsMatch[2] ?? "0", 10);
    const seconds = Number.parseInt(hmsMatch[3] ?? "0", 10);
    const fraction = hmsMatch[4] ? Number.parseFloat(`0.${hmsMatch[4]}`) : 0;
    return Math.round(((hours * 60 + minutes) * 60 + seconds + fraction) * 1000);
  }
  return null;
};

const formatDurationFromMs = (value: number | null) => {
  if (value == null || Number.isNaN(value) || value <= 0) {
    return "—";
  }
  const base = new Date(0);
  const target = new Date(value);
  return formatDistanceStrict(base, target, { roundingMethod: "ceil" });
};

const percentLabel = (value: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value)}%`;
};

const FEEDBACK_SECTIONS = ["grammar", "reading", "listening", "dialog"] as const;

type EntranceFeedbackCardRecord = {
  estimated_level: number | null;
  total_score: number | null;
  accuracy: number | null;
  time_ms: number | null;
  created_at: string | null;
  source: "stored" | "derived";
  band: string | null;
  lexile: string | null;
  cefr: string | null;
  korean_equiv: string | null;
  us_equiv: string | null;
  narrative: string | null;
  feedback_text: string | null;
};

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
    .select("id, type, status, total_score, weighted_level, assigned_at, completed_at")
    .eq("student_id", id)
    .order("assigned_at", { ascending: false })
    .returns<TestRow[]>();


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
  const entranceFeedbackPromise = admin
    .from("entrance_feedback")
    .select(
      "id, test_id, estimated_level, total_score, accuracy, time_spent, grammar_score, reading_score, listening_score, dialog_score, feedback_text, created_at"
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<EntranceFeedbackRow>();

  const [testsResult, authUserResult, studentMetaResult, parentSurveyResult, entranceFeedbackResult] = await Promise.all([
    testsPromise,
    authUserPromise,
    studentMetaPromise,
    parentSurveyPromise,
    entranceFeedbackPromise,
  ]);

  const { data: authUserData } = authUserResult;
  const authUser = authUserData?.user ?? null;
  const emailConfirmed = Boolean(authUser?.email_confirmed_at);
  const emailAddress = authUser?.email ?? null;

  const tests = (testsResult.data as TestRow[] | null) ?? [];
  const studentMeta = (studentMetaResult.data as StudentMetaRow | null) ?? null;
  const parentSurvey = (parentSurveyResult.data as ParentSurveyRow | null) ?? null;
  const surveyCompleted = studentMeta?.survey_completed ?? false;
  const surveySubmittedAt = parentSurvey?.created_at ?? null;
  const surveyForm = (parentSurvey?.data as ParentSurveyForm | null) ?? null;
  const entranceFeedback = (entranceFeedbackResult.data as EntranceFeedbackRow | null) ?? null;

  const entranceTests = tests
    .filter((test) => test.type === "entrance")
    .sort((a, b) => {
      const aDate = new Date(a.completed_at ?? a.assigned_at ?? a.started_at ?? 0).getTime();
      const bDate = new Date(b.completed_at ?? b.assigned_at ?? b.started_at ?? 0).getTime();
      return bDate - aDate;
    });

  const latestCompletedEntranceTest = entranceTests.find((test) => test.status === "completed") ?? null;

  let entranceFeedbackCardData:
    | {
        feedback: ReturnType<typeof generateEntranceFeedback>;
        record: EntranceFeedbackCardRecord;
        test: TestRow | null;
      }
    | null = null;

  if (entranceFeedback) {
    const storedTimeMs = parseIntervalToMilliseconds(entranceFeedback.time_spent);
    const sectionScores: EntranceFeedbackInput["sectionScores"] = {};

    FEEDBACK_SECTIONS.forEach((section) => {
      const scoreValue =
        section === "grammar"
          ? entranceFeedback.grammar_score
          : section === "reading"
          ? entranceFeedback.reading_score
          : section === "listening"
          ? entranceFeedback.listening_score
          : entranceFeedback.dialog_score;

      sectionScores[section] = { score: scoreValue ?? null, level: null };
    });

    const associatedTest = tests.find((test) => test.id === entranceFeedback.test_id) ?? latestCompletedEntranceTest;
    const levelFromTest = associatedTest?.weighted_level ?? null;
    const estimatedLevel = entranceFeedback.estimated_level ?? levelFromTest;

    const generated = generateEntranceFeedback({
      studentName: profile?.full_name ?? null,
      level: estimatedLevel,
      totalScore: entranceFeedback.total_score,
      accuracy: entranceFeedback.accuracy,
      timeSpentMs: storedTimeMs,
      sectionScores,
    });

    entranceFeedbackCardData = {
      feedback: generated,
      record: {
        estimated_level: estimatedLevel,
        total_score: entranceFeedback.total_score,
        accuracy: entranceFeedback.accuracy,
        time_ms: storedTimeMs,
        created_at: entranceFeedback.created_at,
        source: "stored",
        band: entranceFeedback.band ?? generated.levelBand,
        lexile: entranceFeedback.lexile ?? generated.lexile,
        cefr: entranceFeedback.cefr ?? generated.cefr,
        korean_equiv: entranceFeedback.korean_equiv ?? generated.koreanEquivalent,
        us_equiv: entranceFeedback.us_equiv ?? generated.usEquivalent,
        narrative: generated.narrative,
        feedback_text: generated.feedbackText,
      },
      test: associatedTest ?? null,
    };
  } else if (latestCompletedEntranceTest) {
    const { data: derivedSectionsData, error: derivedSectionsError } = await admin
      .from("test_sections")
      .select("section, correct_count, questions_served, final_level")
      .eq("test_id", latestCompletedEntranceTest.id);

    if (!derivedSectionsError && derivedSectionsData) {
      const sectionScores: EntranceFeedbackInput["sectionScores"] = {};
      let totalCorrect = 0;
      let totalServed = 0;
      const levelValues: number[] = [];

      FEEDBACK_SECTIONS.forEach((section) => {
        const row = (derivedSectionsData as Array<{ section: string; correct_count: number; questions_served: number; final_level: number | null }>).find(
          (item) => item.section === section,
        );
        const served = row?.questions_served ?? 0;
        const correct = row?.correct_count ?? 0;
        totalServed += served;
        totalCorrect += correct;
        const score = served > 0 ? Math.round((correct / served) * 1000) / 10 : null;
        const finalLevel = row?.final_level ?? null;
        if (typeof finalLevel === "number" && !Number.isNaN(finalLevel)) {
          levelValues.push(finalLevel);
        }
        sectionScores[section] = { score, level: finalLevel };
      });

      const derivedAccuracy = totalServed > 0 ? (totalCorrect / totalServed) * 100 : null;
      const derivedLevel = levelValues.length > 0 ? Math.round((levelValues.reduce((sum, value) => sum + value, 0) / levelValues.length) * 10) / 10 : latestCompletedEntranceTest.weighted_level ?? null;

      const generated = generateEntranceFeedback({
        studentName: profile?.full_name ?? null,
        level: derivedLevel,
        totalScore: latestCompletedEntranceTest.total_score ?? null,
        accuracy: derivedAccuracy,
        timeSpentMs: latestCompletedEntranceTest.elapsed_ms ?? null,
        sectionScores,
      });

      entranceFeedbackCardData = {
        feedback: generated,
        record: {
          estimated_level: derivedLevel,
          total_score: latestCompletedEntranceTest.total_score ?? null,
          accuracy: derivedAccuracy,
          time_ms: latestCompletedEntranceTest.elapsed_ms ?? null,
          created_at: latestCompletedEntranceTest.completed_at ?? latestCompletedEntranceTest.assigned_at ?? null,
          source: "derived",
          band: generated.levelBand,
          lexile: generated.lexile,
          cefr: generated.cefr,
          korean_equiv: generated.koreanEquivalent,
          us_equiv: generated.usEquivalent,
          narrative: generated.narrative,
          feedback_text: generated.feedbackText,
        },
        test: latestCompletedEntranceTest,
      };
    }
  }

  const pastLearningLabels: Record<string, string> = {
    worksheet_program: "학습지",
    subject_academy: "단과학원",
    multi_subject_academy: "전과목(보습)학원",
    private_tutoring: "과외",
    other: "기타",
  };

  const academySubjectLabels: Record<string, string> = {
    korean: "국어",
    math: "수학",
    english: "영어",
    essay: "논술",
    all_subjects: "전과목",
    physical_education: "체육",
    music: "음악",
    other: "기타",
  };

  const academyCountLabels: Record<string, string> = {
    none: "없음",
    one: "1개",
    two: "2개",
    three: "3개",
    four_plus: "4개 이상",
  };

  const selfStudyLabels: Record<string, string> = {
    educational_broadcast: "교육방송",
    paid_online_course: "유료 인터넷 방송",
    reference_books: "참고서/문제집",
    class_review: "수업내용 예·복습",
    other: "기타",
  };

  const academyGoalLabels: Record<string, string> = {
    grade_improvement: "내신 성적 향상",
    additional_subject_learning: "기타 과목 학습",
    special_school_admission: "특목고/외고 진학",
    other: "기타",
  };

  const satisfactionLabels: Record<string, string> = {
    filled_gaps: "부족한 부분 채움",
    advanced_learning: "선행학습 진행",
    better_grades: "내신 상승",
    study_skills: "공부 방법 습득",
    reduced_home_alone_time: "혼자 있는 시간 감소",
  };

  const homeworkLabels: Record<string, string> = {
    none: "필요 없음",
    under_30_minutes: "30분 이내",
    under_60_minutes: "1시간 이내",
    over_60_minutes: "1시간 이상",
    other: "기타",
  };

  const discoveryLabels: Record<string, string> = {
    referral: "소개",
    advertisement: "광고",
    signage: "간판/현수막",
    other: "기타",
  };

  const formatList = (values?: string[], labels?: Record<string, string>) => {
    if (!values || values.length === 0) {
      return "—";
    }
    return values
      .map((value) => (labels && labels[value] ? labels[value] : value))
      .join(", ");
  };

  const formatSingle = (value?: string, labels?: Record<string, string>) => {
    if (!value) {
      return "—";
    }
    return labels && labels[value] ? labels[value] : value;
  };

  const formatListWithOther = (values: string[] | undefined, labels: Record<string, string>, other?: string) => {
    const base = formatList(values, labels);
    if (other && other.trim().length > 0) {
      return base === "—" ? other : `${base} (기타: ${other})`;
    }
    return base;
  };

  const formatSingleWithOther = (value: string | undefined, labels: Record<string, string>, other?: string) => {
    if (value === "other" && other && other.trim().length > 0) {
      return other;
    }
    return formatSingle(value, labels);
  };

  if (studentMetaResult.error && studentMetaResult.error.code !== "PGRST116") {
    console.error("Failed to load student metadata", studentMetaResult.error);
  }
  if (parentSurveyResult.error && parentSurveyResult.error.code !== "PGRST116") {
    console.error("Failed to load parent survey", parentSurveyResult.error);
  }
  if (entranceFeedbackResult.error && entranceFeedbackResult.error.code !== "PGRST116") {
    console.error("Failed to load entrance feedback", entranceFeedbackResult.error);
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

      {entranceFeedbackCardData ? (
        <EntranceFeedbackCard
          feedback={entranceFeedbackCardData.feedback}
          record={entranceFeedbackCardData.record}
          timeLabel={formatDurationFromMs(entranceFeedbackCardData.record.time_ms)}
          test={entranceFeedbackCardData.test}
        />
      ) : null}

      <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
        <header className="border-b border-brand-primary/10 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-brand-primary-dark">Parent Survey</h2>
            <EditSurveyButton studentId={id} hasSurvey={Boolean(surveyForm)} />
          </div>
        </header>
        <div className="px-6 py-4 text-sm text-neutral-800">
          {surveyForm ? (
            <div className="space-y-6">
              <dl className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <dt className="font-medium text-brand-primary-dark">작성일</dt>
                  <dd>{surveySubmittedAt ? format(new Date(surveySubmittedAt), "yyyy-MM-dd HH:mm") : "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">학부모 연락처</dt>
                  <dd>{surveyForm.parentContact || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">학생 전화번호</dt>
                  <dd>{surveyForm.studentPhone || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">학교 / 학년</dt>
                  <dd>
                    {surveyForm.school || "—"}{" "}
                    {surveyForm.grade ? <span className="text-neutral-muted">({surveyForm.grade})</span> : null}
                  </dd>
                </div>
                <div className="lg:col-span-2">
                  <dt className="font-medium text-brand-primary-dark">과거 영어 학습 이력</dt>
                  <dd>{formatListWithOther(surveyForm.pastLearningMethods, pastLearningLabels, surveyForm.pastLearningOther)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">현재 다니는 학원 수</dt>
                  <dd>{formatSingle(surveyForm.currentAcademyCount, academyCountLabels)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">현재 학원 과목</dt>
                  <dd>
                    {formatListWithOther(
                      surveyForm.currentAcademySubjects,
                      academySubjectLabels,
                      surveyForm.currentAcademySubjectsOther,
                    )}
                  </dd>
                </div>
                <div className="lg:col-span-2">
                  <dt className="font-medium text-brand-primary-dark">기존 학원 변경 이유</dt>
                  <dd>{surveyForm.reasonForChange || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">자기주도 학습 방법</dt>
                  <dd>{formatListWithOther(surveyForm.selfStudyMethods, selfStudyLabels, surveyForm.selfStudyOther)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">학원의 주목적</dt>
                  <dd>{formatSingleWithOther(surveyForm.academyGoal, academyGoalLabels, surveyForm.academyGoalOther)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">학원 만족 포인트</dt>
                  <dd>{formatList(surveyForm.satisfactionAreas, satisfactionLabels)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">희망 숙제량</dt>
                  <dd>{formatSingleWithOther(surveyForm.homeworkAmount, homeworkLabels, surveyForm.homeworkOther)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">영어 시험 최고 점수</dt>
                  <dd>{surveyForm.highestEnglishScore || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">주간 독서량</dt>
                  <dd>{surveyForm.weeklyReadingCount ? `${surveyForm.weeklyReadingCount}권` : "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">자신있는 과목</dt>
                  <dd>{surveyForm.strongestSubject || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">어려워하는 과목</dt>
                  <dd>{surveyForm.weakestSubject || "—"}</dd>
                </div>
                <div className="lg:col-span-2">
                  <dt className="font-medium text-brand-primary-dark">보완이 필요하다고 생각하는 부분</dt>
                  <dd>{surveyForm.perceivedGap || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">제타영어를 알게 된 경로</dt>
                  <dd>{formatSingleWithOther(surveyForm.discoveryChannel, discoveryLabels, surveyForm.discoveryOther)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-primary-dark">소개자</dt>
                  <dd>{surveyForm.discoveryReferrer || "—"}</dd>
                </div>
                <div className="lg:col-span-2">
                  <dt className="font-medium text-brand-primary-dark">기타 요청사항</dt>
                  <dd>{surveyForm.additionalNotes || "—"}</dd>
                </div>
              </dl>

              {surveyForm.schedules && surveyForm.schedules.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-brand-primary-dark">현재 다니는 학원 시간표</h3>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200">
                    <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-2 font-medium text-neutral-700">학원명</th>
                          <th className="px-4 py-2 font-medium text-neutral-700">요일</th>
                          <th className="px-4 py-2 font-medium text-neutral-700">등원</th>
                          <th className="px-4 py-2 font-medium text-neutral-700">하원</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {surveyForm.schedules.map((schedule) => (
                          <tr key={schedule.id}>
                            <td className="px-4 py-2">{schedule.academyName || "—"}</td>
                            <td className="px-4 py-2">{schedule.dayOfWeek || "—"}</td>
                            <td className="px-4 py-2">{schedule.startTime || "—"}</td>
                            <td className="px-4 py-2">{schedule.endTime || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-neutral-muted">학부모 설문이 아직 제출되지 않았습니다.</p>
          )}
        </div>
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

const EntranceFeedbackCard = ({
  feedback,
  record,
  timeLabel,
  test,
}: {
  feedback: ReturnType<typeof generateEntranceFeedback>;
  record: EntranceFeedbackCardRecord;
  timeLabel: string;
  test: TestRow | null;
}) => {
  const completedTimestamp = test?.completed_at ?? record.created_at;
  const completedLabel = completedTimestamp ? format(new Date(completedTimestamp), "PPp") : null;

  return (
    <section className="rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-brand-primary/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-primary-dark">Entrance test feedback</h2>
          <p className="text-xs text-neutral-muted">Automatically generated insights from the latest entrance assessment.</p>
        </div>
        <PrintButton />
      </header>
      <div className="space-y-6 px-6 py-6 text-sm text-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${
              record.source === "stored"
                ? "bg-brand-primary/10 text-brand-primary-dark"
                : "bg-brand-accent/20 text-brand-accent-dark"
            }`}
          >
            {record.source === "stored" ? "Saved summary" : "Preview from latest test"}
          </span>
          {completedLabel ? <span className="text-xs text-neutral-muted">Completed {completedLabel}</span> : null}
        </div>

        <div className="space-y-3">
          <p>{feedback.summary}</p>
          <ul className="list-disc space-y-1 pl-5 text-neutral-700">
            {feedback.advice.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricPill label="Level band" value={feedback.levelBand} />
          <MetricPill label="Korean grade approx." value={feedback.koreanEquivalent} />
          <MetricPill label="U.S. grade approx." value={feedback.usEquivalent} />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricPill label="Estimated level" value={record.estimated_level != null ? record.estimated_level.toFixed(1) : "—"} />
          <MetricPill label="Total score" value={percentLabel(record.total_score)} />
          <MetricPill label="Accuracy" value={percentLabel(record.accuracy)} />
          <MetricPill label="Time on task" value={timeLabel} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-4">
            <h3 className="text-sm font-semibold text-brand-primary-dark">Level mapping</h3>
            <dl className="mt-3 space-y-2 text-xs text-neutral-700">
              <div>
                <dt className="font-semibold text-brand-primary/80">Band</dt>
                <dd>{record.band ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-primary/80">Lexile</dt>
                <dd>{record.lexile ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-primary/80">CEFR</dt>
                <dd>{record.cefr ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-primary/80">Korean equivalent</dt>
                <dd>{record.korean_equiv ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-primary/80">U.S. equivalent</dt>
                <dd>{record.us_equiv ?? "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-brand-primary/10 bg-white/80 p-4">
            <h3 className="text-sm font-semibold text-brand-primary-dark">Narrative focus</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{record.narrative ?? feedback.narrative}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-primary/10 bg-white/90 p-4">
          <h3 className="text-sm font-semibold text-brand-primary-dark">Full feedback summary</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{record.feedback_text ?? feedback.feedbackText}</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-brand-primary/10">
          <table className="min-w-full divide-y divide-brand-primary/10 text-sm">
            <thead className="bg-brand-primary/5 text-xs uppercase tracking-wide text-brand-primary">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Section</th>
                <th className="px-6 py-3 text-left font-semibold">Score</th>
                <th className="px-6 py-3 text-left font-semibold">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/10">
              {feedback.sectionSummaries.map((row) => (
                <tr key={row.section} className="hover:bg-brand-primary/10">
                  <td className="px-6 py-3 font-medium text-brand-primary-dark">{row.label}</td>
                  <td className="px-6 py-3 text-neutral-800">{row.score}</td>
                  <td className="px-6 py-3 text-neutral-800">{row.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 text-xs text-neutral-muted md:flex-row md:items-center md:justify-between">
          <div>
            {test?.type ? <span>Test type: {test.type}</span> : null}
          </div>
          <Link href="/dashboard/tests" className="text-xs font-semibold text-brand-primary hover:underline print:hidden">
            View test history →
          </Link>
        </div>
      </div>
    </section>
  );
};

const MetricPill = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-brand-primary/10 bg-brand-primary/5 px-4 py-3">
    <div className="text-[10px] font-semibold uppercase tracking-widest text-brand-primary/70">{label}</div>
    <div className="mt-1 text-base font-semibold text-brand-primary-dark">{value}</div>
  </div>
);

export default UserDetailPage;
