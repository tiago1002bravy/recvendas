import { useState, useEffect } from "react";
import type { UTMAnalysisData } from "@/types/dashboard";

/**
 * Hook customizado para buscar dados de Análise de UTMs
 * @param month - Mês no formato "YYYY-MM"
 * @returns Dados de análise de UTMs
 */
export function useDashboardUTMAnalysis(month: string) {
  const [metrics, setMetrics] = useState<UTMAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula chamada à API
    const fetchData = async () => {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 400));

      // Cores para gráficos de pizza
      const CHART_COLORS = [
        "#2563eb", // blue-600
        "#dc2626", // red-600
        "#16a34a", // green-600
        "#eab308", // yellow-500
        "#9333ea", // purple-600
        "#ea580c", // orange-600
        "#06b6d4", // cyan-500
        "#ec4899", // pink-500
      ];

      // Mock: UTM Medium
      const mediumData = [
        { name: "cpc", quantity: 84, totalValue: 9021.98 },
        { name: "--", quantity: 13, totalValue: 1723.0 },
        { name: "email_marketing", quantity: 4, totalValue: 322.91 },
        { name: "recovery", quantity: 1, totalValue: 41.91 },
        { name: "live", quantity: 1, totalValue: 67.0 },
      ];

      const mediumTotal = mediumData.reduce((sum, item) => sum + item.quantity, 0);
      const mediumTotalValue = mediumData.reduce((sum, item) => sum + item.totalValue, 0);

      // Mock: UTM Source
      const sourceData = [
        { name: "--", quantity: 126, totalValue: 14602.0 },
        { name: "wpp", quantity: 7, totalValue: 921.0 },
      ];

      const sourceTotal = sourceData.reduce((sum, item) => sum + item.quantity, 0);
      const sourceTotalValue = sourceData.reduce((sum, item) => sum + item.totalValue, 0);

      // Mock: UTM Campaign
      const campaignData = [
        { name: "black_friday_2024", quantity: 45, totalValue: 5234.56 },
        { name: "lancamento_produto", quantity: 32, totalValue: 3821.45 },
        { name: "webinar_gratuito", quantity: 18, totalValue: 1987.32 },
        { name: "--", quantity: 8, totalValue: 479.47 },
      ];

      const campaignTotal = campaignData.reduce((sum, item) => sum + item.quantity, 0);
      const campaignTotalValue = campaignData.reduce((sum, item) => sum + item.totalValue, 0);

      // Mock: UTM Content
      const contentData = [
        { name: "banner_principal", quantity: 28, totalValue: 3245.78 },
        { name: "video_tutorial", quantity: 22, totalValue: 2534.21 },
        { name: "carousel_stories", quantity: 15, totalValue: 1789.34 },
        { name: "post_organico", quantity: 12, totalValue: 1234.56 },
        { name: "--", quantity: 26, totalValue: 718.91 },
      ];

      const contentTotal = contentData.reduce((sum, item) => sum + item.quantity, 0);
      const contentTotalValue = contentData.reduce((sum, item) => sum + item.totalValue, 0);

      // Mock: UTM Term
      const termData = [
        { name: "marketing_digital", quantity: 19, totalValue: 2145.87 },
        { name: "curso_online", quantity: 14, totalValue: 1678.43 },
        { name: "consultoria", quantity: 9, totalValue: 987.65 },
        { name: "--", quantity: 61, totalValue: 6710.85 },
      ];

      const termTotal = termData.reduce((sum, item) => sum + item.quantity, 0);
      const termTotalValue = termData.reduce((sum, item) => sum + item.totalValue, 0);

      // Adiciona percentuais e cores
      const addPercentageAndColor = (data: any[], total: number) =>
        data.map((item, index) => ({
          ...item,
          percentage: (item.quantity / total) * 100,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }));

      setMetrics({
        medium: {
          data: addPercentageAndColor(mediumData, mediumTotal),
          totalLeads: mediumTotal,
          totalValue: mediumTotalValue,
        },
        source: {
          data: addPercentageAndColor(sourceData, sourceTotal),
          totalLeads: sourceTotal,
          totalValue: sourceTotalValue,
        },
        campaign: {
          data: addPercentageAndColor(campaignData, campaignTotal),
          totalLeads: campaignTotal,
          totalValue: campaignTotalValue,
        },
        content: {
          data: addPercentageAndColor(contentData, contentTotal),
          totalLeads: contentTotal,
          totalValue: contentTotalValue,
        },
        term: {
          data: addPercentageAndColor(termData, termTotal),
          totalLeads: termTotal,
          totalValue: termTotalValue,
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

