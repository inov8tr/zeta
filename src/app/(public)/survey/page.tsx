"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/card";

export type ParentSurveyForm = {
  studentName: string;
  school: string;
  grade: string;
  parentContact: string;
  studentPhone: string;
  address: string;
  pastLearningMethods: string[];
  pastLearningOther: string;
  currentAcademyCount: string;
  currentAcademySubjects: string[];
  currentAcademySubjectsOther: string;
  reasonForChange: string;
  selfStudyMethods: string[];
  selfStudyOther: string;
  academyGoal: string;
  academyGoalOther: string;
  satisfactionAreas: string[];
  homeworkAmount: string;
  homeworkOther: string;
  highestEnglishScore: string;
  weeklyReadingCount: string;
  strongestSubject: string;
  weakestSubject: string;
  perceivedGap: string;
  schedules: SurveySchedule[];
  discoveryChannel: string;
  discoveryReferrer: string;
  discoveryOther: string;
  additionalNotes: string;
};

export type SurveySchedule = {
  id: string;
  academyName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

type VerifyResponse = {
  student: {
    id: string;
    name: string | null;
    parentEmail: string | null;
    surveyCompleted: boolean;
  };
  existingSurvey?: {
    data: ParentSurveyForm;
    completed_by: "parent" | "admin";
    created_at: string;
  } | null;
};

const PAST_LEARNING_OPTIONS = [
  { value: "worksheet_program", label: "학습지 (예: 구몬, 웅진, 대교, 재능, 윤선생, 기타)" },
  { value: "subject_academy", label: "단과학원" },
  { value: "multi_subject_academy", label: "전과목(보습)학원" },
  { value: "private_tutoring", label: "과외" },
  { value: "other", label: "기타" },
];

const CURRENT_ACADEMY_COUNT_OPTIONS = [
  { value: "none", label: "다니지 않는다" },
  { value: "one", label: "1개" },
  { value: "two", label: "2개" },
  { value: "three", label: "3개" },
  { value: "four_plus", label: "4개 이상" },
];

const CURRENT_ACADEMY_SUBJECT_OPTIONS = [
  { value: "korean", label: "국어" },
  { value: "math", label: "수학" },
  { value: "english", label: "영어" },
  { value: "essay", label: "논술" },
  { value: "all_subjects", label: "전과목" },
  { value: "physical_education", label: "체육" },
  { value: "music", label: "음악" },
  { value: "other", label: "기타 (과외 포함)" },
];

const SELF_STUDY_OPTIONS = [
  { value: "educational_broadcast", label: "교육방송" },
  { value: "paid_online_course", label: "유료 인터넷 방송" },
  { value: "reference_books", label: "참고서 / 문제집" },
  { value: "class_review", label: "수업내용 예·복습 (교과서 위주)" },
  { value: "other", label: "기타" },
];

const ACADEMY_GOAL_OPTIONS = [
  { value: "grade_improvement", label: "내신 성적 향상" },
  { value: "additional_subject_learning", label: "학교 외 기타과목 학습" },
  { value: "special_school_admission", label: "외고/국제고/특목고 진학" },
  { value: "other", label: "기타" },
];

const SATISFACTION_OPTIONS = [
  { value: "filled_gaps", label: "부족한 부분이 채워졌다" },
  { value: "advanced_learning", label: "선행학습이 이루어지고 있다" },
  { value: "better_grades", label: "내신 성적이 올랐다" },
  { value: "study_skills", label: "공부하는 방법을 알았다" },
  { value: "reduced_home_alone_time", label: "아이가 혼자 집에 있는 시간이 줄었다" },
];

const HOMEWORK_AMOUNT_OPTIONS = [
  { value: "none", label: "필요없음" },
  { value: "under_30_minutes", label: "30분 이내 분량" },
  { value: "under_60_minutes", label: "1시간 이내 분량" },
  { value: "over_60_minutes", label: "1시간 이상 분량" },
  { value: "other", label: "기타" },
];

const DISCOVERY_OPTIONS = [
  { value: "referral", label: "소개" },
  { value: "advertisement", label: "광고 (전단지 / 게시판 / 신문 / 기타)" },
  { value: "signage", label: "간판 / 현수막" },
  { value: "other", label: "기타" },
];

const createScheduleRow = (): SurveySchedule => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  academyName: "",
  dayOfWeek: "",
  startTime: "",
  endTime: "",
});

