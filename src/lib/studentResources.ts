import type { StudentResource } from "@/components/student/ResourcesGrid";

const DEFAULT_RESOURCES: StudentResource[] = [
  {
    title: "Daily English practice",
    description: "Short listening, reading, and vocabulary tasks you can do in 10 minutes.",
    href: "https://learnenglish.britishcouncil.org/skills",
    category: "Skills",
  },
  {
    title: "Prepare for your test",
    description: "Tips for staying focused, managing time, and understanding question types.",
    href: "https://www.cambridgeenglish.org/blog/how-to-prepare-for-english-tests/",
    category: "Preparation",
  },
];

const RESOURCES_BY_STATUS: Record<string, StudentResource[]> = {
  assigned: [
    {
      title: "Assessment checklist",
      description: "Steps to take before starting your assessment so you feel confident.",
      href: "https://www.oxfordonlineenglish.com/english-test-preparation-tips",
      category: "Checklist",
    },
    {
      title: "Mindset for success",
      description: "Short video on how to stay calm and focused during your assessment.",
      href: "https://www.youtube.com/watch?v=UK8Z3i3a0jU",
      category: "Mindset",
    },
  ],
  in_progress: [
    {
      title: "Break strategy",
      description: "Five-minute exercises to reset during longer assessments.",
      href: "https://www.healthline.com/health/mental-health/study-break-ideas",
      category: "Wellness",
    },
    {
      title: "Timing techniques",
      description: "How to pace yourself and use checkpoints inside each section.",
      href: "https://www.examstrategies.org/time-management-tips/",
      category: "Strategy",
    },
  ],
  completed: [
    {
      title: "Reflect on your results",
      description: "A guide to reviewing your answers and setting new goals.",
      href: "https://edutopia.org/article/reflecting-on-assessments",
      category: "Reflection",
    },
    {
      title: "Build stronger reading skills",
      description: "Targeted reading comprehension lessons appropriate for all levels.",
      href: "https://www.readingrockets.org/article/seven-strategies-teach-students-text-comprehension",
      category: "Reading",
    },
  ],
};

export function getStudentResources(testStatus: string | null): StudentResource[] {
  if (!testStatus) return DEFAULT_RESOURCES;
  const key = testStatus.toLowerCase();
  return RESOURCES_BY_STATUS[key] ?? DEFAULT_RESOURCES;
}

