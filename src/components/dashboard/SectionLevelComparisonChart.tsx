"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SectionLevelComparisonDatum {
  section: string;
  level: number;
  maxLevel: number;
}

export const SectionLevelComparisonChart = ({
  data,
  maxLevel = 7,
}: {
  data: SectionLevelComparisonDatum[];
  maxLevel?: number;
}) => {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-neutral-muted">
        Section level information unavailable.
      </div>
    );
  }

  const chartData = data.map((entry) => ({
    section: entry.section,
    "Current Level": entry.level,
    "Max Level": maxLevel,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis
            dataKey="section"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#475569", fontSize: 12 }}
          />
          <YAxis
            domain={[0, maxLevel]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#475569", fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
            labelStyle={{ color: "#0f172a" }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)}`, name]}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Bar dataKey="Max Level" fill="#dbeafe" radius={[8, 8, 0, 0]} maxBarSize={48} />
          <Bar dataKey="Current Level" fill="#4f46e5" radius={[8, 8, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

