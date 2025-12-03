"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { UTMDataItem } from "@/types/dashboard";

interface PieChartProps {
  data: UTMDataItem[];
  height?: number;
  title?: string;
}

// Tooltip customizado
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as UTMDataItem;
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-1">{data.name}</p>
        <p className="text-xs text-gray-600">
          {data.quantity} leads ({data.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

// Renderização customizada de labels
const renderCustomLabel = (entry: any) => {
  const percentage = entry.percentage || 0;
  // Só mostra label se >= 5%
  return percentage >= 5 ? `${percentage.toFixed(1)}%` : "";
};

export function PieChart({ data, height = 300, title }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">Sem dados disponíveis</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full" style={{ minHeight: `${height}px` }}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ width: '100%', height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              innerRadius={0}
              fill="#8884d8"
              dataKey="quantity"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || "#2563eb"} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-xs text-gray-700">{entry.payload.name}</span>
              )}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

