"use client";

import { useState, useEffect } from "react";
import type { DashboardFunnelMetrics } from "@/types/dashboard";

/**
 * Hook customizado para buscar métricas do funil de conversão
 * @param month - Mês no formato "YYYY-MM"
 * @returns Métricas do funil e estado de loading
 */
export function useDashboardFunnelMetrics(month: string) {
  const [metrics, setMetrics] = useState<DashboardFunnelMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simula busca de dados (substituir por API real)
    const fetchMetrics = async () => {
      setLoading(true);

      // Simula delay de API
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Dados mockados (substituir por fetch real)
      const mockMetrics: DashboardFunnelMetrics = {
        month,
        leads: {
          label: "Leads",
          value: 450,
          conversionRate: 1.0, // 100% (base do funil)
        },
        mqls: {
          label: "MQLs",
          value: 180,
          conversionRate: 0.4, // 40% dos Leads
        },
        appointments: {
          label: "Agendamentos",
          value: 90,
          conversionRate: 0.5, // 50% dos MQLs
        },
        meetings: {
          label: "Reuniões Realizadas",
          value: 72,
          conversionRate: 0.8, // 80% dos Agendamentos
        },
        sales: {
          label: "Vendas",
          value: 18,
          conversionRate: 0.25, // 25% das Reuniões
        },
      };

      setMetrics(mockMetrics);
      setLoading(false);
    };

    if (month) {
      fetchMetrics();
    }
  }, [month]);

  return { metrics, loading };
}

