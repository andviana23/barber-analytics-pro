-- =========================================================================
-- MIGRATION: Reconciliations Module - Schema Documentation
-- =========================================================================
-- Descrição: Documenta schema existente de conciliação bancária
-- Autor: AI Assistant
-- Data: 2025-01-24
-- Versão: 1.0.0
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABELA: reconciliations
-- -------------------------------------------------------------------------
-- Descrição: Vincula extratos bancários (bank_statements) com transações
--            internas (revenues ou expenses) para conciliação financeira.
--            Suporta matching automático e manual.
-- -------------------------------------------------------------------------

-- NOTA: Tabela já existe. Este arquivo documenta a estrutura atual.

-- Estrutura da tabela reconciliations:
-- 
-- id                    UUID PRIMARY KEY
-- bank_statement_id     UUID NOT NULL → bank_statements.id
-- reference_type        VARCHAR(20) NOT NULL → 'Revenue' ou 'Expense'
-- reference_id          UUID NOT NULL → revenues.id ou expenses.id
-- reconciliation_date   TIMESTAMP WITH TIME ZONE DEFAULT now()
-- status                VARCHAR(20) DEFAULT 'confirmed' → 'pending', 'confirmed', 'Divergent', 'rejected'
-- difference            NUMERIC(10,2) DEFAULT 0.00 → Diferença entre valores
-- notes                 TEXT → Observações
-- confirmed_at          TIMESTAMP WITH TIME ZONE → Data de confirmação
-- created_at            TIMESTAMP WITH TIME ZONE DEFAULT now()
--
-- CONSTRAINTS:
-- - bank_statement_id UNIQUE → Um extrato pode ter apenas uma conciliação
-- - reference_type CHECK → Apenas 'Revenue' ou 'Expense'
-- - status CHECK → Apenas 'pending', 'confirmed', 'Divergent', 'rejected'
--
-- FOREIGN KEYS:
-- - bank_statement_id → bank_statements(id) ON DELETE CASCADE
-- - reference_id não tem FK explícita (polimórfica por reference_type)
--
-- TRIGGERS:
-- - trg_reconciliation_status: Atualiza bank_statements.status automaticamente

-- -------------------------------------------------------------------------
-- 2. VIEW: vw_reconciliation_summary
-- -------------------------------------------------------------------------
-- Descrição: Resumo estatístico de conciliações por conta e período.
-- Uso: Dashboard de conciliação, relatórios gerenciais.
-- -------------------------------------------------------------------------

-- NOTA: View já existe. Estrutura documentada:
-- 
-- Campos retornados:
-- - account_id: ID da conta bancária
-- - account_name: Nome da conta
-- - unit_id: ID da unidade
-- - period: Período mensal (YYYY-MM-01)
-- - total_statements: Total de extratos no período
-- - total_reconciled: Total de extratos conciliados
-- - total_pending: Total de extratos pendentes
-- - total_amount: Soma de valores dos extratos
-- - reconciled_amount: Soma de valores conciliados
-- - pending_amount: Soma de valores pendentes
-- - divergent_amount: Soma de diferenças nas conciliações

-- -------------------------------------------------------------------------
-- 3. RLS POLICIES (Row Level Security)
-- -------------------------------------------------------------------------
-- Descrição: Políticas de segurança para acesso multi-tenant.
-- Status: A SER IMPLEMENTADO (TASK PENDENTE)
-- -------------------------------------------------------------------------

-- POLICY: view_own_unit_reconciliations
-- Descrição: Permitir SELECT apenas de conciliações da própria unidade
-- Status: NÃO IMPLEMENTADO

-- Exemplo de implementação futura:
/*
CREATE POLICY view_own_unit_reconciliations
ON reconciliations
FOR SELECT
USING (
  bank_statement_id IN (
    SELECT bs.id
    FROM bank_statements bs
    JOIN bank_accounts ba ON ba.id = bs.bank_account_id
    WHERE ba.unit_id IN (
      SELECT unit_id FROM professionals WHERE user_id = auth.uid()
    )
  )
);
*/

-- POLICY: manage_own_unit_reconciliations
-- Descrição: Permitir INSERT/UPDATE/DELETE apenas na própria unidade
-- Status: NÃO IMPLEMENTADO

-- -------------------------------------------------------------------------
-- 4. RELACIONAMENTOS POLIMÓRFICOS
-- -------------------------------------------------------------------------
-- Descrição: Reconciliations usa referência polimórfica para vincular
--            revenues OU expenses via reference_type + reference_id.
-- -------------------------------------------------------------------------

-- Exemplo de JOIN para revenues:
/*
SELECT 
  r.id,
  r.bank_statement_id,
  r.reference_type,
  r.reference_id,
  rev.description AS revenue_description,
  rev.value AS revenue_value
FROM reconciliations r
JOIN revenues rev ON r.reference_id = rev.id
WHERE r.reference_type = 'Revenue';
*/

-- Exemplo de JOIN para expenses:
/*
SELECT 
  r.id,
  r.bank_statement_id,
  r.reference_type,
  r.reference_id,
  exp.description AS expense_description,
  exp.value AS expense_value
FROM reconciliations r
JOIN expenses exp ON r.reference_id = exp.id
WHERE r.reference_type = 'Expense';
*/

-- -------------------------------------------------------------------------
-- 5. TRIGGERS EXISTENTES
-- -------------------------------------------------------------------------

-- TRIGGER: trg_reconciliation_status
-- Evento: AFTER INSERT OR DELETE ON reconciliations
-- Função: fn_update_bank_statement_status()
-- Descrição: Atualiza bank_statements.status para 'reconciled' ou 'pending'
--            automaticamente quando uma reconciliação é criada/removida.

