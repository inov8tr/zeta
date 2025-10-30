import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const resources = [
  {
    title: "Assessment planning toolkit",
    description: "Strategy guides and templates to scaffold upcoming lessons.",
    href: "https://www.cambridgeenglish.org/teaching-english/",
    external: true,
  },
  {
    title: "Speaking evaluation rubric",
    description: "Reference criteria to keep feedback aligned across classes.",
    href: "https://www.ielts.org/teaching-and-research/teaching",
    external: true,
  },
  {
    title: "Student resource library",
    description: "Share practice materials directly with your learners.",
    href: "/student/resources",
  },
];

const ResourcePanel = () => (
  <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
    <header className="border-b border-teacher-primary/10 px-6 py-4">
      <h3 className="text-lg font-semibold text-teacher-primary-text">Teacher toolkit</h3>
      <p className="text-xs text-neutral-muted">
        Save time with ready-made planning guides and study materials.
      </p>
    </header>
    <ul className="divide-y divide-teacher-primary/10">
      {resources.map((resource) => {
        const isExternal =
          (resource.external ?? false) || resource.href.startsWith("http");
        return (
          <li key={resource.title}>
            <Link
              href={resource.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="group flex flex-col gap-2 px-6 py-5 transition hover:bg-teacher-primary/5"
            >
              <span className="text-sm font-semibold text-teacher-primary-text">
                {resource.title}
              </span>
              <span className="text-xs text-neutral-muted">{resource.description}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-teacher-primary-text">
                View
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  </article>
);

export default ResourcePanel;
