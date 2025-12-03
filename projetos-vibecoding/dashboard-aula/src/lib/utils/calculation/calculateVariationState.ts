/**
 * Calcula o estado da variação baseado em ranges percentuais
 * 
 * REGRA:
 * - Verde (Bom): variação > +3%
 * - Laranja (Intermediário): variação entre -3% e +3%
 * - Vermelho (Ruim): variação < -3%
 * 
 * @param variation - Valor decimal da variação (ex: 0.15 para 15%)
 * @param invertColors - Se true, inverte a lógica (para custos onde redução é boa)
 * @returns Estado da variação: 'positive' | 'intermediate' | 'negative'
 */
export function calculateVariationState(
  variation: number,
  invertColors: boolean = false
): "positive" | "intermediate" | "negative" {
  const threshold = 0.03; // 3%

  // Determina o estado base
  let state: "positive" | "intermediate" | "negative";

  if (variation > threshold) {
    state = "positive"; // > +3%
  } else if (variation < -threshold) {
    state = "negative"; // < -3%
  } else {
    state = "intermediate"; // Entre -3% e +3%
  }

  // Se invertColors é true (custos), inverte positivo e negativo
  // Intermediário permanece intermediário
  if (invertColors && state !== "intermediate") {
    state = state === "positive" ? "negative" : "positive";
  }

  return state;
}

/**
 * Verifica se a variação é neutra (entre -3% e +3%)
 * @param variation - Valor decimal da variação
 * @returns true se estiver na zona neutra
 */
export function isNeutralVariation(variation: number): boolean {
  return Math.abs(variation) <= 0.03;
}

