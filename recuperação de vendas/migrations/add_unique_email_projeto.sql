-- Migration: Adicionar constraint única para email + projeto
-- Garante que não pode haver 2 leads com o mesmo email no mesmo projeto

-- Primeiro, remover duplicatas se houver (manter o mais recente)
DELETE FROM recuperacao_vendas a
USING recuperacao_vendas b
WHERE a.id < b.id
  AND a.email_lead = b.email_lead
  AND a.projeto = b.projeto
  AND a.projeto IS NOT NULL;

-- Criar índice único para email + projeto
CREATE UNIQUE INDEX IF NOT EXISTS idx_recuperacao_vendas_email_projeto 
ON recuperacao_vendas(email_lead, projeto) 
WHERE projeto IS NOT NULL;

-- Também criar constraint única para garantir integridade
ALTER TABLE recuperacao_vendas 
ADD CONSTRAINT unique_email_projeto 
UNIQUE (email_lead, projeto);

COMMENT ON CONSTRAINT unique_email_projeto ON recuperacao_vendas IS 
'Garante que não pode haver 2 leads com o mesmo email no mesmo projeto';

