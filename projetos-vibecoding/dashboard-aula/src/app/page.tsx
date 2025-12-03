"use client";

import { useState } from "react";
import {
  DashboardMetricsHeader,
  DashboardConversionFunnel,
  DashboardLeadsPerDay,
  DashboardUTMAnalysis,
} from "@/components/features/dashboard";
import { generateMonthYearOptions } from "@/lib/utils/formatting";

export default function HomePage() {
  // Gera mês atual como valor inicial
  const currentMonth = generateMonthYearOptions(1)[0]?.value || "";
  
  // Estado global do mês selecionado
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Seção 1: Header e Métricas Financeiras */}
      <DashboardMetricsHeader onMonthChange={setSelectedMonth} />

      {/* Divisor */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gray-200"></div>
      </div>

      {/* Seção 2: Funil de Conversão */}
      {selectedMonth && <DashboardConversionFunnel month={selectedMonth} />}

      {/* Divisor */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gray-200"></div>
      </div>

      {/* Seção 3: Leads por Dia */}
      {selectedMonth && <DashboardLeadsPerDay month={selectedMonth} />}

      {/* Divisor */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gray-200"></div>
      </div>

      {/* Seção 4: Análise de UTMs */}
      {selectedMonth && <DashboardUTMAnalysis month={selectedMonth} />}
    </main>
  );
}

