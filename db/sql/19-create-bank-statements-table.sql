-- =====================================================
-- Migration: 19-create-bank-statements-table.sql
-- Descrição: Criar tabela bank_statements (extratos bancários importados)
-- Data: 2025-10-13
-- Autor: Barber Analytics Pro
-- =====================================================

-- Criar ENUM para tipo de lançamento
CREATE TYPE statement_type AS ENUM ('Entrada', 'Saida');

-- Criar tabela bank_statements
CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    data_lancamento DATE NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    tipo statement_type NOT NULL,
    saldo_apos NUMERIC(15, 2),
    conciliado BOOLEAN DEFAULT FALSE,
    hash_unique VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    imported_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT bank_statements_valor_positive CHECK (valor > 0),
    CONSTRAINT bank_statements_hash_unique UNIQUE (hash_unique),
    CONSTRAINT bank_statements_descricao_not_empty CHECK (TRIM(descricao) <> '')
);

-- Criar índices para performance
CREATE INDEX idx_bank_statements_account_id ON bank_statements(bank_account_id);
CREATE INDEX idx_bank_statements_data_lancamento ON bank_statements(data_lancamento);
CREATE INDEX idx_bank_statements_conciliado ON bank_statements(conciliado);
CREATE INDEX idx_bank_statements_tipo ON bank_statements(tipo);
CREATE INDEX idx_bank_statements_account_date ON bank_statements(bank_account_id, data_lancamento);
CREATE INDEX idx_bank_statements_not_reconciled ON bank_statements(bank_account_id, conciliado) WHERE conciliado = FALSE;

-- Comentários nas colunas
COMMENT ON TABLE bank_statements IS 'Tabela de lançamentos de extratos bancários importados';
COMMENT ON COLUMN bank_statements.id IS 'Identificador único do lançamento';
COMMENT ON COLUMN bank_statements.bank_account_id IS 'Conta bancária do lançamento';
COMMENT ON COLUMN bank_statements.data_lancamento IS 'Data do lançamento no extrato';
COMMENT ON COLUMN bank_statements.descricao IS 'Descrição do lançamento';
COMMENT ON COLUMN bank_statements.valor IS 'Valor do lançamento (sempre positivo)';
COMMENT ON COLUMN bank_statements.tipo IS 'Tipo: Entrada ou Saída';
COMMENT ON COLUMN bank_statements.saldo_apos IS 'Saldo após o lançamento (opcional)';
COMMENT ON COLUMN bank_statements.conciliado IS 'Indica se o lançamento foi conciliado';
COMMENT ON COLUMN bank_statements.hash_unique IS 'Hash MD5 para detectar duplicatas';
COMMENT ON COLUMN bank_statements.imported_by IS 'Usuário que importou o extrato';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;

-- Policy: Admin pode fazer tudo
CREATE POLICY "admin_all_bank_statements"
ON bank_statements
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policy: Gerente pode fazer tudo nas contas da sua unidade
CREATE POLICY "gerente_all_bank_statements_own_unit"
ON bank_statements
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN profissionais ON profissionais.user_id = auth.users.id
        JOIN bank_accounts ON bank_accounts.unit_id = profissionais.unidade_id
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'gerente'
        AND bank_accounts.id = bank_statements.bank_account_id
        AND profissionais.is_active = TRUE
    )
);

-- Policy: Gerente pode visualizar extratos da sua unidade
CREATE POLICY "gerente_select_bank_statements_own_unit"
ON bank_statements
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN profissionais ON profissionais.user_id = auth.users.id
        JOIN bank_accounts ON bank_accounts.unit_id = profissionais.unidade_id
        WHERE auth.users.id = auth.uid()
        AND bank_accounts.id = bank_statements.bank_account_id
        AND profissionais.is_active = TRUE
    )
);

-- =====================================================
-- FUNCTION PARA GERAR HASH ÚNICO
-- =====================================================

CREATE OR REPLACE FUNCTION generate_statement_hash(
    p_bank_account_id UUID,
    p_data_lancamento DATE,
    p_valor NUMERIC,
    p_descricao TEXT
)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN MD5(
        p_bank_account_id::TEXT || 
        p_data_lancamento::TEXT || 
        p_valor::TEXT || 
        LOWER(TRIM(p_descricao))
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_statement_hash IS 'Gera hash MD5 único para detectar duplicatas em extratos';

-- =====================================================
-- TRIGGER PARA AUTO-GERAR HASH
-- =====================================================

CREATE OR REPLACE FUNCTION set_statement_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hash_unique IS NULL OR NEW.hash_unique = '' THEN
        NEW.hash_unique := generate_statement_hash(
            NEW.bank_account_id,
            NEW.data_lancamento,
            NEW.valor,
            NEW.descricao
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_statement_hash
BEFORE INSERT ON bank_statements
FOR EACH ROW
EXECUTE FUNCTION set_statement_hash();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON bank_statements TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
