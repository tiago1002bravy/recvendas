# Documentação do Banco de Dados - Recuperação de Vendas

## 📊 Tabela: `recuperacao_vendas`

### Estrutura Completa

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| `id` | UUID | ✅ Sim | ID único do registro (auto-gerado) |
| `nome_lead` | VARCHAR(255) | ✅ Sim | Nome completo do lead/cliente |
| `email_lead` | VARCHAR(255) | ✅ Sim | Email do lead (usado para identificar duplicados) |
| `whatsapp_lead` | VARCHAR(20) | ✅ Sim | Telefone/WhatsApp do lead |
| `produto` | VARCHAR(255) | ✅ Sim | Nome do produto vendido |
| `valor` | NUMERIC | ❌ Não | Valor bruto da venda (default: 0) |
| `liquidado` | NUMERIC | ❌ Não | Valor líquido recebido após taxas (default: 0) |
| `acao_tomada` | ARRAY[TEXT] | ✅ Sim | **Array de status/ações** - Campo chave para identificar estado da venda |
| `projeto` | VARCHAR(255) | ❌ Não | Nome do projeto (ex: "escala-26") - usado para agrupar vendas |
| `id_original` | VARCHAR(255) | ❌ Não | ID da venda no sistema de origem |
| `created_original` | TIMESTAMP | ❌ Não | Data/hora original da venda |
| `from_original` | VARCHAR(255) | ❌ Não | Origem do lead (ex: landing page, afiliado) |
| `utms` | JSONB | ❌ Não | Objeto JSON com parâmetros UTM (source, medium, campaign, content, term) |
| `dados_originais` | JSONB | ❌ Não | Objeto JSON com dados extras da venda |
| `created_at` | TIMESTAMP | ❌ Não | Data de criação do registro (auto-gerado) |
| `updated_at` | TIMESTAMP | ❌ Não | Data de última atualização (auto-gerado) |

### Constraints e Índices

- **Constraint única**: `(email_lead, projeto)` - Não pode haver 2 registros com mesmo email no mesmo projeto
- **Índice único**: `idx_recuperacao_vendas_email_projeto` - Garante integridade da constraint

---

## 🔑 Regras de Negócio

### 1. Identificação de Duplicados

- **Chave única**: `email_lead` + `projeto`
- Se um novo registro tiver o mesmo `email_lead` e `projeto` de um registro existente:
  - O registro existente é **atualizado** (não criado novo)
  - O array `acao_tomada` faz **merge** (combina arrays e remove duplicatas)
  - Outros campos são atualizados com os valores mais recentes

### 2. Campo `acao_tomada` (Array de Status)

Este é o campo mais importante para identificar o estado da venda. É um **array de strings** que pode conter múltiplos valores.

#### Status Possíveis:

| Status | Significado | Quando aparece |
|--------|-------------|----------------|
| `popup-blindado` | Lead preencheu formulário | Início do funil |
| `pix-gerado` | PIX foi gerado | Após geração do PIX |
| `comprador` | Cliente iniciou compra | Durante processo de compra |
| `paid` | **Pagamento confirmado** | ✅ Compra efetivada |
| `waiting_payment` | Aguardando pagamento | Pagamento pendente |
| `refused` | Pagamento recusado | Cartão/PIX recusado |
| `refunded` | **Reembolso realizado** | 💰 Reembolso processado |
| `reembolso` | Reembolso solicitado | Reembolso em andamento |
| `carrinho-abandonado` | Carrinho abandonado | Lead não completou compra |
| `cartao-recusado` | Cartão recusado | Erro no pagamento |
| `saleUpdated` | Venda atualizada | Atualização de status |

**Importante**: Um registro pode ter **múltiplos status** no array. Exemplo:
```json
["popup-blindado", "pix-gerado", "comprador", "paid"]
```

### 3. Diferença entre `valor` e `liquidado`

- **`valor`**: Valor bruto da venda (valor anunciado)
- **`liquidado`**: Valor líquido recebido após descontar taxas da plataforma de pagamento

