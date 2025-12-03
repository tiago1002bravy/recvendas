"use client";

import { BarChart } from "@/components/ui/charts";
import { useDashboardLeadsPerDay } from "@/hooks/dashboard";

interface DashboardLeadsPerDayProps {
  month: string;
}

export function DashboardLeadsPerDay({ month }: DashboardLeadsPerDayProps) {
  const { metrics, loading } = useDashboardLeadsPerDay(month);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-80 bg-gray-100 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-6">
      {/* Título da Seção */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Leads por Dia</h2>
        <p className="text-sm text-gray-600">
          Distribuição diária de leads ao longo do mês
        </p>
      </div>

      {/* Card com Gráfico */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <BarChart
          data={metrics.data}
          height={350}
          barColor="#2563eb"
          xAxisLabel="Dia do Mês"
          yAxisLabel="Leads"
        />

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Total de Leads</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalLeads}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Média por Dia</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.averagePerDay.toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Dia com Mais Leads</p>
            <p className="text-2xl font-bold text-blue-600">
              Dia {metrics.peakDay.day} ({metrics.peakDay.leads})
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

