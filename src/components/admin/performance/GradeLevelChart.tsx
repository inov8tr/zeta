"use client";

import { useMemo, useState } from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface GradeLevelTimePoint {
  monthLabel: string;
  avgLevel: number | null;
  highLevel: number | null;
  lowLevel: number | null;
}

export interface GradeLevelSeries {
  grade: string;
  points: GradeLevelTimePoint[];
}

interface GradeLevelChartProps {
  gradeSeries: GradeLevelSeries[];
}

const tooltipStyles = {
  backgroundColor: "rgba(255,255,255,0.95)",
  borderRadius: "0.75rem",
  boxShadow: "0 10px 40px rgba(15, 23, 42, 0.12)",
  padding: "0.5rem 0.75rem",
  border: "1px solid rgba(37, 99, 235, 0.12)",
};

const GradeLevelChart = ({ gradeSeries }: GradeLevelChartProps) => {
  const gradeOptions = useMemo(() => gradeSeries.map((series) => series.grade), [gradeSeries]);
  const [selectedGrade, setSelectedGrade] = useState<string>(gradeOptions[0] ?? "");

  const activeSeries = gradeSeries.find((series) => series.grade === selectedGrade) ?? gradeSeries[0];

  const chartData = activeSeries?.points.map((point) => ({
    month: point.monthLabel,
    average: point.avgLevel ?? null,
    high: point.highLevel ?? null,
    low: point.lowLevel ?? null,
  })) ?? [];

  const renderButton = (grade: string) => {
    const isActive = grade === selectedGrade;
    return (
      <button
        key={grade}
        type="button"
        onClick={() => setSelectedGrade(grade)}
        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
          isActive
            ? "border-brand-primary bg-brand-primary text-white shadow"
            : "border-brand-primary/20 bg-white text-brand-primary-dark hover:border-brand-primary/40"
        }`}
      >
        {grade}
      </button>
    );
  };

  return (
    <section className="flex flex-col rounded-3xl border border-brand-primary/10 bg-white shadow-sm">
      <header className="border-b border-brand-primary/10 px-6 py-4">
        <h2 className="text-lg font-semibold text-brand-primary-dark">Grade level distribution</h2>
        <p className="text-xs text-neutral-muted">Performance trends over time by grade.</p>
      </header>
      {gradeSeries.length === 0 ? (
        <div className="px-6 py-10 text-sm text-neutral-muted">
          We need completed tests with level data to show grade performance.
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {gradeOptions.map(renderButton)}
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="rgba(71, 85, 105, 0.7)" />
                <YAxis domain={[0, 7]} allowDecimals={false} axisLine={false} tickLine={false} stroke="rgba(71, 85, 105, 0.7)" />
                <Tooltip contentStyle={tooltipStyles} />
                <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ paddingBottom: 8 }} />
                <Line type="monotone" dataKey="average" name="Average" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="high" name="High" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="low" name="Low" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl bg-brand-primary/5 px-4 py-3 text-xs text-neutral-muted">
            <span className="font-semibold text-brand-primary-dark">{selectedGrade}</span>
            <span className="ml-2">
              {activeSeries?.points.length
                ? `Showing ${activeSeries.points.length} month${activeSeries.points.length === 1 ? "" : "s"} of performance`
                : "No data"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default GradeLevelChart;
