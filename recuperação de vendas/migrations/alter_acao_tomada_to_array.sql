-- Migration: Alterar acao_tomada para array de strings
-- Execute este SQL no Supabase SQL Editor se necessário

ALTER TABLE recuperacao_vendas 
ALTER COLUMN acao_tomada TYPE TEXT[] USING 
  CASE 
    WHEN acao_tomada IS NULL THEN NULL
    WHEN acao_tomada::text = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY[acao_tomada::text]
  END;

-- Comentário na coluna
COMMENT ON COLUMN recuperacao_vendas.acao_tomada IS 'Array de tags/actions (ex: ["abandonou_carrinho", "visualizou_produto"])';

