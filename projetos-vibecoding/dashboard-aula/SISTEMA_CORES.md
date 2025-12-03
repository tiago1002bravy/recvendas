# 🎨 SISTEMA DE CORES COM PROPÓSITO

## ⚠️ REGRA FUNDAMENTAL

**NUNCA use cores apenas para decoração ou estética.**

**SEMPRE use cores com significado claro e consistente.**

---

## 🎯 Filosofia

### Por que cores devem ter propósito?

1. **Acessibilidade**: Usuários entendem rapidamente o significado
2. **Consistência**: Mesmo significado = mesma cor em todo dashboard
3. **Redução de carga cognitiva**: Cérebro processa cores mais rápido que texto
4. **Design profissional**: Evita poluição visual e confusão

### Quando NÃO usar cores?

Se não há significado de **bom/ruim/neutro**, use **preto, branco ou cinza**.

**Exemplo**: Estágios de um funil não são "bons" ou "ruins", são apenas progressão → use escala de cinza.

---

## 🎨 Sistema de Cores Semânticas

### 🟢 VERDE - Positivo

**Quando usar**:
- ✅ Resultado positivo
- ✅ Meta atingida ou superada
- ✅ Crescimento favorável
- ✅ Conversão acima da média
- ✅ Redução de custo (quando é bom)
- ✅ Aumento de receita

**Exemplos**:
- Variação positiva de receita: `↑ +15,3%` (verde)
- Redução de CPL: `↓ -8,2%` (verde, pois redução é boa)
- Meta atingida: `105% da meta` (verde)

**Classes Tailwind**:
```typescript
bg-green-50     // Background suave
text-green-600  // Texto
border-green-200 // Borda
bg-green-500    // Botões/Destaque
```

---

### 🟠 LARANJA/AMARELO - Intermediário

**Quando usar**:
- ⚠️ Atenção necessária
- ⚠️ Alerta (não é erro, mas precisa de ação)
- ⚠️ Resultado neutro ou em progresso
- ⚠️ Meta quase atingida (80-95%)
- ⚠️ Conversão abaixo do esperado, mas não crítica

**Exemplos**:
- Meta parcialmente atingida: `85% da meta` (laranja)
- Conversão estável: `0,0%` (pode ser laranja ou cinza)
- Alerta de prazo: `Vence em 2 dias` (laranja)

**Classes Tailwind**:
```typescript
bg-orange-50     // Background suave
text-orange-600  // Texto
border-orange-200 // Borda
bg-orange-500    // Botões/Destaque
```

---

### 🔴 VERMELHO - Negativo

**Quando usar**:
- ❌ Resultado negativo
- ❌ Meta não atingida
- ❌ Declínio/Queda prejudicial
- ❌ Erro ou falha
- ❌ Aumento de custo (quando é ruim)
- ❌ Redução de receita

**Exemplos**:
- Variação negativa de receita: `↓ -15,3%` (vermelho)
- Aumento de CPL: `↑ +8,2%` (vermelho, pois aumento é ruim)
- Meta não atingida: `65% da meta` (vermelho)

**Classes Tailwind**:
```typescript
bg-red-50     // Background suave
text-red-600  // Texto
border-red-200 // Borda
bg-red-500    // Botões/Destaque
```

---

### ⚫ PRETO/CINZA - Neutro

**Quando usar**:
- ℹ️ Informação sem conotação de valor
- ℹ️ Progressão/Estágios sem julgamento de bom/ruim
- ℹ️ Dados descritivos
- ℹ️ Estrutura visual
- ℹ️ Texto padrão

**Exemplos**:
- Estágios de funil: `Leads → MQLs → Vendas` (cinza)
- Números descritivos: `450 leads` (preto)
- Labels: `Valor Investido` (cinza)

**Classes Tailwind**:
```typescript
bg-gray-50     // Background suave
text-gray-600  // Texto
border-gray-200 // Borda
bg-gray-900    // Escuro
bg-black       // Preto puro
text-white     // Branco (em fundos escuros)
```

---

## 📋 Exemplos Práticos

### ✅ Correto - Cores com Propósito

#### Exemplo 1: Valor Investido
```typescript
// Variação positiva = Verde (crescimento é bom)
<div className="bg-green-50">
  <ArrowUp className="text-green-600" />
  <span className="text-green-600">+15,3%</span>
</div>
```

#### Exemplo 2: CPL (Custo por Lead)
```typescript
// Variação negativa = Verde (redução de custo é boa)
<div className="bg-green-50">
  <ArrowDown className="text-green-600" />
  <span className="text-green-600">-8,2%</span>
</div>
```

