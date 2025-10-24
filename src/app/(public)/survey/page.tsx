import ParentSurveyFormClient from "./ParentSurveyFormClient";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createEmptyForm, createScheduleRow, ParentSurveyForm } from "./shared";

const normalizeSurveyData = (raw: Partial<ParentSurveyForm> | null | undefined, studentName: string): ParentSurveyForm => {
  const base = createEmptyForm();
  base.studentName = studentName;

  if (!raw) {
    return base;
  }

  const merged: ParentSurveyForm = {
    ...base,
    ...raw,
    studentName: raw.studentName ?? studentName,
  };

  merged.schedules =
    raw.schedules && Array.isArray(raw.schedules) && raw.schedules.length > 0
      ? raw.schedules.map((schedule) => ({
          ...schedule,
          id: schedule?.id ?? createScheduleRow().id,
          academyName: schedule?.academyName ?? "",
          dayOfWeek: schedule?.dayOfWeek ?? "",
          startTime: schedule?.startTime ?? "",
          endTime: schedule?.endTime ?? "",
        }))
      : base.schedules;

  return merged;
};

const getSingleParam = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const ErrorMessage = ({ message }: { message: string }) => (
  <main className="mx-auto max-w-3xl px-4 py-16">
    <div className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="text-2xl font-semibold text-red-700">설문을 열 수 없습니다</h1>
      <p className="text-sm text-red-600">{message}</p>
    </div>
  </main>
);

type SurveySearchParams = { [key: string]: string | string[] | undefined };

const ParentSurveyPage = async ({ searchParams }: { searchParams?: Promise<SurveySearchParams> }) => {
  const resolvedSearchParams = (searchParams ? await searchParams : undefined) ?? {};
  const studentId = getSingleParam(resolvedSearchParams.student_id);
  const token = getSingleParam(resolvedSearchParams.token);
  const isAdmin = getSingleParam(resolvedSearchParams.admin) === "true";

  if (!studentId || !token) {
    return <ErrorMessage message="잘못된 설문 링크입니다." />;
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, student_name, survey_token, survey_token_expiry, survey_completed")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError || !student) {
    return <ErrorMessage message="학생 정보를 찾을 수 없습니다." />;
  }

  if (student.survey_token !== token) {
    return <ErrorMessage message="유효하지 않은 설문 링크입니다." />;
  }

  if (student.survey_token_expiry && new Date(student.survey_token_expiry) < new Date()) {
    return <ErrorMessage message="설문 링크가 만료되었습니다. 관리자에게 새로운 링크를 요청해 주세요." />;
  }

  const { data: surveyData } = await admin
    .from("parent_surveys")
    .select("data")
    .eq("student_id", studentId)
    .maybeSingle();

  const initialForm = normalizeSurveyData(
    (surveyData?.data as Partial<ParentSurveyForm> | null | undefined) ?? null,
    student.student_name ?? "",
  );

  return (
    <ParentSurveyFormClient
      studentId={studentId}
      token={token}
      isAdmin={isAdmin}
      initialData={initialForm}
    />
  );
};

export default ParentSurveyPage;
