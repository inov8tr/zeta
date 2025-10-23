"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SectionTrendDatum {
  label: string;
  accuracy: number;
  completed_at: string | null;
}

export interface SectionTrendEntry {
  section: string;
  history: SectionTrendDatum[];
}

const formatLabel = (datum: SectionTrendDatum) => {
  if (datum.label !== "Current") {
    return datum.label;
  }
  return datum.completed_at ? "Current" : datum.label;
};

export const SectionTrendList = ({ entries }: { entries: SectionTrendEntry[] }) => {
  if (!entries.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {entries.map((entry) => {
        const history = [...entry.history];
        return (
          <div key={entry.section} className="rounded-2xl border border-brand-primary/10 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-brand-primary-dark">{entry.section}</h3>
            {history.length <= 1 ? (
              <p className="mt-3 text-xs text-neutral-muted">Complete more tests to see trends.</p>
            ) : (
              <div className="mt-2 h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 16, right: 12, left: -16, bottom: 8 }}>
                    <XAxis
                      dataKey="label"
                      tickFormatter={formatLabel}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#475569", fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#475569", fontSize: 11 }}
                    />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Accuracy"]} />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
