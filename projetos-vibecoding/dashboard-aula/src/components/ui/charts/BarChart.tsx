"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyLeadsData } from "@/types/dashboard";

interface BarChartProps {
  data: DailyLeadsData[];
  height?: number;
  barColor?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// Tooltip customizado
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DailyLeadsData;
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-900">
          Dia {data.day}: <span className="text-blue-600">{data.leads} leads</span>
        </p>
      </div>
    );
  }
  return null;
};

export function BarChart({
  data,
  height = 350,
  barColor = "#2563eb",
  xAxisLabel = "Dia do Mês",
  yAxisLabel = "Leads",
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="day"
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          label={{
            value: xAxisLabel,
            position: "insideBottom",
            offset: -10,
            style: { fontSize: 13, fill: "#374151", fontWeight: 600 },
          }}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          label={{
            value: yAxisLabel,
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 13, fill: "#374151", fontWeight: 600 },
          }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
        <Bar
          dataKey="leads"
          fill={barColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

