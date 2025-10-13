import Link from "next/link";

export interface StudentResource {
  title: string;
  description: string;
  href: string;
  category?: string;
}

interface ResourcesGridProps {
  resources: StudentResource[];
}

export default function ResourcesGrid({ resources }: ResourcesGridProps) {
  if (!resources.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-primary-dark">Recommended resources</h2>
      <p className="mt-2 text-sm text-neutral-muted">
        Build consistent practice with these teacher-approved lessons and activities.
      </p>
      <ul className="mt-4 space-y-4">
        {resources.map((resource) => (
          <li key={resource.href} className="rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-brand-primary-dark">{resource.title}</p>
                {resource.category ? (
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase text-brand-primary shadow-sm">
                    {resource.category}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-neutral-muted">{resource.description}</p>
              <Link
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-semibold uppercase text-brand-primary transition hover:text-brand-primary-dark"
              >
                Open resource →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

