# 📊 Documentação: Orderbumps para Dashboard

## 🎯 Conceito Importante

**Orderbumps são produtos diferentes do ingresso principal**. No banco de dados, **cada produto é um registro separado**, mesmo que seja do mesmo cliente.

### Diferença Fundamental

| Tipo | Regra de Unicidade | Exemplo |
|------|-------------------|---------|
| **Produto Principal** (Ingresso) | 1 registro por email + projeto | João comprou ingresso → 1 registro |
| **Orderbumps** | 1 registro por email + projeto + **produto** | João comprou ingresso + gravação + prompts → **3 registros** |

---

## 📋 Estrutura no Banco de Dados

### Tabela: `recuperacao_vendas`

Cada venda (principal ou orderbump) é um **registro separado**:

```sql
-- Exemplo: João comprou 3 produtos diferentes
-- Resultado: 3 registros no banco

Registro 1:
- email_lead: "joao@exemplo.com"
- produto: "Ingresso + Template Escala 26"
- valor: 147.00
- liquidado: 138.66

Registro 2:
- email_lead: "joao@exemplo.com"
- produto: "Gravação - Operação escala 26"
- valor: 197.00
- liquidado: 186.17

Registro 3:
- email_lead: "joao@exemplo.com"
- produto: "5 Prompts de mapeamento de processos"
- valor: 19.90
- liquidado: 17.91
```

---

## 🔍 Identificação de Orderbumps

### Campo: `dados_originais->>'tipo_produto'`

Orderbumps têm `tipo_produto = 'orderbump'` no campo `dados_originais`:

```sql
-- Verificar se é orderbump
SELECT *
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND dados_originais->>'tipo_produto' = 'orderbump';
```

### Produtos de Orderbumps

1. **Gravação - Operação escala 26**
2. **5 Prompts de mapeamento de processos**

---

## 📊 Queries para Dashboard

### 1. Total de Orderbumps Vendidos

```sql
SELECT 
  COUNT(*) as total_orderbumps_vendidos,
  SUM(liquidado) as valor_liquido_total
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND dados_originais->>'tipo_produto' = 'orderbump'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso']);
```

### 2. Orderbumps por Produto

```sql
SELECT 
  produto,
  COUNT(*) as quantidade_vendas,
  COUNT(*) FILTER (WHERE acao_tomada @> ARRAY['paid'] AND liquidado > 0) as compradores_pagos,
  SUM(valor) FILTER (WHERE acao_tomada @> ARRAY['paid'] AND liquidado > 0) as valor_bruto_total,
  SUM(liquidado) FILTER (WHERE acao_tomada @> ARRAY['paid'] AND liquidado > 0) as valor_liquido_total
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND dados_originais->>'tipo_produto' = 'orderbump'
GROUP BY produto
ORDER BY valor_liquido_total DESC;
```

### 3. Quem Comprou Orderbumps

```sql
SELECT 
  email_lead,
  nome_lead,
  produto,
  valor,
  liquidado,
  created_original as data_compra
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND dados_originais->>'tipo_produto' = 'orderbump'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
ORDER BY created_original DESC;
```

### 4. Quem Comprou Ingresso E Orderbumps

