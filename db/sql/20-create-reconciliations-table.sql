-- =====================================================
-- Migration: 20-create-reconciliations-table.sql
-- Descrição: Criar tabela reconciliations (vínculos extrato ↔ lançamentos)
-- Data: 2025-10-13
-- Autor: Barber Analytics Pro
-- =====================================================

-- Criar ENUM para tipo de referência
CREATE TYPE reference_type AS ENUM ('Revenue', 'Expense');

-- Criar ENUM para status de conciliação
CREATE TYPE reconciliation_status AS ENUM ('Pendente', 'Parcial', 'Compensado', 'Divergente');

-- Criar tabela reconciliations
CREATE TABLE IF NOT EXISTS reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_statement_id UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
    referencia_tipo reference_type NOT NULL,
    referencia_id UUID NOT NULL,
    data_compensacao DATE NOT NULL DEFAULT CURRENT_DATE,
    status reconciliation_status NOT NULL DEFAULT 'Pendente',
    diferenca NUMERIC(15, 2) DEFAULT 0,
    observacao TEXT,
    reconciled_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT reconciliations_unique_statement UNIQUE (bank_statement_id, referencia_tipo, referencia_id),
    CONSTRAINT reconciliations_diferenca_check CHECK (diferenca >= 0)
);

-- Criar índices para performance
CREATE INDEX idx_reconciliations_statement_id ON reconciliations(bank_statement_id);
CREATE INDEX idx_reconciliations_reference ON reconciliations(referencia_tipo, referencia_id);
CREATE INDEX idx_reconciliations_status ON reconciliations(status);
CREATE INDEX idx_reconciliations_data_compensacao ON reconciliations(data_compensacao);
CREATE INDEX idx_reconciliations_reconciled_by ON reconciliations(reconciled_by);

-- Comentários nas colunas
COMMENT ON TABLE reconciliations IS 'Tabela de conciliações entre extratos bancários e lançamentos financeiros';
COMMENT ON COLUMN reconciliations.id IS 'Identificador único da conciliação';
COMMENT ON COLUMN reconciliations.bank_statement_id IS 'Lançamento do extrato bancário';
COMMENT ON COLUMN reconciliations.referencia_tipo IS 'Tipo da referência: Revenue ou Expense';
COMMENT ON COLUMN reconciliations.referencia_id IS 'ID do lançamento financeiro (receita ou despesa)';
COMMENT ON COLUMN reconciliations.data_compensacao IS 'Data em que a compensação foi realizada';
COMMENT ON COLUMN reconciliations.status IS 'Status: Pendente, Parcial, Compensado ou Divergente';
COMMENT ON COLUMN reconciliations.diferenca IS 'Diferença entre valores (sempre positiva)';
COMMENT ON COLUMN reconciliations.observacao IS 'Observações sobre a conciliação';
COMMENT ON COLUMN reconciliations.reconciled_by IS 'Usuário que realizou a conciliação';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

-- Policy: Admin pode fazer tudo
CREATE POLICY "admin_all_reconciliations"
ON reconciliations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policy: Gerente pode fazer tudo nas conciliações da sua unidade
CREATE POLICY "gerente_all_reconciliations_own_unit"
ON reconciliations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN profissionais ON profissionais.user_id = auth.users.id
        JOIN bank_statements ON bank_statements.id = reconciliations.bank_statement_id
        JOIN bank_accounts ON bank_accounts.id = bank_statements.bank_account_id
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'gerente'
        AND bank_accounts.unit_id = profissionais.unidade_id
        AND profissionais.is_active = TRUE
    )
);

-- =====================================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_reconciliations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reconciliations_updated_at
BEFORE UPDATE ON reconciliations
FOR EACH ROW
EXECUTE FUNCTION update_reconciliations_updated_at();

-- =====================================================
-- TRIGGER PARA ATUALIZAR CAMPO CONCILIADO NO BANK_STATEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION update_bank_statement_reconciliation()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando uma reconciliação é criada ou atualizada para "Compensado"
    IF (TG_OP = 'INSERT' AND NEW.status = 'Compensado') OR 
       (TG_OP = 'UPDATE' AND NEW.status = 'Compensado' AND OLD.status != 'Compensado') THEN
        
        UPDATE bank_statements
        SET conciliado = TRUE
        WHERE id = NEW.bank_statement_id;
        
    -- Quando uma reconciliação é removida ou status muda de "Compensado"
    ELSIF (TG_OP = 'DELETE' AND OLD.status = 'Compensado') OR
          (TG_OP = 'UPDATE' AND OLD.status = 'Compensado' AND NEW.status != 'Compensado') THEN
        
        -- Verifica se ainda existem outras reconciliações "Compensado" para este statement
        IF NOT EXISTS (
            SELECT 1 FROM reconciliations
            WHERE bank_statement_id = COALESCE(NEW.bank_statement_id, OLD.bank_statement_id)
            AND status = 'Compensado'
            AND id != COALESCE(OLD.id, NEW.id)
        ) THEN
            UPDATE bank_statements
            SET conciliado = FALSE
            WHERE id = COALESCE(NEW.bank_statement_id, OLD.bank_statement_id);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_statement_reconciliation
AFTER INSERT OR UPDATE OR DELETE ON reconciliations
FOR EACH ROW
EXECUTE FUNCTION update_bank_statement_reconciliation();

COMMENT ON FUNCTION update_bank_statement_reconciliation IS 'Atualiza o campo conciliado no bank_statement quando reconciliation muda';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON reconciliations TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
