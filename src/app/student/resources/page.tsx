import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import ResourcesGrid, { type StudentResource } from "@/components/student/ResourcesGrid";
import { Database } from "@/lib/database.types";
import { getStudentResources } from "@/lib/studentResources";

type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "test_status">;

const PRACTICE_COLLECTIONS: {
  title: string;
  description: string;
  resources: StudentResource[];
}[] = [
  {
    title: "Daily English skills",
    description: "Keep a balanced study routine with listening, speaking, reading, and writing practice.",
    resources: [
      {
        title: "British Council Skills Hub",
        description: "Interactive lessons for every level across all four skills.",
        href: "https://learnenglish.britishcouncil.org/",
        category: "Core skills",
      },
      {
        title: "VOA Learning English",
        description: "Short news stories with transcripts and audio for listening practice.",
        href: "https://learningenglish.voanews.com/",
        category: "Listening",
      },
      {
        title: "ESL Fast Speaking",
        description: "Role-play dialogues and shadowing activities to build speaking confidence.",
        href: "https://www.eslfast.com/",
        category: "Speaking",
      },
    ],
  },
  {
    title: "Test preparation essentials",
    description: "Understand question types, timing, and strategies to improve your assessment performance.",
    resources: [
      {
        title: "Cambridge Assessment Tips",
        description: "Official guidance on preparing for Cambridge-style English assessments.",
        href: "https://www.cambridgeenglish.org/blog/how-to-prepare-for-english-tests/",
        category: "Strategy",
      },
      {
        title: "Exam Strategy Playbook",
        description: "Time management ideas and warm-up routines you can apply to any exam.",
        href: "https://www.examstrategies.org/time-management-tips/",
        category: "Timing",
      },
      {
        title: "YouTube: Staying calm during tests",
        description: "A 6-minute routine to reset your mindset before or during an assessment.",
        href: "https://www.youtube.com/watch?v=UK8Z3i3a0jU",
        category: "Mindset",
      },
    ],
  },
  {
    title: "Level-up reading & vocabulary",
    description: "Build comprehension and vocabulary to unlock higher-level passages.",
    resources: [
      {
        title: "ReadTheory adaptive practice",
        description: "Short reading passages matched to your current ability with immediate feedback.",
        href: "https://www.readtheory.org/",
        category: "Reading",
      },
      {
        title: "Quizlet vocabulary decks",
        description: "Teacher-curated vocabulary lists with flashcards and games.",
        href: "https://quizlet.com/topic/english/academic/",
        category: "Vocabulary",
      },
      {
        title: "Newsela free articles",
        description: "Real-world content rewritten at multiple reading levels.",
        href: "https://newsela.com/",
        category: "Reading",
      },
    ],
  },
];

const StudentResourcesPage = async () => {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("test_status")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  const recommendedResources = getStudentResources(profile?.test_status ?? null);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold text-brand-primary-dark">Resources</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-muted">
          Curated lessons, activities, and tips to keep you progressing between consultations and assessments.
        </p>
      </header>

      <ResourcesGrid resources={recommendedResources} />

      <section className="space-y-6">
        {PRACTICE_COLLECTIONS.map((collection) => (
          <article key={collection.title} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">{collection.title}</h2>
                <p className="mt-1 text-sm text-neutral-600">{collection.description}</p>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-student-primary/80">Featured</span>
            </div>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {collection.resources.map((resource) => (
                <li key={resource.href} className="rounded-2xl border border-neutral-200 bg-neutral-lightest p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-neutral-900">{resource.title}</p>
                    {resource.category ? (
                      <span className="rounded-full bg-student-primary/10 px-3 py-1 text-[11px] font-semibold uppercase text-student-primary">
                        {resource.category}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{resource.description}</p>
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center text-xs font-semibold uppercase text-student-primary transition hover:text-student-primary-light"
                  >
                    Open resource →
                  </a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <footer className="rounded-3xl border border-student-primary/20 bg-student-primary/10 p-6 text-sm">
        <p className="font-semibold text-student-primary">Need something specific?</p>
        <p className="mt-2 text-student-primary">
          Share what you want to work on next and your teacher will add custom resources to this list.
        </p>
        <a
          href="mailto:info@zeta-eng.com"
          className="mt-4 inline-flex items-center rounded-full bg-student-primary px-5 py-2 text-xs font-semibold uppercase text-white transition hover:bg-student-primary-light"
        >
          Email Zeta support
        </a>
      </footer>
    </main>
  );
};

export default StudentResourcesPage;