```sql
-- Pessoas que compraram ingresso E também compraram orderbumps
WITH compradores_ingresso AS (
  SELECT DISTINCT email_lead
  FROM recuperacao_vendas
  WHERE projeto = 'escala-26'
    AND acao_tomada @> ARRAY['paid']
    AND liquidado > 0
    AND NOT (acao_tomada @> ARRAY['refunded'])
    AND NOT (acao_tomada @> ARRAY['reembolso'])
    AND (
      produto ILIKE '%Ingresso Escala 26%'
      OR produto ILIKE '%Ingresso + Template%'
      OR produto ILIKE '%ingresso%'
    )
    AND (dados_originais->>'tipo_produto' IS NULL OR dados_originais->>'tipo_produto' != 'orderbump')
),
compradores_orderbumps AS (
  SELECT DISTINCT email_lead
  FROM recuperacao_vendas
  WHERE projeto = 'escala-26'
    AND dados_originais->>'tipo_produto' = 'orderbump'
    AND acao_tomada @> ARRAY['paid']
    AND liquidado > 0
    AND NOT (acao_tomada @> ARRAY['refunded'])
    AND NOT (acao_tomada @> ARRAY['reembolso'])
)
SELECT 
  ci.email_lead,
  rv.nome_lead,
  rv.produto as produto_orderbump,
  rv.valor,
  rv.liquidado,
  rv.created_original
FROM compradores_ingresso ci
INNER JOIN compradores_orderbumps co ON ci.email_lead = co.email_lead
INNER JOIN recuperacao_vendas rv ON ci.email_lead = rv.email_lead
WHERE rv.projeto = 'escala-26'
  AND rv.dados_originais->>'tipo_produto' = 'orderbump'
  AND rv.acao_tomada @> ARRAY['paid']
  AND rv.liquidado > 0
  AND NOT (rv.acao_tomada @> ARRAY['refunded'])
  AND NOT (rv.acao_tomada @> ARRAY['reembolso'])
ORDER BY rv.created_original DESC;
```

### 5. Resumo Completo: Ingressos + Orderbumps

```sql
-- Resumo geral incluindo orderbumps
SELECT 
  CASE 
    WHEN dados_originais->>'tipo_produto' = 'orderbump' THEN 'Orderbump'
    ELSE 'Produto Principal'
  END as tipo_produto,
  produto,
  COUNT(*) FILTER (
    WHERE acao_tomada @> ARRAY['paid']
    AND liquidado > 0
    AND NOT (acao_tomada @> ARRAY['refunded'])
    AND NOT (acao_tomada @> ARRAY['reembolso'])
  ) as compradores_pagos,
  SUM(liquidado) FILTER (
    WHERE acao_tomada @> ARRAY['paid']
    AND liquidado > 0
    AND NOT (acao_tomada @> ARRAY['refunded'])
    AND NOT (acao_tomada @> ARRAY['reembolso'])
  ) as valor_liquido_total
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
GROUP BY tipo_produto, produto
ORDER BY tipo_produto, valor_liquido_total DESC;
```

### 6. Taxa de Conversão de Orderbumps

```sql
-- Quantos compradores de ingresso também compraram orderbumps?
WITH total_compradores_ingresso AS (
  SELECT COUNT(DISTINCT email_lead) as total
  FROM recuperacao_vendas
  WHERE projeto = 'escala-26'
    AND acao_tomada @> ARRAY['paid']
    AND liquidado > 0
    AND NOT (acao_tomada @> ARRAY['refunded'])
    AND NOT (acao_tomada @> ARRAY['reembolso'])
    AND (
      produto ILIKE '%Ingresso Escala 26%'
      OR produto ILIKE '%Ingresso + Template%'
      OR produto ILIKE '%ingresso%'
    )
    AND (dados_originais->>'tipo_produto' IS NULL OR dados_originais->>'tipo_produto' != 'orderbump')
),
compradores_com_orderbumps AS (
  SELECT COUNT(DISTINCT email_lead) as total
  FROM recuperacao_vendas
  WHERE projeto = 'escala-26'
    AND dados_originais->>'tipo_produto' = 'orderbump'
    AND acao_tomada @> ARRAY['paid']
    AND liquidado > 0
    AND NOT (acao_tomada @> ARRAY['refunded'])
    AND NOT (acao_tomada @> ARRAY['reembolso')
)
SELECT 
  ci.total as total_compradores_ingresso,
  co.total as compradores_com_orderbumps,
  ROUND(co.total * 100.0 / NULLIF(ci.total, 0), 2) as taxa_conversao_orderbumps_percent
FROM total_compradores_ingresso ci
CROSS JOIN compradores_com_orderbumps co;
```

---

## ⚠️ Regras Importantes

### 1. Múltiplos Registros por Cliente

**✅ CORRETO**: Um cliente pode ter múltiplos registros se comprou produtos diferentes:

