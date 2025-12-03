/**
 * Tipos para funil de conversão do dashboard
 */

export interface FunnelStageData {
  label: string;
  value: number;
  conversionRate: number; // Percentual em relação ao estágio anterior (0-1)
  color?: string;
}

export interface DashboardFunnelMetrics {
  month: string; // "YYYY-MM"
  leads: FunnelStageData;
  mqls: FunnelStageData;
  appointments: FunnelStageData;
  meetings: FunnelStageData;
  sales: FunnelStageData;
}

export type FunnelStageType = "leads" | "mqls" | "appointments" | "meetings" | "sales";

