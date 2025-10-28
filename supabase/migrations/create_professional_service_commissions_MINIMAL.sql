-- Migration MINIMALISTA: professional_service_commissions
-- Execute esta versão se a anterior ainda der erro

-- 1. Criar tabela básica
CREATE TABLE professional_service_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL,
  service_id UUID NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índice único
CREATE UNIQUE INDEX unique_professional_service 
  ON professional_service_commissions(professional_id, service_id);

-- 3. Habilitar RLS
ALTER TABLE professional_service_commissions ENABLE ROW LEVEL SECURITY;

-- 4. Policy básica (permite tudo para usuários autenticados)
CREATE POLICY "Permitir acesso para usuários autenticados"
  ON professional_service_commissions
  FOR ALL
  USING (auth.uid() IS NOT NULL);
