-- Migration: Create OpenAI Cache Table
-- Description: Tabela para cache de respostas OpenAI, reduzindo custos em até 60%
-- Created: 2025-11-08
-- Author: Andrey Viana

CREATE TABLE IF NOT EXISTS openai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_cache_key UNIQUE (cache_key)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_openai_cache_key ON openai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_openai_cache_created_at ON openai_cache(created_at);

-- Função para limpar cache antigo automaticamente
CREATE OR REPLACE FUNCTION fn_cleanup_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM openai_cache
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE openai_cache IS 'Cache de respostas OpenAI para reduzir custos';
COMMENT ON COLUMN openai_cache.cache_key IS 'Chave única gerada a partir das métricas principais';
COMMENT ON COLUMN openai_cache.response IS 'Resposta completa da OpenAI em formato texto';
COMMENT ON COLUMN openai_cache.created_at IS 'Data de criação do cache (TTL de 24h padrão)';

-- RLS (Row Level Security) - apenas service role pode acessar
ALTER TABLE openai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only"
  ON openai_cache
  FOR ALL
  USING (auth.role() = 'service_role');

