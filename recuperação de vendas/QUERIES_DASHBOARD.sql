-- ============================================
-- QUERIES PRONTAS PARA DASHBOARD
-- Projeto: Escala 26
-- ============================================

-- ============================================
-- 1. NÚMERO DE COMPRADORES DE INGRESSO
-- ============================================

-- Total de compradores (paid + liquidado > 0, sem reembolso)
SELECT COUNT(*) as total_compradores
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso']);

-- Lista de compradores com detalhes
SELECT 
  email_lead,
  nome_lead,
  produto,
  valor as valor_bruto,
  liquidado as valor_liquido,
  created_original as data_compra
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
ORDER BY created_original DESC;

-- ============================================
-- 2. VALOR VENDIDO LÍQUIDO
-- ============================================

-- Valor total líquido recebido
SELECT 
  COALESCE(SUM(liquidado), 0) as valor_total_liquido,
  COUNT(*) as quantidade_vendas
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso']);

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
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
GROUP BY produto
ORDER BY valor_liquido_total DESC;

-- Valor líquido por dia
SELECT 
  DATE(created_original) as data,
  COUNT(*) as quantidade_vendas,
  SUM(liquidado) as valor_liquido_dia
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
  AND created_original IS NOT NULL
GROUP BY DATE(created_original)
ORDER BY data DESC;

-- ============================================
-- 3. CATEGORIZAÇÃO: NÃO COMPROU, COMPROU, REEMBOLSO
-- ============================================

-- Resumo por categoria
SELECT 
  CASE 
    -- Reembolso (tem paid + refunded/reembolso)
    WHEN acao_tomada @> ARRAY['paid'] 
         AND (acao_tomada @> ARRAY['refunded'] OR acao_tomada @> ARRAY['reembolso'])
    THEN 'Reembolso'
    
    -- Comprou (tem paid + liquidado > 0, sem reembolso)
    WHEN acao_tomada @> ARRAY['paid'] 
         AND liquidado > 0
         AND NOT (acao_tomada @> ARRAY['refunded'])
         AND NOT (acao_tomada @> ARRAY['reembolso'])
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

-- ============================================
-- 3.1. QUEM NÃO COMPROU
-- ============================================

-- Lista de quem não comprou
SELECT 
  email_lead,
  nome_lead,
  produto,
  valor,
  liquidado,
  acao_tomada,
  created_original,
  CASE 
    WHEN NOT (acao_tomada @> ARRAY['paid']) THEN 'Nunca pagou'
    WHEN acao_tomada @> ARRAY['paid'] AND liquidado = 0 THEN 'Pagou mas não foi liquidado'
    WHEN acao_tomada @> ARRAY['refused'] THEN 'Pagamento recusado'
    WHEN acao_tomada @> ARRAY['waiting_payment'] THEN 'Aguardando pagamento'
    ELSE 'Outro'
  END as motivo_nao_comprou
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND (
    NOT (acao_tomada @> ARRAY['paid'])
    OR (acao_tomada @> ARRAY['paid'] AND liquidado = 0)
  )
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
ORDER BY created_original DESC;

-- Contagem de não compradores por motivo
SELECT 
  CASE 
    WHEN NOT (acao_tomada @> ARRAY['paid']) THEN 'Nunca pagou'
    WHEN acao_tomada @> ARRAY['paid'] AND liquidado = 0 THEN 'Pagou mas não foi liquidado'
    WHEN acao_tomada @> ARRAY['refused'] THEN 'Pagamento recusado'
    WHEN acao_tomada @> ARRAY['waiting_payment'] THEN 'Aguardando pagamento'
    ELSE 'Outro'
  END as motivo,
  COUNT(*) as quantidade
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND (
    NOT (acao_tomada @> ARRAY['paid'])
    OR (acao_tomada @> ARRAY['paid'] AND liquidado = 0)
  )
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
GROUP BY motivo
ORDER BY quantidade DESC;

-- ============================================
-- 3.2. QUEM COMPROU
-- ============================================

-- Lista de quem comprou (sem reembolso)
SELECT 
  email_lead,
  nome_lead,
  produto,
  valor as valor_bruto,
  liquidado as valor_liquido,
  acao_tomada,
  created_original as data_compra
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
ORDER BY created_original DESC;

-- ============================================
-- 3.3. QUEM COMPROU MAS PEDIU REEMBOLSO
-- ============================================

-- Lista de reembolsos
SELECT 
  email_lead,
  nome_lead,
  produto,
  valor as valor_bruto,
  liquidado as valor_liquido,
  acao_tomada,
  created_original as data_compra,
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

