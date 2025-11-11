-- Migration: Create OpenAI Cost Tracking Table
-- Description: Tabela para rastreamento de custos OpenAI por unidade e data
-- Created: 2025-11-08
-- Author: Andrey Viana

CREATE TABLE IF NOT EXISTS openai_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
  model VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_cost_positive CHECK (cost_usd >= 0),
  CONSTRAINT chk_tokens_positive CHECK (tokens_used >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_openai_cost_date ON openai_cost_tracking(date);
CREATE INDEX IF NOT EXISTS idx_openai_cost_unit_date ON openai_cost_tracking(unit_id, date);
CREATE INDEX IF NOT EXISTS idx_openai_cost_created_at ON openai_cost_tracking(created_at);

-- View para resumo mensal de custos
CREATE OR REPLACE VIEW vw_openai_cost_monthly AS
SELECT
  DATE_TRUNC('month', date)::DATE AS month,
  SUM(cost_usd) AS total_cost_usd,
  SUM(tokens_used) AS total_tokens,
  COUNT(*) AS total_requests,
  COUNT(DISTINCT unit_id) AS units_count
FROM openai_cost_tracking
GROUP BY DATE_TRUNC('month', date)::DATE
ORDER BY month DESC;

-- View para custos por unidade no mês atual
CREATE OR REPLACE VIEW vw_openai_cost_by_unit_current_month AS
SELECT
  unit_id,
  SUM(cost_usd) AS total_cost_usd,
  SUM(tokens_used) AS total_tokens,
  COUNT(*) AS total_requests,
  AVG(cost_usd) AS avg_cost_per_request
FROM openai_cost_tracking
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
GROUP BY unit_id
ORDER BY total_cost_usd DESC;

-- Comentários
COMMENT ON TABLE openai_cost_tracking IS 'Rastreamento detalhado de custos OpenAI por unidade e data';
COMMENT ON COLUMN openai_cost_tracking.unit_id IS 'ID da unidade que gerou o custo';
COMMENT ON COLUMN openai_cost_tracking.tokens_used IS 'Número de tokens utilizados na requisição';
COMMENT ON COLUMN openai_cost_tracking.cost_usd IS 'Custo em USD da requisição';
COMMENT ON COLUMN openai_cost_tracking.model IS 'Modelo OpenAI utilizado (ex: gpt-4o-mini)';

-- RLS (Row Level Security)
ALTER TABLE openai_cost_tracking ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode inserir/atualizar
CREATE POLICY "service_role_insert_update"
  ON openai_cost_tracking
  FOR INSERT
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_update"
  ON openai_cost_tracking
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Usuários podem visualizar custos de suas unidades
CREATE POLICY "view_own_unit_costs"
  ON openai_cost_tracking
  FOR SELECT
  USING (
    unit_id IN (
      SELECT unit_id FROM professionals
      WHERE user_id = auth.uid() AND is_active = true
    )
  );


