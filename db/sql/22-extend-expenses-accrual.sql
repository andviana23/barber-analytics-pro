-- =====================================================
-- Migration: 22-extend-expenses-accrual.sql
-- Descrição: Estender tabela expenses com campos de competência (accrual)
-- Data: 2025-10-13
-- Autor: Barber Analytics Pro
-- =====================================================

-- Adicionar novos campos à tabela expenses
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS competencia_inicio DATE,
ADD COLUMN IF NOT EXISTS competencia_fim DATE,
ADD COLUMN IF NOT EXISTS data_prevista_pagamento DATE,
ADD COLUMN IF NOT EXISTS data_pagamento_efetivo DATE,
ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status transaction_status DEFAULT 'Pendente';

-- Migrar dados existentes
-- date → data_prevista_pagamento
UPDATE expenses
SET 
    data_prevista_pagamento = date,
    competencia_inicio = date,
    competencia_fim = date,
    status = 'Pago'
WHERE data_prevista_pagamento IS NULL;

-- Criar índices para os novos campos
CREATE INDEX idx_expenses_party_id ON expenses(party_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_competencia_inicio ON expenses(competencia_inicio);
CREATE INDEX idx_expenses_data_prevista_pagamento ON expenses(data_prevista_pagamento);
CREATE INDEX idx_expenses_data_pagamento_efetivo ON expenses(data_pagamento_efetivo);
CREATE INDEX idx_expenses_unit_competencia ON expenses(unit_id, competencia_inicio);
CREATE INDEX idx_expenses_status_pendente ON expenses(unit_id, status) WHERE status IN ('Pendente', 'Atrasado');

-- Adicionar constraints
ALTER TABLE expenses
ADD CONSTRAINT expenses_competencia_dates CHECK (competencia_fim >= competencia_inicio);

-- Comentários nas novas colunas
COMMENT ON COLUMN expenses.competencia_inicio IS 'Data de início do período de competência';
COMMENT ON COLUMN expenses.competencia_fim IS 'Data de fim do período de competência';
COMMENT ON COLUMN expenses.data_prevista_pagamento IS 'Data prevista para pagamento';
COMMENT ON COLUMN expenses.data_pagamento_efetivo IS 'Data efetiva do pagamento (quando foi pago)';
COMMENT ON COLUMN expenses.party_id IS 'Fornecedor da despesa';
COMMENT ON COLUMN expenses.status IS 'Status da despesa: Pendente, Pago, Cancelado, Atrasado';

-- =====================================================
-- FUNCTION PARA CALCULAR STATUS AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_expense_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Se tem data de pagamento efetivo, está Pago
    IF NEW.data_pagamento_efetivo IS NOT NULL THEN
        NEW.status := 'Pago';
    
    -- Se está Pendente e passou da data prevista, marca como Atrasado
    ELSIF NEW.status = 'Pendente' AND NEW.data_prevista_pagamento < CURRENT_DATE THEN
        NEW.status := 'Atrasado';
    
    -- Se não tem status, define como Pendente
    ELSIF NEW.status IS NULL THEN
        NEW.status := 'Pendente';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para auto-calcular status
CREATE TRIGGER trigger_calculate_expense_status
BEFORE INSERT OR UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION calculate_expense_status();

COMMENT ON FUNCTION calculate_expense_status IS 'Calcula automaticamente o status da despesa baseado nas datas';

-- =====================================================
-- ATUALIZAR RLS POLICIES PARA INCLUIR PARTY_ID
-- =====================================================

-- As policies existentes já cobrem os novos campos por usarem unit_id
-- Não é necessário modificar as policies

COMMENT ON TABLE expenses IS 'Tabela de despesas com suporte a competência (accrual) e regime de caixa';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
