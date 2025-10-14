-- =====================================================
-- Migration: 21-extend-revenues-accrual.sql
-- Descrição: Estender tabela revenues com campos de competência (accrual)
-- Data: 2025-10-13
-- Autor: Barber Analytics Pro
-- =====================================================

-- Criar ENUM para status de transação
CREATE TYPE transaction_status AS ENUM ('Pendente', 'Parcial', 'Recebido', 'Pago', 'Cancelado', 'Atrasado');

-- Adicionar novos campos à tabela revenues
ALTER TABLE revenues
ADD COLUMN IF NOT EXISTS competencia_inicio DATE,
ADD COLUMN IF NOT EXISTS competencia_fim DATE,
ADD COLUMN IF NOT EXISTS data_prevista_recebimento DATE,
ADD COLUMN IF NOT EXISTS data_recebimento_efetivo DATE,
ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status transaction_status DEFAULT 'Pendente',
ADD COLUMN IF NOT EXISTS valor_bruto NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS taxas NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_liquido NUMERIC(15, 2);

-- Migrar dados existentes
-- value → valor_bruto, calcular valor_liquido
UPDATE revenues
SET 
    valor_bruto = value,
    valor_liquido = value,
    taxas = 0,
    data_prevista_recebimento = date,
    competencia_inicio = date,
    competencia_fim = date,
    status = 'Recebido'
WHERE valor_bruto IS NULL;

-- Criar índices para os novos campos
CREATE INDEX idx_revenues_party_id ON revenues(party_id);
CREATE INDEX idx_revenues_status ON revenues(status);
CREATE INDEX idx_revenues_competencia_inicio ON revenues(competencia_inicio);
CREATE INDEX idx_revenues_data_prevista_recebimento ON revenues(data_prevista_recebimento);
CREATE INDEX idx_revenues_data_recebimento_efetivo ON revenues(data_recebimento_efetivo);
CREATE INDEX idx_revenues_unit_competencia ON revenues(unit_id, competencia_inicio);
CREATE INDEX idx_revenues_status_pendente ON revenues(unit_id, status) WHERE status IN ('Pendente', 'Atrasado');

-- Adicionar constraints
ALTER TABLE revenues
ADD CONSTRAINT revenues_valor_bruto_positive CHECK (valor_bruto > 0),
ADD CONSTRAINT revenues_taxas_non_negative CHECK (taxas >= 0),
ADD CONSTRAINT revenues_valor_liquido_positive CHECK (valor_liquido > 0),
ADD CONSTRAINT revenues_valor_liquido_calc CHECK (valor_liquido = valor_bruto - taxas),
ADD CONSTRAINT revenues_competencia_dates CHECK (competencia_fim >= competencia_inicio);

-- Comentários nas novas colunas
COMMENT ON COLUMN revenues.competencia_inicio IS 'Data de início do período de competência';
COMMENT ON COLUMN revenues.competencia_fim IS 'Data de fim do período de competência';
COMMENT ON COLUMN revenues.data_prevista_recebimento IS 'Data prevista para recebimento';
COMMENT ON COLUMN revenues.data_recebimento_efetivo IS 'Data efetiva do recebimento (quando foi recebido)';
COMMENT ON COLUMN revenues.party_id IS 'Cliente que gerou a receita';
COMMENT ON COLUMN revenues.status IS 'Status da receita: Pendente, Parcial, Recebido, Cancelado, Atrasado';
COMMENT ON COLUMN revenues.valor_bruto IS 'Valor bruto da receita (antes das taxas)';
COMMENT ON COLUMN revenues.taxas IS 'Taxas deduzidas (cartão, impostos, etc)';
COMMENT ON COLUMN revenues.valor_liquido IS 'Valor líquido (bruto - taxas)';

-- =====================================================
-- FUNCTION PARA CALCULAR STATUS AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_revenue_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Se tem data de recebimento efetivo, está Recebido
    IF NEW.data_recebimento_efetivo IS NOT NULL THEN
        NEW.status := 'Recebido';
    
    -- Se está Pendente e passou da data prevista, marca como Atrasado
    ELSIF NEW.status = 'Pendente' AND NEW.data_prevista_recebimento < CURRENT_DATE THEN
        NEW.status := 'Atrasado';
    
    -- Se não tem data prevista, mantém status atual
    ELSIF NEW.status IS NULL THEN
        NEW.status := 'Pendente';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para auto-calcular status
CREATE TRIGGER trigger_calculate_revenue_status
BEFORE INSERT OR UPDATE ON revenues
FOR EACH ROW
EXECUTE FUNCTION calculate_revenue_status();

COMMENT ON FUNCTION calculate_revenue_status IS 'Calcula automaticamente o status da receita baseado nas datas';

-- =====================================================
-- ATUALIZAR RLS POLICIES PARA INCLUIR PARTY_ID
-- =====================================================

-- As policies existentes já cobrem os novos campos por usarem unit_id
-- Não é necessário modificar as policies, mas vamos adicionar comentário

COMMENT ON TABLE revenues IS 'Tabela de receitas com suporte a competência (accrual) e regime de caixa';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
