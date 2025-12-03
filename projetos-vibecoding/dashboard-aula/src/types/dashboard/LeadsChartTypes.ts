/**
 * Tipos relacionados aos dados de Leads por Dia
 * @module LeadsChartTypes
 */

export interface DailyLeadsData {
  day: number;
  leads: number;
  date: string; // formato ISO para referência
  [key: string]: string | number | undefined; // Index signature para compatibilidade com Recharts
}

export interface LeadsPerDayMetrics {
  data: DailyLeadsData[];
  totalLeads: number;
  averagePerDay: number;
  peakDay: {
    day: number;
    leads: number;
  };
}

