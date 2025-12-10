# 📊 Resumo das Regras para Dashboard - Escala 26

## 🎯 Tabela a Consultar

**Tabela**: `recuperacao_vendas`  
**Filtro obrigatório**: `WHERE projeto = 'escala-26'`

---

## 📈 Métricas Principais

### 1. Número de Compradores de Ingresso

**Definição**: Pessoas que compraram e o pagamento foi liquidado (recebido).

**Query**:
```sql
SELECT COUNT(*) as total_compradores
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']      -- Tem status "paid"
  AND liquidado > 0                     -- Valor foi recebido
  AND NOT (acao_tomada @> ARRAY['refunded'])    -- Não foi reembolsado
  AND NOT (acao_tomada @> ARRAY['reembolso']);  -- Não tem reembolso pendente
```

**Campos importantes**:
- `acao_tomada`: Array de status (ex: `["paid", "comprador"]`)
- `liquidado`: Valor líquido recebido (se > 0, pagamento foi recebido)

---

### 2. Valor Vendido Líquido

**Definição**: Soma de todos os valores líquidos recebidos (após taxas).

**Query**:
```sql
SELECT SUM(liquidado) as valor_total_liquido
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso']);
```

**Campos importantes**:
- `liquidado`: Valor líquido (já com taxas descontadas)
- `valor`: Valor bruto (antes das taxas)

---

## 🔍 Diferenciar: Não Comprou, Comprou, Reembolso

### ❌ 1. Quem NÃO Comprou

**Definição**: 
- Nunca teve status "paid" **OU**
- Teve "paid" mas `liquidado = 0` (pagamento não foi recebido)

**Query**:
```sql
SELECT *
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND (
    NOT (acao_tomada @> ARRAY['paid'])           -- Nunca pagou
    OR (acao_tomada @> ARRAY['paid'] AND liquidado = 0)  -- Pagou mas não foi liquidado
  )
  AND NOT (acao_tomada @> ARRAY['refunded'])    -- Excluir reembolsos
  AND NOT (acao_tomada @> ARRAY['reembolso']);
```

**Status possíveis neste grupo**:
- `popup-blindado`: Só preencheu formulário
- `pix-gerado`: Gerou PIX mas não pagou
- `waiting_payment`: Aguardando pagamento
- `refused`: Pagamento recusado
- `carrinho-abandonado`: Abandonou carrinho

---

### ✅ 2. Quem COMPROU

**Definição**: 
- Tem status "paid" **E**
- `liquidado > 0` (pagamento foi recebido) **E**
- **NÃO** tem "refunded" ou "reembolso"

**Query**:
```sql
SELECT *
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']              -- Pagou
  AND liquidado > 0                             -- Foi recebido
  AND NOT (acao_tomada @> ARRAY['refunded'])    -- Não foi reembolsado
  AND NOT (acao_tomada @> ARRAY['reembolso']);  -- Sem reembolso pendente
```

**Características**:
- ✅ Pagamento confirmado
- ✅ Valor recebido
- ✅ Sem reembolso

---

### 💰 3. Quem Comprou mas Pediu REEMBOLSO

**Definição**: 
- Tem status "paid" **E**
- Tem status "refunded" ou "reembolso"

**Query**:
```sql
SELECT *
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']              -- Comprou
  AND (
    acao_tomada @> ARRAY['refunded']            -- Reembolso processado
    OR acao_tomada @> ARRAY['reembolso']        -- Reembolso solicitado
  );
```

**Status possíveis**:
- `refunded`: Reembolso já foi processado
- `reembolso`: Reembolso solicitado (em andamento)

**Importante**: Estes registros **NÃO** devem contar como compradores e **NÃO** devem entrar no valor líquido.

---

## 📋 Tabela de Decisão Rápida

| Tem `paid`? | `liquidado > 0`? | Tem `refunded`/`reembolso`? | Categoria |
|-------------|------------------|----------------------------|-----------|
| ❌ Não | - | - | ❌ **Não Comprou** |
| ✅ Sim | ❌ Não | - | ❌ **Não Comprou** |
| ✅ Sim | ✅ Sim | ❌ Não | ✅ **Comprou** |
| ✅ Sim | ✅ Sim | ✅ Sim | 💰 **Reembolso** |

---

## 🔑 Campos Principais

### `acao_tomada` (Array de Strings)
- **Tipo**: Array
- **Uso**: Verificar se contém um status específico
- **Operador**: `@>` (contém)
- **Exemplo**: `acao_tomada @> ARRAY['paid']` = "contém 'paid'"

### `liquidado` (Número)
- **Tipo**: NUMERIC
- **Significado**: Valor líquido recebido após taxas
- **Regra**: Se `liquidado > 0`, o pagamento foi recebido

### `valor` (Número)
- **Tipo**: NUMERIC
- **Significado**: Valor bruto da venda (antes das taxas)

### `projeto` (String)
- **Tipo**: VARCHAR
- **Uso**: Sempre filtrar por `projeto = 'escala-26'`

---

## 🎯 Queries Resumidas

### Compradores
```sql
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
```

### Valor Líquido
```sql
SELECT SUM(liquidado)
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
```

### Não Comprou
```sql
WHERE projeto = 'escala-26'
  AND (
    NOT (acao_tomada @> ARRAY['paid'])
    OR (acao_tomada @> ARRAY['paid'] AND liquidado = 0)
  )
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
```

### Reembolso
```sql
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND (
    acao_tomada @> ARRAY['refunded']
    OR acao_tomada @> ARRAY['reembolso']
  )
```

---

## ⚠️ Regras Importantes

1. **Sempre filtrar por projeto**: `WHERE projeto = 'escala-26'`

2. **Sempre verificar `liquidado > 0`**: Só conta como recebido se `liquidado > 0`

3. **Sempre excluir reembolsos**: Use `NOT (acao_tomada @> ARRAY['refunded'])` e `NOT (acao_tomada @> ARRAY['reembolso'])`

4. **Array pode ter múltiplos valores**: Um registro pode ter `["paid", "comprador", "refunded"]` - verifique todos os status relevantes

5. **Reembolsos não são compradores**: Mesmo que tenham `paid` e `liquidado > 0`, se tiverem `refunded` ou `reembolso`, não contam como compradores

---

## 📊 Exemplo Prático

```sql
-- Resumo completo para dashboard
SELECT 
  -- Compradores
  COUNT(*) FILTER (
    WHERE acao_tomada @> ARRAY['paid']
    AND liquidado > 0
    AND NOT (acao_tomada @> ARRAY['refunded'])
    AND NOT (acao_tomada @> ARRAY['reembolso'])
  ) as compradores,
  
  -- Valor líquido
  SUM(liquidado) FILTER (
    WHERE acao_tomada @> ARRAY['paid']
    AND liquidado > 0
    AND NOT (acao_tomada @> ARRAY['refunded'])
    AND NOT (acao_tomada @> ARRAY['reembolso'])
  ) as valor_liquido_total,
  
  -- Reembolsos
  COUNT(*) FILTER (
    WHERE acao_tomada @> ARRAY['paid']
    AND (acao_tomada @> ARRAY['refunded'] OR acao_tomada @> ARRAY['reembolso'])
  ) as reembolsos

FROM recuperacao_vendas
WHERE projeto = 'escala-26';
```

---

**📁 Arquivos de Referência**:
- `DOCUMENTACAO_BANCO_DADOS.md` - Documentação completa
- `QUERIES_DASHBOARD.sql` - Queries prontas para usar
