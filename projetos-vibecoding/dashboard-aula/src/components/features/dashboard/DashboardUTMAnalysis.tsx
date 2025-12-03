"use client";

import { useDashboardUTMAnalysis } from "@/hooks/dashboard";
import { UTMAnalysisSection } from "./UTMAnalysisSection";

interface DashboardUTMAnalysisProps {
  month: string;
}

export function DashboardUTMAnalysis({ month }: DashboardUTMAnalysisProps) {
  const { metrics, loading } = useDashboardUTMAnalysis(month);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-64 bg-gray-100 rounded"></div>
                  <div className="h-64 bg-gray-100 rounded"></div>
                </div>
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

  return (
    <section className="container mx-auto px-4 py-6">
      {/* Título da Seção Principal */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Análise de UTMs</h2>
        <p className="text-sm text-gray-600">
          Distribuição e performance por parâmetros de campanha
        </p>
      </div>

      {/* Stack de Subseções */}
      <div className="space-y-6">
        {/* SEÇÃO 4A - UTM Medium */}
        <UTMAnalysisSection
          title="UTM Medium"
          columnLabel="UTM MEDIUM"
          metrics={metrics.medium}
        />

        {/* SEÇÃO 4B - UTM Source */}
        <UTMAnalysisSection
          title="UTM Source"
          columnLabel="UTM SOURCE"
          metrics={metrics.source}
        />

        {/* SEÇÃO 4C - UTM Campaign */}
        <UTMAnalysisSection
          title="UTM Campaign"
          columnLabel="UTM CAMPAIGN"
          metrics={metrics.campaign}
        />

        {/* SEÇÃO 4D - UTM Content */}
        <UTMAnalysisSection
          title="UTM Content"
          columnLabel="UTM CONTENT"
          metrics={metrics.content}
        />

        {/* SEÇÃO 4E - UTM Term */}
        <UTMAnalysisSection
          title="UTM Term"
          columnLabel="UTM TERM"
          metrics={metrics.term}
        />
      </div>
    </section>
  );
}