const EMPTY_FORM: ParentSurveyForm = {
  studentName: "",
  school: "",
  grade: "",
  parentContact: "",
  studentPhone: "",
  address: "",
  pastLearningMethods: [],
  pastLearningOther: "",
  currentAcademyCount: "",
  currentAcademySubjects: [],
  currentAcademySubjectsOther: "",
  reasonForChange: "",
  selfStudyMethods: [],
  selfStudyOther: "",
  academyGoal: "",
  academyGoalOther: "",
  satisfactionAreas: [],
  homeworkAmount: "",
  homeworkOther: "",
  highestEnglishScore: "",
  weeklyReadingCount: "",
  strongestSubject: "",
  weakestSubject: "",
  perceivedGap: "",
  schedules: [createScheduleRow()],
  discoveryChannel: "",
  discoveryReferrer: "",
  discoveryOther: "",
  additionalNotes: "",
};

const ParentSurveyPage = () => {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("student_id");
  const token = searchParams.get("token");
  const isAdmin = searchParams.get("admin") === "true";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [formData, setFormData] = useState<ParentSurveyForm>(EMPTY_FORM);

  useEffect(() => {
    async function verify() {
      if (!studentId || !token) {
        setError("잘못된 설문 링크입니다.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `/api/parent-survey/verify?student_id=${encodeURIComponent(studentId)}&token=${encodeURIComponent(token)}`,
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload.error ?? "설문 링크 확인에 실패했습니다.";
          setError(message);
          setLoading(false);
          return;
        }
        const payload = (await response.json()) as VerifyResponse;
        setStudentName(payload.student?.name ?? null);
        setFormData((previous) => {
          const incoming = (payload.existingSurvey?.data ?? {}) as Partial<ParentSurveyForm>;
          const merged: ParentSurveyForm = {
            ...previous,
            ...incoming,
            studentName: payload.student?.name ?? incoming.studentName ?? previous.studentName,
          };
          merged.schedules =
            incoming.schedules && Array.isArray(incoming.schedules) && incoming.schedules.length > 0
              ? incoming.schedules.map((schedule) => ({
                  ...schedule,
                  id: schedule.id ?? createScheduleRow().id,
                }))
              : previous.schedules.length > 0
                ? previous.schedules
                : [createScheduleRow()];
          return merged;
        });
      } catch (err) {
        console.error(err);
        setError("설문 데이터를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [studentId, token]);

  const schedules = formData.schedules;

  const addScheduleRow = () => {
    setFormData((prev) => ({
      ...prev,
      schedules: [...prev.schedules, createScheduleRow()],
    }));
  };

  const updateSchedule = (id: string, key: keyof SurveySchedule, value: string) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    }));
  };

  const removeSchedule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((row) => row.id !== id),
    }));
  };

  const toggleMultiSelect = (key: keyof Pick<ParentSurveyForm, "pastLearningMethods" | "currentAcademySubjects" | "selfStudyMethods" | "satisfactionAreas">, value: string) => {
    setFormData((prev) => {
      const currentValues = prev[key];
      const updated = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...prev, [key]: updated };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentId || !token) {
      setError("설문 정보를 전송할 수 없습니다.");
      return;
    }

    setError(null);
    const missing: string[] = [];
    if (formData.pastLearningMethods.length === 0) {
      missing.push("과거 학습 이력");
    }
    if (!formData.currentAcademyCount) {
      missing.push("현재 학원 수");
    }
    if (formData.selfStudyMethods.length === 0) {
      missing.push("자기주도 학습 방법");
    }
    if (!formData.academyGoal) {
      missing.push("학원의 주목적");
    }
    if (formData.satisfactionAreas.length === 0) {
      missing.push("학원 만족도");
    }
    if (!formData.homeworkAmount) {
      missing.push("숙제의 적정량");
    }

    if (missing.length > 0) {
      setError(`${missing.join(", ")} 항목을 선택해 주세요.`);
      return;
    }

    try {
      const response = await fetch("/api/parent-survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          token,
          formData,
          completedBy: isAdmin ? "admin" : "parent",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload.error ?? "설문 저장에 실패했습니다.";
        setError(message);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("설문 저장 중 오류가 발생했습니다.");
    }
  };

  const pageTitle = useMemo(
    () => (studentName ? `제타영어 학부모 설문지 – ${studentName} 학생` : "제타영어 학부모 설문지"),
    [studentName],
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-center text-neutral-600">설문을 불러오는 중입니다…</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Card className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold text-brand-primary-dark">감사합니다!</h1>
          <p className="text-neutral-700">설문 응답이 저장되었습니다. 제타영어가 곧 연락드릴 예정입니다.</p>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Card className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold text-brand-primary-dark">설문을 열 수 없습니다</h1>
          <p className="text-neutral-700">{error}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="bg-neutral-50 pb-16 pt-12">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-neutral-900">{pageTitle}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            상담을 보다 정확하게 준비하기 위한 설문지입니다. 빠짐없이 작성해 주시면 감사하겠습니다.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <Card className="space-y-6 p-6">
            <SectionTitle title="기본정보" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField
                label="학생 이름"
                required
                value={formData.studentName}
                onChange={(value) => setFormData((prev) => ({ ...prev, studentName: value }))}
              />
              <TextField
                label="학교"
                value={formData.school}
                onChange={(value) => setFormData((prev) => ({ ...prev, school: value }))}
              />
              <TextField
                label="학년"
                value={formData.grade}
                onChange={(value) => setFormData((prev) => ({ ...prev, grade: value }))}
              />
              <TextField
                label="학부모 연락처"
                required
                value={formData.parentContact}
                onChange={(value) => setFormData((prev) => ({ ...prev, parentContact: value }))}
              />
              <TextField
                label="학생 전화번호"
                required
                value={formData.studentPhone}
                onChange={(value) => setFormData((prev) => ({ ...prev, studentPhone: value }))}
              />
              <TextField
                label="주소"
                value={formData.address}
                onChange={(value) => setFormData((prev) => ({ ...prev, address: value }))}
              />
            </div>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionTitle title="과거 학습 이력" />
            <CheckboxGroup
              options={PAST_LEARNING_OPTIONS}
              values={formData.pastLearningMethods}
              onToggle={(value) => toggleMultiSelect("pastLearningMethods", value)}
            />
            {formData.pastLearningMethods.includes("other") && (
              <TextField
                label="기타 학습 방법"
                value={formData.pastLearningOther}
                onChange={(value) => setFormData((prev) => ({ ...prev, pastLearningOther: value }))}
              />
            )}
          </Card>

          <Card className="space-y-6 p-6">
            <SectionTitle title="현재 학원 현황" />
            <RadioGroup
              options={CURRENT_ACADEMY_COUNT_OPTIONS}
              value={formData.currentAcademyCount}
              onChange={(value) => setFormData((prev) => ({ ...prev, currentAcademyCount: value }))}
            />
            <CheckboxGroup
              options={CURRENT_ACADEMY_SUBJECT_OPTIONS}
              values={formData.currentAcademySubjects}
              onToggle={(value) => toggleMultiSelect("currentAcademySubjects", value)}
            />
            {formData.currentAcademySubjects.includes("other") && (
              <TextField
                label="기타 과목 (과외 포함)"
                value={formData.currentAcademySubjectsOther}
                onChange={(value) => setFormData((prev) => ({ ...prev, currentAcademySubjectsOther: value }))}
              />
            )}
            <TextareaField
              label="기존 학원을 변경하려는 이유"
              required
              value={formData.reasonForChange}
              onChange={(value) => setFormData((prev) => ({ ...prev, reasonForChange: value }))}
            />
          </Card>

          <Card className="space-y-6 p-6">
            <SectionTitle title="학습 방법 및 목표" />
            <CheckboxGroup
              options={SELF_STUDY_OPTIONS}
              values={formData.selfStudyMethods}
              onToggle={(value) => toggleMultiSelect("selfStudyMethods", value)}
            />
            {formData.selfStudyMethods.includes("other") && (
              <TextField
                label="기타 자기주도 학습 방법"
                value={formData.selfStudyOther}
                onChange={(value) => setFormData((prev) => ({ ...prev, selfStudyOther: value }))}
              />
            )}
            <RadioGroup
              options={ACADEMY_GOAL_OPTIONS}
              value={formData.academyGoal}
              onChange={(value) => setFormData((prev) => ({ ...prev, academyGoal: value }))}
            />
            {formData.academyGoal === "other" && (
              <TextField
                label="기타 학원의 주목적"
                value={formData.academyGoalOther}
                onChange={(value) => setFormData((prev) => ({ ...prev, academyGoalOther: value }))}
              />
            )}
          </Card>

          <Card className="space-y-6 p-6">
            <SectionTitle title="학원 만족도" />
            <CheckboxGroup
              options={SATISFACTION_OPTIONS}
              values={formData.satisfactionAreas}
              onToggle={(value) => toggleMultiSelect("satisfactionAreas", value)}
            />
            <RadioGroup
              options={HOMEWORK_AMOUNT_OPTIONS}
              value={formData.homeworkAmount}
              onChange={(value) => setFormData((prev) => ({ ...prev, homeworkAmount: value }))}
            />
            {formData.homeworkAmount === "other" && (
              <TextField
                label="기타 적정 숙제량"
                value={formData.homeworkOther}
                onChange={(value) => setFormData((prev) => ({ ...prev, homeworkOther: value }))}
              />
            )}
          </Card>

          <Card className="space-y-6 p-6">
            <SectionTitle title="성적 및 학습 습관" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField
                label="가장 높았던 영어시험 성적"
                value={formData.highestEnglishScore}
                onChange={(value) => setFormData((prev) => ({ ...prev, highestEnglishScore: value }))}
              />
              <TextField
                label="일주일 평균 독서량 (권)"
                value={formData.weeklyReadingCount}
                onChange={(value) => setFormData((prev) => ({ ...prev, weeklyReadingCount: value }))}
              />
              <TextField
                label="가장 자신있는 과목"
                value={formData.strongestSubject}
                onChange={(value) => setFormData((prev) => ({ ...prev, strongestSubject: value }))}
              />
              <TextField
                label="가장 자신없는 과목"
                value={formData.weakestSubject}
                onChange={(value) => setFormData((prev) => ({ ...prev, weakestSubject: value }))}
              />
            </div>
            <TextareaField
              label="부족하다고 생각하는 부분"
              value={formData.perceivedGap}
              onChange={(value) => setFormData((prev) => ({ ...prev, perceivedGap: value }))}
            />
          </Card>

          <Card className="space-y-6 p-6">
            <SectionTitle title="현재 다니는 학원의 시간표" />
            <p className="text-sm text-neutral-600">
              현재 다니는 학원의 요일과 등·하원 시간을 입력해 주세요. 필요한 만큼 추가할 수 있습니다.
            </p>

            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="rounded-lg border border-neutral-200 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <TextField
                      label="학원명"
                      value={schedule.academyName}
                      onChange={(value) => updateSchedule(schedule.id, "academyName", value)}
                    />
                    <TextField
                      label="요일"
                      value={schedule.dayOfWeek}
                      onChange={(value) => updateSchedule(schedule.id, "dayOfWeek", value)}
                    />
                    <TextField
                      label="등원 시간 (예: 15:30)"
                      value={schedule.startTime}
                      onChange={(value) => updateSchedule(schedule.id, "startTime", value)}
                    />
                    <TextField
                      label="하원 시간 (예: 18:00)"
                      value={schedule.endTime}
                      onChange={(value) => updateSchedule(schedule.id, "endTime", value)}
                    />
                  </div>
                  {schedules.length > 1 && (
                    <div className="mt-3 text-right">
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:underline"
                        onClick={() => removeSchedule(schedule.id)}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addScheduleRow}>
              시간표 추가
            </Button>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionTitle title="제타영어를 알게 된 경로" />
            <RadioGroup
              options={DISCOVERY_OPTIONS}
              value={formData.discoveryChannel}
              onChange={(value) => setFormData((prev) => ({ ...prev, discoveryChannel: value }))}
            />
            {formData.discoveryChannel === "referral" && (
              <TextField
                label="소개자 성함"
                value={formData.discoveryReferrer}
                onChange={(value) => setFormData((prev) => ({ ...prev, discoveryReferrer: value }))}
              />
            )}
            {formData.discoveryChannel === "other" && (
              <TextField
                label="기타 경로"
                value={formData.discoveryOther}
                onChange={(value) => setFormData((prev) => ({ ...prev, discoveryOther: value }))}
              />
            )}
          </Card>

          <Card className="space-y-6 p-6">
            <SectionTitle title="기타 사항" />
            <TextareaField
              label="아이의 성격이나 요청사항"
              value={formData.additionalNotes}
              onChange={(value) => setFormData((prev) => ({ ...prev, additionalNotes: value }))}
            />
          </Card>

          <div className="text-center">
            <Button type="submit" size="lg">
              설문 제출하기
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ParentSurveyPage;

type SectionTitleProps = {
  title: string;
};

const SectionTitle = ({ title }: SectionTitleProps) => (
  <div>
    <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
  </div>
);

type TextFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
};

const TextField = ({ label, value, required = false, onChange }: TextFieldProps) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm font-medium text-neutral-800">
      {label}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </span>
    <input
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
      type="text"
    />
  </label>
);

type TextareaFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
};

const TextareaField = ({ label, value, required = false, onChange }: TextareaFieldProps) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm font-medium text-neutral-800">
      {label}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </span>
    <textarea
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-28 resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
    />
  </label>
);

type CheckboxGroupProps = {
  options: { value: string; label: string }[];
  values: string[];
  onToggle: (value: string) => void;
};

const CheckboxGroup = ({ options, values, onToggle }: CheckboxGroupProps) => (
  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
    {options.map((option) => (
      <label key={option.value} className="flex items-center gap-2 text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={values.includes(option.value)}
          onChange={() => onToggle(option.value)}
          className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
        />
        <span>{option.label}</span>
      </label>
    ))}
  </div>
);

type RadioGroupProps = {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
};

const RadioGroup = ({ options, value, onChange }: RadioGroupProps) => (
  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
    {options.map((option) => (
      <label key={option.value} className="flex items-center gap-2 text-sm text-neutral-800">
        <input
          type="radio"
          checked={value === option.value}
          onChange={() => onChange(option.value)}
          className="h-4 w-4 border-neutral-300 text-brand-primary focus:ring-brand-primary"
        />
        <span>{option.label}</span>
      </label>
    ))}
  </div>
);