**Regra**: Se `liquidado > 0`, significa que o pagamento foi recebido.

---

## 📈 Queries para Dashboard

### 1. Número de Compradores de Ingresso

**Definição de Comprador**: 
- Tem `paid` no array `acao_tomada` **E**
- `liquidado > 0`

```sql
-- Total de compradores
SELECT COUNT(*) as total_compradores
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0;
```

```sql
-- Compradores com detalhes
SELECT 
  email_lead,
  nome_lead,
  produto,
  valor,
  liquidado,
  acao_tomada,
  created_original
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
ORDER BY created_original DESC;
```

### 2. Valor Vendido Líquido

```sql
-- Valor total líquido recebido
SELECT 
  COALESCE(SUM(liquidado), 0) as valor_total_liquido
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0;
```

```sql
-- Valor líquido por produto
SELECT 
  produto,
  COUNT(*) as quantidade_vendas,
  SUM(valor) as valor_bruto_total,
  SUM(liquidado) as valor_liquido_total
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
GROUP BY produto
ORDER BY valor_liquido_total DESC;
```

### 3. Diferenciar: Não Comprou, Comprou, Reembolso

#### 3.1. Quem NÃO Comprou

**Definição**: 
- Não tem `paid` no array `acao_tomada` **OU**
- Tem `paid` mas `liquidado = 0`

```sql
-- Quem não comprou
SELECT 
  email_lead,
  nome_lead,
  produto,
  valor,
  liquidado,
  acao_tomada,
  CASE 
    WHEN NOT (acao_tomada @> ARRAY['paid']) THEN 'Nunca pagou'
    WHEN acao_tomada @> ARRAY['paid'] AND liquidado = 0 THEN 'Pagou mas não foi liquidado'
    ELSE 'Outro'
  END as motivo_nao_comprou
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND (
    NOT (acao_tomada @> ARRAY['paid'])
    OR (acao_tomada @> ARRAY['paid'] AND liquidado = 0)
  )
ORDER BY created_original DESC;
```

#### 3.2. Quem COMPROU

**Definição**: 
- Tem `paid` no array `acao_tomada` **E**
- `liquidado > 0` **E**
- Não tem `refunded` ou `reembolso` no array

```sql
-- Quem comprou (sem reembolso)
SELECT 
  email_lead,
  nome_lead,
  produto,
  valor,
  liquidado,
  acao_tomada,
  created_original
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
ORDER BY created_original DESC;
```

#### 3.3. Quem Comprou mas Pediu REEMBOLSO

**Definição**: 
- Tem `paid` no array `acao_tomada` **E**
- Tem `refunded` ou `reembolso` no array

```sql
-- Quem comprou mas pediu reembolso
SELECT 
  email_lead,
  nome_lead,
  produto,
  valor,
  liquidado,
  acao_tomada,
  created_original,
  CASE 
    WHEN acao_tomada @> ARRAY['refunded'] THEN 'Reembolso processado'
    WHEN acao_tomada @> ARRAY['reembolso'] THEN 'Reembolso solicitado'
    ELSE 'Outro'
  END as status_reembolso
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND (
    acao_tomada @> ARRAY['refunded']
    OR acao_tomada @> ARRAY['reembolso']
  )
ORDER BY created_original DESC;
```

### 4. Resumo Completo para Dashboard

```sql
-- Resumo completo: Não comprou, Comprou, Reembolso
SELECT 
  CASE 
    -- Reembolso (tem paid + refunded/reembolso)
    WHEN acao_tomada @> ARRAY['paid'] 
         AND (acao_tomada @> ARRAY['refunded'] OR acao_tomada @> ARRAY['reembolso'])
    THEN 'Reembolso'
    
    -- Comprou (tem paid + liquidado > 0)
    WHEN acao_tomada @> ARRAY['paid'] AND liquidado > 0
    THEN 'Comprou'
    
    -- Não comprou (resto)
    ELSE 'Não Comprou'
  END as categoria,
  COUNT(*) as quantidade,
  SUM(valor) as valor_bruto_total,
  SUM(liquidado) as valor_liquido_total
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
GROUP BY categoria
ORDER BY 
  CASE categoria
    WHEN 'Comprou' THEN 1
    WHEN 'Reembolso' THEN 2
    WHEN 'Não Comprou' THEN 3
  END;
```

