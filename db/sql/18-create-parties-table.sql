-- =====================================================
-- Migration: 18-create-parties-table.sql
-- Descrição: Criar tabela parties (clientes e fornecedores)
-- Data: 2025-10-13
-- Autor: Barber Analytics Pro
-- =====================================================

-- Criar ENUM para tipo de party
CREATE TYPE party_type AS ENUM ('Cliente', 'Fornecedor');

-- Criar tabela parties
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo party_type NOT NULL,
    cpf_cnpj VARCHAR(18), -- CPF: 000.000.000-00 ou CNPJ: 00.000.000/0000-00
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    observacoes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT parties_nome_not_empty CHECK (TRIM(nome) <> ''),
    CONSTRAINT parties_cpf_cnpj_unique UNIQUE (cpf_cnpj)
);

-- Criar índices para performance
CREATE INDEX idx_parties_unit_id ON parties(unit_id);
CREATE INDEX idx_parties_tipo ON parties(tipo);
CREATE INDEX idx_parties_nome ON parties(nome);
CREATE INDEX idx_parties_is_active ON parties(is_active);
CREATE INDEX idx_parties_unit_tipo ON parties(unit_id, tipo) WHERE is_active = TRUE;

-- Comentários nas colunas
COMMENT ON TABLE parties IS 'Tabela de clientes e fornecedores vinculados às unidades';
COMMENT ON COLUMN parties.id IS 'Identificador único da party';
COMMENT ON COLUMN parties.unit_id IS 'Unidade à qual a party pertence';
COMMENT ON COLUMN parties.nome IS 'Nome completo ou razão social';
COMMENT ON COLUMN parties.tipo IS 'Tipo: Cliente ou Fornecedor';
COMMENT ON COLUMN parties.cpf_cnpj IS 'CPF ou CNPJ (com ou sem formatação)';
COMMENT ON COLUMN parties.telefone IS 'Telefone de contato';
COMMENT ON COLUMN parties.email IS 'E-mail de contato';
COMMENT ON COLUMN parties.endereco IS 'Endereço completo';
COMMENT ON COLUMN parties.observacoes IS 'Observações gerais';
COMMENT ON COLUMN parties.is_active IS 'Indica se a party está ativa';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- Policy: Admin pode fazer tudo
CREATE POLICY "admin_all_parties"
ON parties
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policy: Gerente pode fazer tudo na sua unidade
CREATE POLICY "gerente_all_parties_own_unit"
ON parties
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN profissionais ON profissionais.user_id = auth.users.id
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'gerente'
        AND profissionais.unidade_id = parties.unit_id
        AND profissionais.is_active = TRUE
    )
);

-- Policy: Barbeiro pode apenas visualizar parties da sua unidade
CREATE POLICY "barbeiro_select_parties_own_unit"
ON parties
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN profissionais ON profissionais.user_id = auth.users.id
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'barbeiro'
        AND profissionais.unidade_id = parties.unit_id
        AND profissionais.is_active = TRUE
    )
);

-- =====================================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_parties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_parties_updated_at
BEFORE UPDATE ON parties
FOR EACH ROW
EXECUTE FUNCTION update_parties_updated_at();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON parties TO authenticated;
GRANT USAGE ON SEQUENCE parties_id_seq TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
