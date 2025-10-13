import { format } from "date-fns";

interface ProgressItem {
  id: string;
  type: string | null;
  completed_at: string | null;
  total_score: number | null;
  weighted_level: number | null;
}

interface ProgressTimelineProps {
  tests: ProgressItem[];
}

const ProgressTimeline = ({ tests }: ProgressTimelineProps) => {
  if (tests.length === 0) {
    return (
      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-primary-dark">Recent progress</h2>
            <p className="text-sm text-neutral-muted">Your completed assessments will appear here.</p>
          </div>
        </header>
        <p className="text-sm text-neutral-muted">No completed assessments yet. Keep going!</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-primary-dark">Recent progress</h2>
          <p className="text-sm text-neutral-muted">Highlights from your completed assessments.</p>
        </div>
      </header>

      <ol className="relative space-y-6 border-l border-brand-primary/10 pl-6 text-sm text-neutral-800">
        {tests.map((test) => (
          <li key={test.id} className="relative">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              ✓
            </span>
            <div className="flex flex-col gap-1 rounded-2xl bg-brand-primary/5 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-brand-primary/70">
                {test.type === "entrance" ? "Entrance Test" : test.type ?? "Assessment"}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-brand-primary-dark">
                  {test.completed_at ? format(new Date(test.completed_at), "MMM d, yyyy") : "Recently"}
                </p>
                {typeof test.total_score === "number" ? (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-primary shadow-sm">
                    Score: {test.total_score}
                  </span>
                ) : null}
                {typeof test.weighted_level === "number" ? (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-primary shadow-sm">
                    Level: {test.weighted_level}
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default ProgressTimeline;
