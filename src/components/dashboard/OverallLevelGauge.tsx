"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

export const OverallLevelGauge = ({ level, maxLevel = 7 }: { level: number; maxLevel?: number }) => {
  const clampedLevel = Math.max(0, Math.min(maxLevel, Number.isFinite(level) ? level : 0));

  const data = [
    { name: "Max", value: maxLevel, fill: "#e2e8f0" },
    { name: "Level", value: clampedLevel, fill: "#4f46e5" },
  ];

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="100%"
          barSize={18}
          data={data}
          startAngle={225}
          endAngle={-45}
        >
          <PolarAngleAxis type="number" domain={[0, maxLevel]} tick={false} />
          <RadialBar dataKey="value" background cornerRadius={20} />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-brand-primary-dark text-3xl font-semibold"
          >
            {clampedLevel.toFixed(1)}
          </text>
          <text
            x="50%"
            y="65%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-neutral-500 text-sm"
          >
            of {maxLevel}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

