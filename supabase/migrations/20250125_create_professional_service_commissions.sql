-- Migração: Criar tabela professional_service_commissions
-- Data: 25/01/2025
-- Objetivo: Permitir comissões personalizadas por profissional e serviço

-- Criar tabela para comissões personalizadas
CREATE TABLE IF NOT EXISTS professional_service_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não haja duplicatas
    UNIQUE(professional_id, service_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_professional_service_commissions_professional_id 
ON professional_service_commissions(professional_id);

CREATE INDEX IF NOT EXISTS idx_professional_service_commissions_service_id 
ON professional_service_commissions(service_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_professional_service_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_professional_service_commissions_updated_at
    BEFORE UPDATE ON professional_service_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_service_commissions_updated_at();

-- Comentários para documentação
COMMENT ON TABLE professional_service_commissions IS 'Comissões personalizadas por profissional e serviço';
COMMENT ON COLUMN professional_service_commissions.professional_id IS 'ID do profissional';
COMMENT ON COLUMN professional_service_commissions.service_id IS 'ID do serviço';
COMMENT ON COLUMN professional_service_commissions.commission_percentage IS 'Percentual de comissão personalizada (0-100%)';

-- RLS (Row Level Security)
ALTER TABLE professional_service_commissions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas comissões da sua unidade
CREATE POLICY "Users can view commissions from their unit" ON professional_service_commissions
    FOR SELECT USING (
        professional_id IN (
            SELECT id FROM professionals 
            WHERE unit_id = auth.jwt() ->> 'unit_id'
        )
    );

-- Política: Usuários podem inserir comissões para profissionais da sua unidade
CREATE POLICY "Users can insert commissions for their unit" ON professional_service_commissions
    FOR INSERT WITH CHECK (
        professional_id IN (
            SELECT id FROM professionals 
            WHERE unit_id = auth.jwt() ->> 'unit_id'
        )
    );

-- Política: Usuários podem atualizar comissões da sua unidade
CREATE POLICY "Users can update commissions from their unit" ON professional_service_commissions
    FOR UPDATE USING (
        professional_id IN (
            SELECT id FROM professionals 
            WHERE unit_id = auth.jwt() ->> 'unit_id'
        )
    );

-- Política: Usuários podem deletar comissões da sua unidade
CREATE POLICY "Users can delete commissions from their unit" ON professional_service_commissions
    FOR DELETE USING (
        professional_id IN (
            SELECT id FROM professionals 
            WHERE unit_id = auth.jwt() ->> 'unit_id'
        )
    );