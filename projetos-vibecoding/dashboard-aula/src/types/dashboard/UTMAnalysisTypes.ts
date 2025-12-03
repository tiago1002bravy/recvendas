/**
 * Tipos relacionados à Análise de UTMs
 * @module UTMAnalysisTypes
 */

export interface UTMDataItem {
  name: string; // utm_medium, utm_source, etc.
  quantity: number;
  totalValue: number; // valor em BRL
  percentage: number; // % do total
  color?: string; // cor para o gráfico de pizza
  [key: string]: string | number | undefined; // Index signature para compatibilidade com Recharts
}

export interface UTMAnalysisMetrics {
  data: UTMDataItem[];
  totalLeads: number;
  totalValue: number;
}

export interface UTMAnalysisData {
  medium: UTMAnalysisMetrics;
  source: UTMAnalysisMetrics;
  campaign: UTMAnalysisMetrics;
  content: UTMAnalysisMetrics;
  term: UTMAnalysisMetrics;
}

