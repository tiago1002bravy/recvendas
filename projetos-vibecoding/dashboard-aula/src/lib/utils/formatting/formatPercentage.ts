/**
 * Formata um valor numérico como percentual
 * @param value - Valor decimal (ex: 0.153 para 15.3%)
 * @param showSign - Se deve incluir sinal + para valores positivos
 * @returns String formatada como percentual (ex: +15,3% ou -8,2%)
 */
export function formatPercentage(value: number, showSign: boolean = true): string {
  const percentage = (value * 100).toFixed(1).replace(".", ",");
  
  if (value > 0 && showSign) {
    return `+${percentage}%`;
  }
  
  return `${percentage}%`;
}

