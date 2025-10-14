-- Criação da tabela bank_accounts
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    bank VARCHAR(255) NOT NULL,
    agency VARCHAR(20) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    unit_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    initial_balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Índices para otimização
CREATE INDEX idx_bank_accounts_unit_id ON bank_accounts(unit_id);
CREATE INDEX idx_bank_accounts_is_active ON bank_accounts(is_active);
CREATE INDEX idx_bank_accounts_created_at ON bank_accounts(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_accounts_updated_at();

-- Row Level Security (RLS)
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Política para administradores: acesso total
CREATE POLICY "Admin full access to bank accounts" 
    ON bank_accounts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid() 
            AND u.user_metadata->>'role' = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid() 
            AND u.user_metadata->>'role' = 'admin'
        )
    );

-- Política para gerentes: visualizar apenas contas da sua unidade
CREATE POLICY "Manager view own unit bank accounts" 
    ON bank_accounts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            JOIN profissionais p ON p.user_id = u.id
            WHERE u.id = auth.uid() 
            AND u.user_metadata->>'role' IN ('gerente', 'admin')
            AND (
                u.user_metadata->>'role' = 'admin' 
                OR p.unidade_id = bank_accounts.unit_id
            )
        )
    );

-- Comentários para documentação
COMMENT ON TABLE bank_accounts IS 'Tabela para armazenar informações das contas bancárias das unidades';
COMMENT ON COLUMN bank_accounts.name IS 'Nome identificador da conta (ex: Conta Corrente Principal)';
COMMENT ON COLUMN bank_accounts.bank IS 'Nome do banco (ex: Itaú, Bradesco)';
COMMENT ON COLUMN bank_accounts.agency IS 'Número da agência';
COMMENT ON COLUMN bank_accounts.account_number IS 'Número da conta';
COMMENT ON COLUMN bank_accounts.unit_id IS 'Referência para a unidade proprietária da conta';
COMMENT ON COLUMN bank_accounts.initial_balance IS 'Saldo inicial da conta (opcional)';
COMMENT ON COLUMN bank_accounts.is_active IS 'Indica se a conta está ativa (soft delete)';