-- Exemplo de lógica da função (não incluída aqui):
/*
CREATE OR REPLACE FUNCTION fn_update_bank_statement_status()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE bank_statements 
    SET status = 'reconciled', reconciled = TRUE
    WHERE id = NEW.bank_statement_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE bank_statements 
    SET status = 'pending', reconciled = FALSE
    WHERE id = OLD.bank_statement_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- -------------------------------------------------------------------------
-- 6. ÍNDICES RECOMENDADOS (A SER IMPLEMENTADO)
-- -------------------------------------------------------------------------

-- Índice composto para queries por unidade e período:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliations_lookup
-- ON reconciliations (bank_statement_id, reference_type, reference_id, status);

-- Índice para queries por tipo de referência:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliations_reference
-- ON reconciliations (reference_type, reference_id);

-- Índice para queries por data de conciliação:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliations_date
-- ON reconciliations (reconciliation_date DESC);

-- -------------------------------------------------------------------------
-- 7. QUERIES ÚTEIS
-- -------------------------------------------------------------------------

-- 7.1. Buscar extratos NÃO conciliados de uma conta:
/*
SELECT 
  bs.id,
  bs.transaction_date,
  bs.description,
  bs.amount,
  bs.type
FROM bank_statements bs
WHERE bs.bank_account_id = '<account_id>'
  AND bs.status = 'pending'
  AND bs.reconciled = FALSE
ORDER BY bs.transaction_date DESC;
*/

-- 7.2. Buscar receitas NÃO conciliadas de uma unidade:
/*
SELECT 
  r.id,
  r.date,
  r.description,
  r.value,
  r.status
FROM revenues r
WHERE r.unit_id = '<unit_id>'
  AND r.status NOT IN ('Conciliado', 'Cancelled')
  AND r.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 
    FROM reconciliations rec 
    WHERE rec.reference_id = r.id 
      AND rec.reference_type = 'Revenue'
  )
ORDER BY r.date DESC;
*/

-- 7.3. Buscar despesas NÃO conciliadas de uma unidade:
/*
SELECT 
  e.id,
  e.date,
  e.description,
  e.value,
  e.status
FROM expenses e
WHERE e.unit_id = '<unit_id>'
  AND e.status NOT IN ('Conciliado', 'Cancelled')
  AND e.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 
    FROM reconciliations rec 
    WHERE rec.reference_id = e.id 
      AND rec.reference_type = 'Expense'
  )
ORDER BY e.date DESC;
*/

-- 7.4. Estatísticas de conciliação por unidade:
/*
SELECT 
  u.id AS unit_id,
  u.name AS unit_name,
  COUNT(bs.id) AS total_statements,
  COUNT(rec.id) AS total_reconciled,
  COUNT(bs.id) - COUNT(rec.id) AS total_pending,
  ROUND(
    (COUNT(rec.id)::NUMERIC / NULLIF(COUNT(bs.id), 0)) * 100, 
    2
  ) AS reconciliation_percentage
FROM units u
LEFT JOIN bank_accounts ba ON ba.unit_id = u.id
LEFT JOIN bank_statements bs ON bs.bank_account_id = ba.id
LEFT JOIN reconciliations rec ON rec.bank_statement_id = bs.id
WHERE u.is_active = TRUE
  AND bs.transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
GROUP BY u.id, u.name
ORDER BY total_statements DESC;
*/

-- =========================================================================
-- FIM DA MIGRATION
-- =========================================================================

-- PRÓXIMAS TAREFAS:
-- 1. Implementar RLS policies (policies criadas acima como exemplos)
-- 2. Criar índices para otimização de queries
-- 3. Adicionar função de auditoria para reconciliations (access_logs)
-- 4. Implementar validação de duplicatas via trigger
-- 5. Criar view vw_reconciliation_pending_items para facilitar matching

COMMENT ON TABLE reconciliations IS 
  'Conciliação bancária - vínculo extratos x lançamentos. 
  Usa referência polimórfica (reference_type + reference_id) para 
  vincular bank_statements com revenues ou expenses.
  Status possíveis: pending (aguardando confirmação), confirmed (conciliado), 
  Divergent (com diferença de valor), rejected (rejeitado).
  Trigger automático atualiza bank_statements.status.';

COMMENT ON COLUMN reconciliations.bank_statement_id IS 
  'ID do extrato bancário (bank_statements.id). 
  UNIQUE constraint garante 1:1 (um extrato = uma conciliação).';

COMMENT ON COLUMN reconciliations.reference_type IS 
  'Tipo de referência: Revenue (receita) ou Expense (despesa). 
  Usado com reference_id para JOIN polimórfico.';

COMMENT ON COLUMN reconciliations.reference_id IS 
  'ID da transação interna (revenues.id ou expenses.id). 
  Tipo determinado por reference_type.';

COMMENT ON COLUMN reconciliations.status IS 
  'Status da conciliação:
  - pending: Aguardando confirmação manual
  - confirmed: Conciliado e confirmado
  - Divergent: Conciliado mas com diferença de valor
  - rejected: Rejeitado/desfeito';

COMMENT ON COLUMN reconciliations.difference IS 
  'Diferença monetária entre extrato e transação interna. 
  Calculado como: ABS(bank_statement.amount) - ABS(reference.value). 
  Tolerância de até R$ 0.01 é considerada normal.';

COMMENT ON COLUMN reconciliations.confirmed_at IS 
  'Timestamp de quando a conciliação foi confirmada. 
  NULL = ainda pendente ou rejeitada.';

