/**
 * Sistema de Cores Semânticas
 * 
 * REGRA: Cores devem SEMPRE ter propósito e significado claro.
 * NUNCA use cores apenas para decoração.
 */

export const SEMANTIC_COLORS = {
  // 🟢 POSITIVO - Bom, Sucesso, Meta Atingida, Crescimento Favorável
  POSITIVE: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
    hover: "hover:bg-green-100",
    dark: "bg-green-500",
  },

  // 🟠 INTERMEDIÁRIO - Atenção, Alerta, Neutro, Em Progresso
  INTERMEDIATE: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
    hover: "hover:bg-orange-100",
    dark: "bg-orange-500",
  },

  // 🔴 NEGATIVO - Ruim, Erro, Meta Não Atingida, Declínio
  NEGATIVE: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    hover: "hover:bg-red-100",
    dark: "bg-red-500",
  },

  // ⚫ NEUTRO - Informativo, Sem Conotação de Valor
  NEUTRAL: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    hover: "hover:bg-gray-100",
    dark: "bg-gray-900",
    black: "bg-black",
  },
} as const;

/**
 * Helper para determinar cor baseada em um valor booleano
 * @param isGood - Se true, retorna cores positivas; se false, negativas
 * @returns Objeto com classes de cores
 */
export function getSemanticColor(isGood: boolean) {
  return isGood ? SEMANTIC_COLORS.POSITIVE : SEMANTIC_COLORS.NEGATIVE;
}

/**
 * Helper para determinar cor baseada em três estados
 * @param state - 'positive' | 'intermediate' | 'negative'
 * @returns Objeto com classes de cores
 */
export function getSemanticColorByState(
  state: "positive" | "intermediate" | "negative"
) {
  switch (state) {
    case "positive":
      return SEMANTIC_COLORS.POSITIVE;
    case "intermediate":
      return SEMANTIC_COLORS.INTERMEDIATE;
    case "negative":
      return SEMANTIC_COLORS.NEGATIVE;
  }
}

