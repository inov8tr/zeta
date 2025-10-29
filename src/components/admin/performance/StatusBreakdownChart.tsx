"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StatusPoint = {
  status: string;
  value: number;
};

interface StatusBreakdownChartProps {
  data: StatusPoint[];
}

const tooltipStyles = {
  backgroundColor: "rgba(255,255,255,0.95)",
  borderRadius: "0.75rem",
  boxShadow: "0 10px 40px rgba(15, 23, 42, 0.12)",
  padding: "0.75rem 1rem",
  border: "1px solid rgba(37, 99, 235, 0.12)",
};

const StatusBreakdownChart = ({ data }: StatusBreakdownChartProps) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis dataKey="status" tickLine={false} axisLine={false} stroke="rgba(71, 85, 105, 0.7)" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="rgba(71, 85, 105, 0.7)" />
          <Tooltip cursor={{ fill: "rgba(59, 130, 246, 0.05)" }} contentStyle={tooltipStyles} />
          <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 10, 10]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusBreakdownChart;

