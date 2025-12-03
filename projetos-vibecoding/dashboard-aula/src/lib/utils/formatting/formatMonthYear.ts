/**
 * Formata uma data YYYY-MM para formato brasileiro "Mês YYYY"
 * @param dateString - String no formato "YYYY-MM"
 * @returns String formatada (ex: "Novembro 2024")
 */
export function formatMonthYear(dateString: string): string {
  const [year, month] = dateString.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Gera uma lista de opções de mês/ano para os últimos N meses
 * @param months - Número de meses a gerar
 * @returns Array de opções { value, label }
 */
export function generateMonthYearOptions(months: number = 12): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const today = new Date();
  
  for (let i = 0; i < months; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const value = `${year}-${month}`;
    const label = formatMonthYear(value);
    
    options.push({ value, label });
  }
  
  return options;
}

