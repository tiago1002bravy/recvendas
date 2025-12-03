"use client";

import { useState, useEffect } from "react";
import type { DashboardFinancialMetrics } from "@/types/dashboard";

/**
 * Hook customizado para buscar métricas financeiras do dashboard
 * @param month - Mês no formato "YYYY-MM"
 * @returns Métricas financeiras e estado de loading
 */
export function useDashboardFinancialMetrics(month: string) {
  const [metrics, setMetrics] = useState<DashboardFinancialMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simula busca de dados (substituir por API real)
    const fetchMetrics = async () => {
      setLoading(true);

      // Simula delay de API
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Dados mockados (substituir por fetch real)
      const mockMetrics: DashboardFinancialMetrics = {
        month,
        valueInvested: {
          value: 15420.0,
          variation: 0.153, // +15.3%
          previousValue: 13350.0,
        },
        costPerLead: {
          value: 34.27,
          variation: -0.082, // -8.2% (redução é bom)
          previousValue: 37.33,
        },
        costPerMQL: {
          value: 85.67,
          variation: -0.125, // -12.5% (redução é bom)
          previousValue: 97.91,
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

