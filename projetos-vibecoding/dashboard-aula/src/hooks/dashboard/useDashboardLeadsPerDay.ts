import { useState, useEffect } from "react";
import type { LeadsPerDayMetrics } from "@/types/dashboard";

/**
 * Hook customizado para buscar dados de Leads por Dia
 * @param month - Mês no formato "YYYY-MM"
 * @returns Dados de leads por dia do mês selecionado
 */
export function useDashboardLeadsPerDay(month: string) {
  const [metrics, setMetrics] = useState<LeadsPerDayMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula chamada à API
    const fetchData = async () => {
      setLoading(true);

      // Mock: gera dados fictícios para o mês selecionado
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Obtém número de dias do mês
      const [year, monthNum] = month.split("-").map(Number);
      const daysInMonth = new Date(year, monthNum, 0).getDate();

      // Gera dados aleatórios para cada dia
      const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const leads = Math.floor(Math.random() * 50) + 10; // 10-60 leads por dia
        const date = new Date(year, monthNum - 1, day).toISOString();

        return { day, leads, date };
      });

      const totalLeads = dailyData.reduce((sum, item) => sum + item.leads, 0);
      const averagePerDay = totalLeads / daysInMonth;
      const peakDayData = dailyData.reduce((max, item) =>
        item.leads > max.leads ? item : max
      );

      setMetrics({
        data: dailyData,
        totalLeads,
        averagePerDay,
        peakDay: {
          day: peakDayData.day,
          leads: peakDayData.leads,
        },
      });

      setLoading(false);
    };

    if (month) {
      fetchData();
    }
  }, [month]);

  return { metrics, loading };
}

