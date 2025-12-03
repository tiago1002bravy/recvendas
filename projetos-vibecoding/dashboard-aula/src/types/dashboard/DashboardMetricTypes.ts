/**
 * Tipos para métricas do dashboard estratégico
 */

export interface FinancialMetricData {
  value: number;
  variation: number; // Percentual de variação (positivo ou negativo)
  previousValue?: number;
}

export interface DashboardFinancialMetrics {
  month: string; // "YYYY-MM" formato
  valueInvested: FinancialMetricData;
  costPerLead: FinancialMetricData;
  costPerMQL: FinancialMetricData;
}

export interface MonthYearOption {
  value: string; // "YYYY-MM"
  label: string; // "Mês YYYY"
}

export type MetricVariationType = "positive" | "negative" | "neutral";

export interface MetricCardProps {
  label: string;
  value: number;
  variation: number;
  invertColors?: boolean; // true para CPL/CPM (redução é bom)
  size?: "large" | "medium" | "small";
}

