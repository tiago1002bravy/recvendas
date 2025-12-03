"use client";

import { useState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { MetricCard } from "@/components/ui/card";
import { generateMonthYearOptions } from "@/lib/utils/formatting";
import { useDashboardFinancialMetrics } from "@/hooks/dashboard";

interface DashboardMetricsHeaderProps {
  onMonthChange?: (month: string) => void;
}

export function DashboardMetricsHeader({ onMonthChange }: DashboardMetricsHeaderProps) {
  // Gera opções de mês/ano (últimos 12 meses)
  const monthOptions = generateMonthYearOptions(12);
  
  // Estado do mês selecionado (inicializa com mês atual)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthOptions[0]?.value || ""
  );

  // Hook customizado para buscar métricas do mês selecionado
  const { metrics, loading } = useDashboardFinancialMetrics(selectedMonth);

  // Notifica o parent sobre o mês inicial
  useEffect(() => {
    if (selectedMonth && onMonthChange) {
      onMonthChange(selectedMonth);
    }
  }, []); // Só executa uma vez no mount

  // Callback quando mês muda
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    onMonthChange?.(month);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-36 bg-gray-200 rounded-xl"></div>
            <div className="h-36 bg-gray-200 rounded-xl"></div>
            <div className="h-36 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-6">
      {/* Seletor de Mês/Ano */}
      <div className="mb-6">
        <Select
          options={monthOptions}
          value={selectedMonth}
          onChange={handleMonthChange}
          placeholder="Selecione o mês"
          className="w-full md:w-auto"
        />
      </div>

      {/* Grid de Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Valor Investido - Card Grande */}
        <MetricCard
          label="Valor Investido"
          value={metrics.valueInvested.value}
          variation={metrics.valueInvested.variation}
          size="large"
          invertColors={false}
        />

        {/* Custo por Lead - CPL */}
        <MetricCard
          label="Custo por Lead"
          value={metrics.costPerLead.value}
          variation={metrics.costPerLead.variation}
          size="medium"
          invertColors={true} // Redução é bom (verde para negativo)
        />

        {/* Custo por MQL - CPM */}
        <MetricCard
          label="Custo por MQL"
          value={metrics.costPerMQL.value}
          variation={metrics.costPerMQL.variation}
          size="medium"
          invertColors={true} // Redução é bom (verde para negativo)
        />
      </div>
    </section>
  );
}