#### Exemplo 3: Funil de Conversão
```typescript
// Estágios não têm conotação de bom/ruim = Cinza
<div className="bg-gray-900 text-white">
  <h3>Leads</h3>
  <p>450</p>
</div>
```

---

### ❌ Errado - Cores Decorativas

#### Exemplo 1: Azul sem Propósito
```typescript
// ❌ Por que azul? Não há significado
<div className="bg-blue-500">
  <h3>Leads</h3>
</div>
```

#### Exemplo 2: Roxo Apenas Estético
```typescript
// ❌ Roxo para "ficar bonito"
<div className="bg-purple-600">
  <p>Conversão Total</p>
</div>
```

---

## 🔄 Lógica Invertida

### Quando Redução é BOA (use Verde)

**Métricas onde MENOR é MELHOR**:
- CPL (Custo por Lead) ↓
- CPM (Custo por MQL) ↓
- CAC (Custo de Aquisição) ↓
- Churn Rate ↓
- Taxa de Rejeição ↓

```typescript
// Implementação com `invertColors`
<MetricCard
  label="Custo por Lead"
  value={34.27}
  variation={-0.082}  // -8,2%
  invertColors={true} // ✅ Vermelho → Verde (redução é boa)
/>
```

---

## 📊 Aplicação no Dashboard

### Seção 1: Métricas Financeiras

| Métrica | Variação | Cor | Motivo |
|---------|----------|-----|--------|
| Valor Investido | +15,3% | 🟢 Verde | Aumento é bom |
| CPL | -8,2% | 🟢 Verde | Redução é boa |
| CPM | -12,5% | 🟢 Verde | Redução é boa |

### Seção 2: Funil de Conversão

| Estágio | Cor | Motivo |
|---------|-----|--------|
| Leads | ⚫ Preto | Progressão neutra |
| MQLs | ⚫ Cinza escuro | Progressão neutra |
| Agendamentos | ⚫ Cinza escuro | Progressão neutra |
| Reuniões | ⚫ Cinza escuro | Progressão neutra |
| Vendas | ⚫ Cinza médio | Progressão neutra |

**Por que não usar verde no final?**
- Vendas não é "melhor" que Leads
- É apenas a última etapa do funil
- Não há julgamento de valor → use neutro

---

## 🛠️ Implementação

### Constantes de Cores
📍 `src/lib/constants/SEMANTIC_COLORS.ts`

```typescript
export const SEMANTIC_COLORS = {
  POSITIVE: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
  },
  NEGATIVE: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
  INTERMEDIATE: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  NEUTRAL: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};
```

### Uso nos Componentes
```typescript
import { SEMANTIC_COLORS } from "@/lib/constants";

// Positivo
<div className={SEMANTIC_COLORS.POSITIVE.bg}>
  <span className={SEMANTIC_COLORS.POSITIVE.text}>+15,3%</span>
</div>

// Negativo
<div className={SEMANTIC_COLORS.NEGATIVE.bg}>
  <span className={SEMANTIC_COLORS.NEGATIVE.text}>-8,2%</span>
</div>

// Neutro
<div className={SEMANTIC_COLORS.NEUTRAL.bg}>
  <span className={SEMANTIC_COLORS.NEUTRAL.text}>450 leads</span>
</div>
```

---

## ✅ Checklist de Validação

Antes de usar uma cor, pergunte-se:

- [ ] Esta cor tem um significado claro?
- [ ] O usuário entenderá o que a cor representa?
- [ ] A cor é consistente com o resto do dashboard?
- [ ] Se eu remover a cor, perco informação importante?
- [ ] Estou usando verde para algo positivo?
- [ ] Estou usando vermelho para algo negativo?
- [ ] Estou usando cinza para algo neutro?

Se respondeu "não" para qualquer pergunta, **não use a cor**.

---

## 🎨 Escala de Cinza para Hierarquia

Quando não há significado semântico, use cinza para criar hierarquia visual:

```
Mais escuro = Mais importante
Mais claro = Menos importante

bg-black       → Título principal
bg-gray-900    → Subtítulo
bg-gray-700    → Texto secundário
bg-gray-500    → Texto terciário
bg-gray-300    → Bordas
bg-gray-100    → Background suave
bg-gray-50     → Background muito suave
```

---

## 📚 Resumo

### ✅ SEMPRE
- Use verde para positivo
- Use vermelho para negativo
- Use laranja para intermediário
- Use cinza para neutro
- Mantenha consistência
- Pergunte: "Esta cor comunica algo?"

### ❌ NUNCA
- Use cores apenas para "ficar bonito"
- Use azul, roxo, rosa sem propósito
- Misture significados de cores
- Use cores diferentes para mesmo significado
- Ignore a regra de cores semânticas

---

**Esta regra é LEI. Siga-a RIGOROSAMENTE em todo o dashboard.**

