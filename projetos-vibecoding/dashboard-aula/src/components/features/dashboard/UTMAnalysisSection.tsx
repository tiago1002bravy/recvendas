"use client";

import { PieChart, UTMTable } from "@/components/ui/charts";
import type { UTMAnalysisMetrics } from "@/types/dashboard";

interface UTMAnalysisSectionProps {
  title: string;
  columnLabel: string;
  metrics: UTMAnalysisMetrics;
}

export function UTMAnalysisSection({
  title,
  columnLabel,
  metrics,
}: UTMAnalysisSectionProps) {
  if (!metrics || !metrics.data || metrics.data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-sm">Sem dados para este período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Título */}
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>

      {/* Grid 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6">
        {/* Coluna Esquerda - Gráfico de Pizza */}
        <div className="flex items-center justify-center min-h-[350px]">
          <PieChart data={metrics.data} height={350} />
        </div>

        {/* Coluna Direita - Tabela */}
        <div>
          <UTMTable data={metrics.data} columnLabel={columnLabel} />
        </div>
      </div>
    </div>
  );
}

