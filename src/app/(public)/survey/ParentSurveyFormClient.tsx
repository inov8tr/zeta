"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/card";
import {
  ParentSurveyForm,
  SurveySchedule,
  createEmptyForm,
  createScheduleRow,
  PAST_LEARNING_OPTIONS,
  CURRENT_ACADEMY_COUNT_OPTIONS,
  CURRENT_ACADEMY_SUBJECT_OPTIONS,
  SELF_STUDY_OPTIONS,
  ACADEMY_GOAL_OPTIONS,
  SATISFACTION_OPTIONS,
  HOMEWORK_AMOUNT_OPTIONS,
  DISCOVERY_OPTIONS,
} from "./shared";

type ParentSurveyFormClientProps = {
  studentId: string;
  token: string;
  isAdmin: boolean;
  initialData: ParentSurveyForm;
};

const ParentSurveyFormClient = ({ studentId, token, isAdmin, initialData }: ParentSurveyFormClientProps) => {
  const [formData, setFormData] = useState<ParentSurveyForm>(initialData);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const toggleMultiSelect = (
    key: keyof Pick<ParentSurveyForm, "pastLearningMethods" | "currentAcademySubjects" | "selfStudyMethods" | "satisfactionAreas">,
    value: string,
  ) => {
    setFormData((prev) => {
      const current = prev[key];
      const nextValues = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, [key]: nextValues };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        setError(payload.error ?? "설문 제출에 실패했습니다. 다시 시도해 주세요.");
        return;
      }

      setSubmitted(true);
      setFormData(createEmptyForm());
    } catch (err) {
      console.error(err);
      setError("설문 제출 중 오류가 발생했습니다.");
    }
  };

  const pageTitle = useMemo(() => {
    if (formData.studentName.trim().length > 0) {
      return `제타영어 학부모 설문지 – ${formData.studentName} 학생`;
    }
    return "제타영어 학부모 설문지";
  }, [formData.studentName]);

  if (submitted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Card className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold text-brand-primary-dark">감사합니다!</h1>
          <p className="text-neutral-700">
            설문 응답이 저장되었습니다. {isAdmin ? "제출 내용을 확인했습니다." : "제타영어가 곧 연락드릴 예정입니다."}
          </p>
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

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

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
                label="소개자"
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

export default ParentSurveyFormClient;

const SectionTitle = ({ title }: { title: string }) => (
  <div>
    <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
  </div>
);

const TextField = ({ label, value, required = false, onChange }: { label: string; value: string; required?: boolean; onChange: (value: string) => void }) => (
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

const TextareaField = ({ label, value, required = false, onChange }: { label: string; value: string; required?: boolean; onChange: (value: string) => void }) => (
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

const CheckboxGroup = ({
  options,
  values,
  onToggle,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onToggle: (value: string) => void;
}) => (
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

const RadioGroup = ({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) => (
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
