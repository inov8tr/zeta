import { decimalFormatter, numberFormatter } from "@/app/teacher/dashboardData";

interface ClassSummaryTableProps {
  rows: Array<{
    classId: string;
    className: string;
    level: string | null;
    avgScore: number | null;
    testCount: number;
  }>;
  hasData: boolean;
}

const ClassSummaryTable = ({ rows, hasData }: ClassSummaryTableProps) => (
  <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
    <header className="border-b border-teacher-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-teacher-primary-text">Class performance</h2>
      <p className="text-xs text-neutral-muted">Average scores for your assigned classes.</p>
    </header>
    {hasData ? (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-teacher-primary/10 text-sm">
          <thead className="bg-teacher-primary/5 text-xs uppercase tracking-wide text-teacher-primary-text">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Class</th>
              <th className="px-6 py-3 text-left font-semibold">Average score</th>
              <th className="px-6 py-3 text-left font-semibold">Completed tests</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teacher-primary/10">
            {rows.map((row) => (
              <tr key={row.classId} className="hover:bg-teacher-primary/10">
                <td className="px-6 py-3 font-medium text-teacher-primary-text">
                  {row.className}
                  {row.level ? <span className="ml-2 text-xs text-neutral-muted">Level {row.level}</span> : null}
                </td>
                <td className="px-6 py-3 text-neutral-800">
                  {row.avgScore != null ? `${decimalFormatter.format(row.avgScore)}%` : "—"}
                </td>
                <td className="px-6 py-3 text-neutral-800">{numberFormatter.format(row.testCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="px-6 py-10 text-sm text-neutral-muted">
        Once students complete tests, class averages will appear here.
      </div>
    )}
  </article>
);

export default ClassSummaryTable;
