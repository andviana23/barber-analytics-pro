-- Migration: Criar tabela professional_service_commissions
-- Descrição: Armazena comissões personalizadas por profissional e serviço
-- Autor: Andrey Viana
-- Data: 2025-10-27

-- Criar tabela para comissões personalizadas (SEM foreign keys para evitar erro PGRST205)
CREATE TABLE IF NOT EXISTS professional_service_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL,
  service_id UUID NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: cada profissional pode ter apenas uma comissão customizada por serviço
  CONSTRAINT unique_professional_service UNIQUE (professional_id, service_id)
);

-- Comentários
COMMENT ON TABLE professional_service_commissions IS 'Armazena comissões personalizadas de profissionais por serviço';
COMMENT ON COLUMN professional_service_commissions.professional_id IS 'ID do profissional';
COMMENT ON COLUMN professional_service_commissions.service_id IS 'ID do serviço';
COMMENT ON COLUMN professional_service_commissions.commission_percentage IS 'Percentual de comissão customizado (0-100)';
COMMENT ON COLUMN professional_service_commissions.is_active IS 'Se a comissão personalizada está ativa';

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_prof_service_comm_professional 
  ON professional_service_commissions(professional_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_prof_service_comm_service 
  ON professional_service_commissions(service_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_prof_service_comm_lookup 
  ON professional_service_commissions(professional_id, service_id) 
  WHERE is_active = true;

-- Trigger para atualizar updated_at automaticamente
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

-- RLS (Row Level Security)
ALTER TABLE professional_service_commissions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem fazer tudo
CREATE POLICY "Admins podem gerenciar comissões personalizadas"
  ON professional_service_commissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
      AND p.is_active = true
    )
  );

-- Policy: Gerentes podem gerenciar comissões de profissionais da sua unidade
CREATE POLICY "Gerentes podem gerenciar comissões da sua unidade"
  ON professional_service_commissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM professionals p1
      INNER JOIN professionals p2 ON p1.unit_id = p2.unit_id
      WHERE p1.user_id = auth.uid()
      AND p1.role = 'gerente'
      AND p1.is_active = true
      AND p2.id = professional_service_commissions.professional_id
      AND p2.is_active = true
    )
  );

-- Policy: Profissionais podem ver suas próprias comissões
CREATE POLICY "Profissionais podem ver suas comissões"
  ON professional_service_commissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.user_id = auth.uid()
      AND p.id = professional_service_commissions.professional_id
      AND p.is_active = true
    )
  );