-- Valor total em reembolsos
SELECT 
  COUNT(*) as quantidade_reembolsos,
  SUM(valor) as valor_bruto_reembolsado,
  SUM(liquidado) as valor_liquido_reembolsado
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND (
    acao_tomada @> ARRAY['refunded']
    OR acao_tomada @> ARRAY['reembolso']
  );

-- ============================================
-- 4. MÉTRICAS ADICIONAIS
-- ============================================

-- Taxa de conversão (compradores / total de leads)
SELECT 
  COUNT(*) FILTER (
    WHERE acao_tomada @> ARRAY['paid'] 
    AND liquidado > 0
    AND NOT (acao_tomada @> ARRAY['refunded'])
    AND NOT (acao_tomada @> ARRAY['reembolso'])
  ) as compradores,
  COUNT(*) as total_leads,
  ROUND(
    COUNT(*) FILTER (
      WHERE acao_tomada @> ARRAY['paid'] 
      AND liquidado > 0
      AND NOT (acao_tomada @> ARRAY['refunded'])
      AND NOT (acao_tomada @> ARRAY['reembolso'])
    ) * 100.0 / COUNT(*), 
    2
  ) as taxa_conversao_percent
FROM recuperacao_vendas
WHERE projeto = 'escala-26';

-- Taxa de reembolso (reembolsos / compradores)
SELECT 
  COUNT(*) FILTER (
    WHERE acao_tomada @> ARRAY['paid'] 
    AND (acao_tomada @> ARRAY['refunded'] OR acao_tomada @> ARRAY['reembolso'])
  ) as reembolsos,
  COUNT(*) FILTER (
    WHERE acao_tomada @> ARRAY['paid'] 
    AND liquidado > 0
  ) as total_compradores,
  ROUND(
    COUNT(*) FILTER (
      WHERE acao_tomada @> ARRAY['paid'] 
      AND (acao_tomada @> ARRAY['refunded'] OR acao_tomada @> ARRAY['reembolso'])
    ) * 100.0 / 
    NULLIF(
      COUNT(*) FILTER (
        WHERE acao_tomada @> ARRAY['paid'] 
        AND liquidado > 0
      ), 
      0
    ), 
    2
  ) as taxa_reembolso_percent
FROM recuperacao_vendas
WHERE projeto = 'escala-26';

-- Funil de conversão
SELECT 
  'Total de Leads' as etapa,
  COUNT(*) as quantidade,
  100.0 as percentual
FROM recuperacao_vendas
WHERE projeto = 'escala-26'

UNION ALL

SELECT 
  'Abrir Popup' as etapa,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM recuperacao_vendas WHERE projeto = 'escala-26'), 2) as percentual
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['popup-blindado']

UNION ALL

SELECT 
  'Gerar PIX' as etapa,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM recuperacao_vendas WHERE projeto = 'escala-26'), 2) as percentual
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['pix-gerado']

UNION ALL

SELECT 
  'Iniciar Compra' as etapa,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM recuperacao_vendas WHERE projeto = 'escala-26'), 2) as percentual
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['comprador']

UNION ALL

SELECT 
  'Pagamento Confirmado' as etapa,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM recuperacao_vendas WHERE projeto = 'escala-26'), 2) as percentual
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']

UNION ALL

SELECT 
  'Pagamento Liquidado' as etapa,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM recuperacao_vendas WHERE projeto = 'escala-26'), 2) as percentual
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
ORDER BY 
  CASE etapa
    WHEN 'Total de Leads' THEN 1
    WHEN 'Abrir Popup' THEN 2
    WHEN 'Gerar PIX' THEN 3
    WHEN 'Iniciar Compra' THEN 4
    WHEN 'Pagamento Confirmado' THEN 5
    WHEN 'Pagamento Liquidado' THEN 6
  END;

-- ============================================
-- 5. ANÁLISE POR UTM (Opcional)
-- ============================================

-- Compradores por UTM Source
SELECT 
  utms->>'utm_source' as utm_source,
  COUNT(*) as quantidade_compradores,
  SUM(liquidado) as valor_liquido_total
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
  AND utms IS NOT NULL
GROUP BY utms->>'utm_source'
ORDER BY valor_liquido_total DESC;

-- Compradores por UTM Medium
SELECT 
  utms->>'utm_medium' as utm_medium,
  COUNT(*) as quantidade_compradores,
  SUM(liquidado) as valor_liquido_total
FROM recuperacao_vendas
WHERE projeto = 'escala-26'
  AND acao_tomada @> ARRAY['paid']
  AND liquidado > 0
  AND NOT (acao_tomada @> ARRAY['refunded'])
  AND NOT (acao_tomada @> ARRAY['reembolso'])
  AND utms IS NOT NULL
GROUP BY utms->>'utm_medium'
ORDER BY valor_liquido_total DESC;
