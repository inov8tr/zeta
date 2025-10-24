export type SurveySchedule = {
  id: string;
  academyName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

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

export const createScheduleRow = (): SurveySchedule => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  academyName: "",
  dayOfWeek: "",
  startTime: "",
  endTime: "",
});

export const createEmptyForm = (): ParentSurveyForm => ({
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
});

const toLabelMap = (options: { value: string; label: string }[]) =>
  Object.fromEntries(options.map((option) => [option.value, option.label] as const));

export const PAST_LEARNING_OPTIONS = [
  { value: "worksheet_program", label: "학습지 (예: 구몬, 웅진 등)" },
  { value: "subject_academy", label: "단과학원" },
  { value: "multi_subject_academy", label: "전과목(보습)학원" },
  { value: "private_tutoring", label: "과외" },
  { value: "other", label: "기타" },
];
export const PAST_LEARNING_LABELS = toLabelMap(PAST_LEARNING_OPTIONS);

export const CURRENT_ACADEMY_COUNT_OPTIONS = [
  { value: "none", label: "다니지 않는다" },
  { value: "one", label: "1개" },
  { value: "two", label: "2개" },
  { value: "three", label: "3개" },
  { value: "four_plus", label: "4개 이상" },
];
export const CURRENT_ACADEMY_COUNT_LABELS = toLabelMap(CURRENT_ACADEMY_COUNT_OPTIONS);

export const CURRENT_ACADEMY_SUBJECT_OPTIONS = [
  { value: "korean", label: "국어" },
  { value: "math", label: "수학" },
  { value: "english", label: "영어" },
  { value: "essay", label: "논술" },
  { value: "all_subjects", label: "전과목" },
  { value: "physical_education", label: "체육" },
  { value: "music", label: "음악" },
  { value: "other", label: "기타 (과외 포함)" },
];
export const CURRENT_ACADEMY_SUBJECT_LABELS = toLabelMap(CURRENT_ACADEMY_SUBJECT_OPTIONS);

export const SELF_STUDY_OPTIONS = [
  { value: "educational_broadcast", label: "교육방송" },
  { value: "paid_online_course", label: "유료 인터넷 방송" },
  { value: "reference_books", label: "참고서 / 문제집" },
  { value: "class_review", label: "수업내용 예·복습" },
  { value: "other", label: "기타" },
];
export const SELF_STUDY_LABELS = toLabelMap(SELF_STUDY_OPTIONS);

export const ACADEMY_GOAL_OPTIONS = [
  { value: "grade_improvement", label: "내신 성적 향상" },
  { value: "additional_subject_learning", label: "학교 외 기타과목 학습" },
  { value: "special_school_admission", label: "외고/국제고/특목고 진학" },
  { value: "other", label: "기타" },
];
export const ACADEMY_GOAL_LABELS = toLabelMap(ACADEMY_GOAL_OPTIONS);

export const SATISFACTION_OPTIONS = [
  { value: "filled_gaps", label: "부족한 부분이 채워졌다" },
  { value: "advanced_learning", label: "선행학습이 이루어지고 있다" },
  { value: "better_grades", label: "내신 성적이 올랐다" },
  { value: "study_skills", label: "공부하는 방법을 알았다" },
  { value: "reduced_home_alone_time", label: "아이가 혼자 집에 있는 시간이 줄었다" },
];
export const SATISFACTION_LABELS = toLabelMap(SATISFACTION_OPTIONS);

export const HOMEWORK_AMOUNT_OPTIONS = [
  { value: "none", label: "필요없음" },
  { value: "under_30_minutes", label: "30분 이내 분량" },
  { value: "under_60_minutes", label: "1시간 이내 분량" },
  { value: "over_60_minutes", label: "1시간 이상 분량" },
  { value: "other", label: "기타" },
];
export const HOMEWORK_AMOUNT_LABELS = toLabelMap(HOMEWORK_AMOUNT_OPTIONS);

export const DISCOVERY_OPTIONS = [
  { value: "referral", label: "소개" },
  { value: "advertisement", label: "광고 (전단지/게시판/신문)" },
  { value: "signage", label: "간판 / 현수막" },
  { value: "other", label: "기타" },
];
export const DISCOVERY_LABELS = toLabelMap(DISCOVERY_OPTIONS);
