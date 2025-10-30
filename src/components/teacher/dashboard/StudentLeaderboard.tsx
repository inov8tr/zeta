import { decimalFormatter, numberFormatter, type StudentLeaderboardRow } from "@/app/teacher/dashboardData";

interface StudentLeaderboardProps {
  rows: StudentLeaderboardRow[];
}

const StudentLeaderboard = ({ rows }: StudentLeaderboardProps) => (
  <article className="rounded-3xl border border-teacher-primary/10 bg-white shadow-sm">
    <header className="border-b border-teacher-primary/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-teacher-primary-text">Student highlights</h2>
      <p className="text-xs text-neutral-muted">Recent improvement based on completed assessments.</p>
    </header>
    {rows.length === 0 ? (
      <div className="px-6 py-10 text-sm text-neutral-muted">
        Keep an eye here for improvement once students submit tests.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-teacher-primary/10 text-sm">
          <thead className="bg-teacher-primary/5 text-xs uppercase tracking-wide text-teacher-primary-text">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Student</th>
              <th className="px-6 py-3 text-left font-semibold">Latest score</th>
              <th className="px-6 py-3 text-left font-semibold">Improvement</th>
              <th className="px-6 py-3 text-left font-semibold">Attempts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teacher-primary/10">
            {rows.map((row) => (
              <tr key={row.studentId} className="hover:bg-teacher-primary/10">
                <td className="px-6 py-3 font-medium text-teacher-primary-text">{row.name}</td>
                <td className="px-6 py-3 text-neutral-800">
                  {row.latestScore != null ? `${decimalFormatter.format(row.latestScore)}%` : "—"}
                </td>
                <td className="px-6 py-3 text-neutral-800">
                  {row.improvement != null
                    ? `${row.improvement >= 0 ? "+" : ""}${decimalFormatter.format(row.improvement)}%`
                    : "—"}
                </td>
                <td className="px-6 py-3 text-neutral-800">{numberFormatter.format(row.attempts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </article>
);

export default StudentLeaderboard;
