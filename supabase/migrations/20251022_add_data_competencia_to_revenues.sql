-- ============================================================================
-- Migration: Add data_competencia column to revenues table
-- Version: 1.0.0
-- Date: 2025-01-22
-- Author: Andrey Viana
-- Description: Adiciona coluna data_competencia na tabela revenues para 
--              suportar regime de competência no DRE
-- ============================================================================

-- Add data_competencia column to revenues table
ALTER TABLE public.revenues 
ADD COLUMN IF NOT EXISTS data_competencia DATE;

-- Add comment explaining the column purpose
COMMENT ON COLUMN public.revenues.data_competencia IS 
'Data de competência contábil - quando a receita foi efetivamente gerada (regime de competência). 
Se NULL, o sistema usa a coluna date (data de recebimento/pagamento) como fallback.
Permite DREs baseados em competência econômica em vez de caixa.

Exemplos de uso:
- Serviço prestado em 15/01 mas recebido em 05/02:
  * date = 2025-02-05 (data de recebimento)
  * data_competencia = 2025-01-15 (data em que o serviço foi realizado)
  * DRE de Janeiro incluirá essa receita (regime de competência)
  * Fluxo de caixa de Fevereiro incluirá essa receita

- Venda à vista em 20/01:
  * date = 2025-01-20 (recebimento imediato)
  * data_competencia = NULL (usa date como fallback)
  * DRE de Janeiro incluirá essa receita
  * Fluxo de caixa de Janeiro incluirá essa receita
';

-- ============================================================================
-- Validation Query
-- ============================================================================
-- Verifica se a coluna foi criada corretamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public'
  AND table_name = 'revenues'
  AND column_name = 'data_competencia';

-- ============================================================================
-- Test Query
-- ============================================================================
-- Testa a função DRE com regime de competência
-- SELECT fn_calculate_dre_dynamic(
--   'sua_unit_id'::uuid,
--   '2025-01-01'::date,
--   '2025-01-31'::date
-- ) AS dre_result;
