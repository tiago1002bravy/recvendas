"use client";

import { FunnelStageCard } from "@/components/ui/funnel";
import { useDashboardFunnelMetrics } from "@/hooks/dashboard";

interface DashboardConversionFunnelProps {
  month: string;
}

export function DashboardConversionFunnel({ month }: DashboardConversionFunnelProps) {
  const { metrics, loading } = useDashboardFunnelMetrics(month);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-2 flex flex-col items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full max-w-md">
                <div className="h-24 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!metrics) {
    return null;
  }

  // Calcula larguras proporcionais baseadas no valor de Leads (base = 100%)
  const maxValue = metrics.leads.value;
  const calculateWidth = (value: number) => (value / maxValue) * 100;

  const stages = [
    {
      ...metrics.leads,
      width: calculateWidth(metrics.leads.value),
      color: "bg-black",
      isFirst: true as boolean,
      isLast: false as boolean,
    },
    {
      ...metrics.mqls,
      width: calculateWidth(metrics.mqls.value),
      color: "bg-gray-900",
      isFirst: false as boolean,
      isLast: false as boolean,
    },
    {
      ...metrics.appointments,
      width: calculateWidth(metrics.appointments.value),
      color: "bg-gray-900",
      isFirst: false as boolean,
      isLast: false as boolean,
    },
    {
      ...metrics.meetings,
      width: calculateWidth(metrics.meetings.value),
      color: "bg-gray-900",
      isFirst: false as boolean,
      isLast: false as boolean,
    },
    {
      ...metrics.sales,
      width: calculateWidth(metrics.sales.value),
      color: "bg-gray-700",
      isFirst: false as boolean,
      isLast: true as boolean,
    },
  ];

  return (
    <section className="container mx-auto px-4 py-6">
      {/* Título da Seção */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Funil de Conversão</h2>
        <p className="text-sm text-gray-600">
          Acompanhe a jornada completa do lead até a venda
        </p>
      </div>

      {/* Funil Vertical */}
      <div className="space-y-0">
        {stages.map((stage, index) => {
          const nextStage = stages[index + 1];
          const hasNextStage = index < stages.length - 1;

          // Calcula % em relação à etapa anterior (seta esquerda)
          const conversionFromPrevious = hasNextStage 
            ? (nextStage.value / stage.value) * 100 
            : 0;

          // Calcula % em relação à primeira etapa/Leads (seta direita)
          const conversionFromFirst = hasNextStage 
            ? (nextStage.value / metrics.leads.value) * 100 
            : 0;

          return (
            <div key={stage.label} className="flex flex-col items-center">
              {/* Card do estágio */}
              <div className="w-full max-w-md">
                <FunnelStageCard
                  label={stage.label}
                  value={stage.value}
                  conversionRate={stage.conversionRate}
                  widthPercentage={100}
                  color={stage.color}
                  isFirst={stage.isFirst}
                  isLast={stage.isLast}
                />
              </div>

              {/* Badges de conversão (se não for o último estágio) */}
              {hasNextStage && (
                <div className="relative w-full max-w-5xl h-16 flex items-center justify-center py-2">
                  {/* Badge Esquerda - % em relação à etapa anterior */}
                  <div className="absolute left-8 top-1/2 -translate-y-1/2">
                    <div className="bg-white border border-black rounded-lg px-3 py-1.5 shadow-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-black">
                          {conversionFromPrevious.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-gray-600 font-medium leading-tight">
                          vs etapa anterior
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conector central com seta para baixo */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-gray-300"></div>
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-300"></div>
                  </div>

                  {/* Badge Direita - % em relação à primeira etapa (Leads) */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <div className="bg-white border border-black rounded-lg px-3 py-1.5 shadow-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-black">
                          {conversionFromFirst.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-gray-600 font-medium leading-tight">
                          vs Leads (base)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo de Conversão Total */}
      <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-0.5">
              Conversão Total (Lead → Venda)
            </h3>
            <p className="text-xs text-gray-600">
              De {metrics.leads.value} leads para {metrics.sales.value} vendas
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-black">
              {((metrics.sales.value / metrics.leads.value) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">taxa de conversão</div>
          </div>
        </div>
      </div>
    </section>
  );
}

