"use client";

import { formatCurrencyBRL } from "@/lib/utils/formatting";
import type { UTMDataItem } from "@/types/dashboard";

interface UTMTableProps {
  data: UTMDataItem[];
  columnLabel: string; // "UTM MEDIUM", "UTM SOURCE", etc.
}

export function UTMTable({ data, columnLabel }: UTMTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <p className="text-gray-500 text-sm">Sem dados para este período</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              {columnLabel}
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              Quantidade
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
              Valor Total
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((item, index) => (
            <tr
              key={`${item.name}-${index}`}
              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                {item.name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-center border-b border-gray-200">
                {item.quantity}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right border-b border-gray-200">
                {formatCurrencyBRL(item.totalValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

