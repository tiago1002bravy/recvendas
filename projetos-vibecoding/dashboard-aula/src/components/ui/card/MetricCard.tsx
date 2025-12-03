"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyBRL, formatPercentage } from "@/lib/utils/formatting";
import { SEMANTIC_COLORS, getSemanticColorByState } from "@/lib/constants";
import { calculateVariationState } from "@/lib/utils/calculation";

interface MetricCardProps {
  label: string;
  value: number;
  variation: number;
  invertColors?: boolean;
  size?: "large" | "medium" | "small";
  className?: string;
}

export function MetricCard({
  label,
  value,
  variation,
  invertColors = false,
  size = "medium",
  className,
}: MetricCardProps) {
  // Determina o estado da variação baseado em ranges
  // Verde: > +3%, Laranja: -3% a +3%, Vermelho: < -3%
  const variationState = calculateVariationState(variation, invertColors);

  // Determina direção da seta
  const isPositive = variation > 0;
  const isNegative = variation < 0;
  const isZero = variation === 0;

  // Classes de tamanho
  const sizeClasses = {
    large: "p-5",
    medium: "p-4",
    small: "p-3",
  };

  const valueSizeClasses = {
    large: "text-3xl",
    medium: "text-2xl",
    small: "text-xl",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100",
        "hover:shadow-md transition-shadow duration-200",
        sizeClasses[size],
        className
      )}
    >
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </h3>
      </div>

      {/* Valor Principal */}
      <div className="mb-2">
        <p className={cn("font-bold text-gray-900", valueSizeClasses[size])}>
          {formatCurrencyBRL(value)}
        </p>
      </div>

      {/* Indicador de Variação */}
      <div className="flex items-center gap-1.5">
        {!isZero && (
          <div
            className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded",
              variationState === "positive" && "bg-green-50",
              variationState === "intermediate" && "bg-orange-50",
              variationState === "negative" && "bg-red-50"
            )}
          >
            {isPositive && (
              <ArrowUp
                className={cn(
                  "w-3 h-3",
                  variationState === "positive" && "text-green-600",
                  variationState === "intermediate" && "text-orange-600",
                  variationState === "negative" && "text-red-600"
                )}
              />
            )}
            {isNegative && (
              <ArrowDown
                className={cn(
                  "w-3 h-3",
                  variationState === "positive" && "text-green-600",
                  variationState === "intermediate" && "text-orange-600",
                  variationState === "negative" && "text-red-600"
                )}
              />
            )}
            <span
              className={cn(
                "text-xs font-semibold",
                variationState === "positive" && "text-green-600",
                variationState === "intermediate" && "text-orange-600",
                variationState === "negative" && "text-red-600"
              )}
            >
              {formatPercentage(Math.abs(variation), false)}
            </span>
          </div>
        )}
        {isZero && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-50">
            <Minus className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400">0,0%</span>
          </div>
        )}
        <span className="text-[10px] text-gray-400">vs mês anterior</span>
      </div>
    </div>
  );
}

