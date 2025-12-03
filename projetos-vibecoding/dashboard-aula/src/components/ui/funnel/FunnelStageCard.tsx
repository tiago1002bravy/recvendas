"use client";

import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/utils/formatting";

interface FunnelStageCardProps {
  label: string;
  value: number;
  conversionRate: number;
  widthPercentage: number; // 0-100 para largura proporcional
  color?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

export function FunnelStageCard({
  label,
  value,
  conversionRate,
  widthPercentage,
  color = "bg-gray-900",
  isFirst = false,
  isLast = false,
}: FunnelStageCardProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Card do estágio */}
      <div
        className={cn(
          "relative rounded-xl shadow-md transition-all duration-300",
          "hover:shadow-lg hover:scale-105",
          "p-4 text-white",
          isFirst && "bg-black",
          isLast && "bg-gray-700",
          !isFirst && !isLast && "bg-gray-900"
        )}
        style={{
          width: `${Math.max(widthPercentage, 20)}%`, // Mínimo 20% para legibilidade
          minWidth: "140px",
        }}
      >
        {/* Label */}
        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-90 mb-1">
          {label}
        </div>

        {/* Valor Principal */}
        <div className="text-3xl font-bold mb-1">{value.toLocaleString("pt-BR")}</div>

        {/* Taxa de Conversão */}
        <div className="text-xs font-medium opacity-90">
          {formatPercentage(conversionRate, false)}
        </div>

        {/* Badge de estágio inicial */}
        {isFirst && (
          <div className="absolute -top-1.5 -right-1.5 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            Base
          </div>
        )}

        {/* Badge de estágio final */}
        {isLast && (
          <div className="absolute -top-1.5 -right-1.5 bg-white text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            Meta
          </div>
        )}
      </div>
    </div>
  );
}

