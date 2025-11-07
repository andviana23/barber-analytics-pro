-- Migration: Adicionar campos source e source_id à tabela revenues
-- Objetivo: Rastrear origem das receitas (comandas, assinaturas, manual)
-- Data: 2025-01-24
-- FASE 6 - Integração com Módulo Financeiro

-- Adicionar campos de rastreamento de origem
ALTER TABLE revenues
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS source_id UUID;

-- Comentários explicativos
COMMENT ON COLUMN revenues.source_type IS 'Tipo de origem da receita: order (comanda), subscription (assinatura), manual (entrada manual)';
COMMENT ON COLUMN revenues.source_id IS 'ID da entidade de origem (order_id, subscription_id, etc). Permite rastreamento da fonte da receita';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_revenues_source 
ON revenues(source_type, source_id)
WHERE source_type IS NOT NULL;

-- Atualizar receitas existentes como "manual"
UPDATE revenues
SET source_type = 'manual'
WHERE source_type IS NULL;

-- Validação: Garantir que source_type contenha apenas valores válidos
ALTER TABLE revenues
ADD CONSTRAINT chk_revenues_source_type
CHECK (source_type IN ('order', 'subscription', 'manual'));

-- Log da migration
DO $$
BEGIN
  RAISE NOTICE 'Migration concluída: Campos source_type e source_id adicionados à tabela revenues';
  RAISE NOTICE 'Tipos válidos: order, subscription, manual';
  RAISE NOTICE 'Índice criado: idx_revenues_source';
END $$;
