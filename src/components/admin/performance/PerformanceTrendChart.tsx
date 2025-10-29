"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  month: string;
  assigned: number;
  completed: number;
};

interface PerformanceTrendChartProps {
  data: TrendPoint[];
}

const tooltipStyles = {
  backgroundColor: "rgba(255,255,255,0.95)",
  borderRadius: "0.75rem",
  boxShadow: "0 10px 40px rgba(15, 23, 42, 0.12)",
  padding: "0.75rem 1rem",
  border: "1px solid rgba(37, 99, 235, 0.12)",
};

const PerformanceTrendChart = ({ data }: PerformanceTrendChartProps) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="assigned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="rgba(71, 85, 105, 0.7)" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="rgba(71, 85, 105, 0.7)" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyles} />
          <Area
            type="monotone"
            dataKey="assigned"
            name="Assigned"
            stroke="#2563eb"
            fill="url(#assigned)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#059669"
            fill="url(#completed)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceTrendChart;