### 5. Funil de Conversão

```sql
-- Funil de conversão
SELECT 
  'Total de Leads' as etapa,
  COUNT(*) as quantidade
FROM recuperacao_vendas
WHERE projeto = 'escala-26'

UNION ALL

SELECT 
  'Abrir Popup' as etapa,
  COUNT(*) as quantidade
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['popup-blindado']

UNION ALL

SELECT 
  'Gerar PIX' as etapa,
  COUNT(*) as quantidade
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['pix-gerado']

UNION ALL

SELECT 
  'Iniciar Compra' as etapa,
  COUNT(*) as quantidade
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['comprador']

UNION ALL

SELECT 
  'Pagamento Confirmado' as etapa,
  COUNT(*) as quantidade
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']

UNION ALL

SELECT 
  'Pagamento Liquidado' as etapa,
  COUNT(*) as quantidade
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0;
```

---

## 🎯 Resumo das Regras para Dashboard

### Compradores de Ingresso
```sql
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
```

### Valor Vendido Líquido
```sql
SELECT SUM(liquidado)
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
```

### Categorias

1. **Não Comprou**: 
   - `NOT (acao_tomada @> ARRAY['paid'])` OU
   - `acao_tomada @> ARRAY['paid'] AND liquidado = 0`

2. **Comprou**: 
   - `acao_tomada @> ARRAY['paid']` 
   - `liquidado > 0`
   - `NOT (acao_tomada @> ARRAY['refunded'])`
   - `NOT (acao_tomada @> ARRAY['reembolso'])`

3. **Reembolso**: 
   - `acao_tomada @> ARRAY['paid']`
   - `(acao_tomada @> ARRAY['refunded'] OR acao_tomada @> ARRAY['reembolso'])`

---

## 📝 Notas Importantes

1. **Array `acao_tomada`**: Use o operador `@>` para verificar se contém um valor:
   - `acao_tomada @> ARRAY['paid']` = "contém 'paid'"

2. **Campo `liquidado`**: Sempre verifique se `liquidado > 0` para garantir que o pagamento foi realmente recebido.

3. **Campo `projeto`**: Sempre filtre por `projeto = 'escala-26'` para isolar os dados deste projeto.

4. **Múltiplos Status**: Um registro pode ter vários status. Sempre verifique todos os status relevantes.

5. **Reembolsos**: Um registro pode ter `paid` e `refunded` ao mesmo tempo. Isso significa que comprou e depois pediu reembolso.

---

## 🔍 Exemplos Práticos

### Exemplo 1: Listar todos os compradores com valor líquido
```sql
SELECT 
  nome_lead,
  email_lead,
  produto,
  liquidado as valor_recebido,
  created_original as data_compra
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
ORDER BY liquidado DESC;
```

### Exemplo 2: Taxa de conversão
```sql
SELECT 
  COUNT(*) FILTER (WHERE acao_tomada @> ARRAY['paid'] AND liquidado > 0) * 100.0 / COUNT(*) as taxa_conversao_percent
FROM recuperacao_vendas
WHERE projeto = 'escala-26';
```

### Exemplo 3: Taxa de reembolso
```sql
SELECT 
  COUNT(*) FILTER (
    WHERE acao_tomada @> ARRAY['paid'] 
    AND (acao_tomada @> ARRAY['refunded'] OR acao_tomada @> ARRAY['reembolso'])
  ) * 100.0 / 
  COUNT(*) FILTER (WHERE acao_tomada @> ARRAY['paid'] AND liquidado > 0) as taxa_reembolso_percent
FROM recuperacao_vendas
WHERE projeto = 'escala-26';
```
