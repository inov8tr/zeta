"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface SectionPerformanceDatum {
  section: string;
  score: number;
}

const pickColor = (score: number) => {
  if (score >= 80) {
    return "#16a34a"; // green
  }
  if (score >= 50) {
    return "#f59e0b"; // yellow
  }
  return "#dc2626"; // red
};

export const SectionPerformanceChart = ({ data }: { data: SectionPerformanceDatum[] }) => {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-neutral-muted">
        No section scores available yet.
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.score - a.score);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={sortedData}
          margin={{ top: 12, right: 24, left: 0, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#475569", fontSize: 12 }}
          />
          <YAxis
            dataKey="section"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#475569", fontSize: 12 }}
            width={110}
          />
          <Tooltip
            cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
            labelStyle={{ color: "#0f172a", fontWeight: 600 }}
            formatter={(value: number) => [`${value}%`, "Accuracy"]}
          />
          <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={20}>
            {sortedData.map((entry) => (
              <Cell key={entry.section} fill={pickColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