```sql
-- João comprou 3 produtos → 3 registros
SELECT email_lead, produto, valor, liquidado
FROM recuperacao_vendas
WHERE email_lead = 'joao@exemplo.com'
  AND projeto = 'escala-26';
```

**Resultado esperado**:
- Registro 1: Ingresso + Template (R$ 138,66)
- Registro 2: Gravação (R$ 186,17)
- Registro 3: Prompts (R$ 17,91)

### 2. Identificação de Orderbumps

Sempre use `dados_originais->>'tipo_produto' = 'orderbump'` para identificar orderbumps:

```sql
-- ✅ CORRETO: Filtrar orderbumps
WHERE dados_originais->>'tipo_produto' = 'orderbump'

-- ❌ ERRADO: Não usar apenas nome do produto
WHERE produto ILIKE '%Gravação%'  -- Pode pegar produtos principais também
```

### 3. Cálculo de Valores

**Para calcular totais**, some os valores de **todos os registros**:

```sql
-- Valor total (ingressos + orderbumps)
SELECT SUM(liquidado)
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso']);
```

### 4. Contagem de Compradores

**Para contar compradores únicos**, use `COUNT(DISTINCT email_lead)`:

```sql
-- Total de pessoas que compraram (qualquer produto)
SELECT COUNT(DISTINCT email_lead) as total_compradores
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso']);
```

---

## 📊 Exemplos Práticos

### Exemplo 1: Dashboard de Vendas Totais

```sql
-- Incluir orderbumps no valor total
SELECT 
  'Total Geral' as categoria,
  COUNT(DISTINCT email_lead) as total_compradores,
  COUNT(*) as total_vendas,
  SUM(liquidado) as valor_liquido_total
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso']);
```

### Exemplo 2: Separar Ingressos de Orderbumps

```sql
SELECT 
  CASE 
    WHEN dados_originais->>'tipo_produto' = 'orderbump' THEN 'Orderbumps'
    ELSE 'Ingressos'
  END as categoria,
  COUNT(*) as quantidade_vendas,
  SUM(liquidado) as valor_liquido_total
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
GROUP BY categoria;
```

### Exemplo 3: Lista de Clientes com Todos os Produtos

```sql
-- Ver todos os produtos comprados por cada cliente
SELECT 
  email_lead,
  nome_lead,
  STRING_AGG(produto, ' + ') as produtos_comprados,
  COUNT(*) as quantidade_produtos,
  SUM(liquidado) as valor_total_gasto
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
GROUP BY email_lead, nome_lead
ORDER BY valor_total_gasto DESC;
```

---

## 🎯 Resumo para Dashboard

### Campos Importantes

1. **`produto`**: Nome do produto (Ingresso, Gravação, Prompts, etc.)
2. **`dados_originais->>'tipo_produto'`**: `'orderbump'` para orderbumps, `NULL` para produtos principais
3. **`email_lead`**: Email do cliente (pode ter múltiplos registros)
4. **`liquidado`**: Valor líquido recebido

### Regras de Negócio

1. ✅ **Cada produto = 1 registro** (mesmo cliente pode ter múltiplos registros)
2. ✅ **Orderbumps identificados por**: `dados_originais->>'tipo_produto' = 'orderbump'`
3. ✅ **Para totais**: Some todos os registros
4. ✅ **Para contagem de pessoas**: Use `COUNT(DISTINCT email_lead)`

### Queries Essenciais

```sql
-- Orderbumps vendidos
WHERE dados_originais->>'tipo_produto' = 'orderbump'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0

-- Produtos principais (ingressos)
WHERE (dados_originais->>'tipo_produto' IS NULL 
       OR dados_originais->>'tipo_produto' != 'orderbump')
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
```

---

**📁 Arquivos Relacionados**:
- `DOCUMENTACAO_BANCO_DADOS.md` - Documentação completa do banco
- `QUERIES_DASHBOARD.sql` - Queries prontas para dashboard
- `RESUMO_REGRAS_DASHBOARD.md` - Regras resumidas
