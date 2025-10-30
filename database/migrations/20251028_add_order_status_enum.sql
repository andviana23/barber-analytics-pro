-- =====================================================
-- Migration: Add Order Status ENUM
-- Data: 28/10/2025
-- Autor: Agente Arquiteto (baseado em comanda_status.md)
-- Descrição: Refatora status de comandas de VARCHAR para ENUM
-- =====================================================

BEGIN;

-- ============================
-- 1. Criar o tipo ENUM
-- ============================
CREATE TYPE order_status_enum AS ENUM (
  'OPEN',                -- Comanda criada, aguardando início do atendimento
  'IN_PROGRESS',         -- Comanda em atendimento (itens sendo adicionados)
  'AWAITING_PAYMENT',    -- Atendimento finalizado, aguardando pagamento
  'CLOSED',              -- Comanda paga e finalizada
  'CANCELED'             -- Comanda cancelada (estorno)
);

COMMENT ON TYPE order_status_enum IS 'Status possíveis de uma comanda no sistema';

-- ============================
-- 2. Adicionar coluna temporária com o novo tipo
-- ============================
ALTER TABLE orders 
  ADD COLUMN status_new order_status_enum;

-- ============================
-- 3. Migrar dados existentes
-- ============================
-- Mapear valores antigos (VARCHAR) para novos (ENUM)
UPDATE orders
SET status_new = CASE 
  WHEN LOWER(status) = 'open' THEN 'OPEN'::order_status_enum
  WHEN LOWER(status) = 'closed' THEN 'CLOSED'::order_status_enum
  WHEN LOWER(status) = 'canceled' THEN 'CANCELED'::order_status_enum
  WHEN LOWER(status) = 'cancelled' THEN 'CANCELED'::order_status_enum
  -- Comandas abertas com itens assumem que estão em progresso
  WHEN LOWER(status) = 'in_progress' THEN 'IN_PROGRESS'::order_status_enum
  WHEN LOWER(status) = 'awaiting_payment' THEN 'AWAITING_PAYMENT'::order_status_enum
  ELSE 'OPEN'::order_status_enum -- Fallback seguro
END;

-- ============================
-- 4. Verificar se há NULLs (não deveria ter)
-- ============================
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM orders WHERE status_new IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Existem % comandas com status NULL após migração. Abortando.', null_count;
  END IF;
END $$;

-- ============================
-- 5. Dropar coluna antiga e renomear
-- ============================
ALTER TABLE orders DROP COLUMN status;
ALTER TABLE orders RENAME COLUMN status_new TO status;

-- ============================
-- 6. Adicionar NOT NULL constraint
-- ============================
ALTER TABLE orders 
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'OPEN'::order_status_enum;

-- ============================
-- 7. Criar índice para performance
-- ============================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

COMMENT ON INDEX idx_orders_status IS 'Índice para filtros por status (melhora queries de listagem)';

-- ============================
-- 8. Adicionar índice composto para queries comuns
-- ============================
-- Queries como: "comandas abertas da unidade X"
CREATE INDEX IF NOT EXISTS idx_orders_unit_status 
  ON orders(unit_id, status) 
  WHERE is_active = true;

COMMENT ON INDEX idx_orders_unit_status IS 'Índice otimizado para filtrar comandas ativas por unidade e status';

-- ============================
-- 9. Criar índice para comandas em atendimento (queries de realtime)
-- ============================
CREATE INDEX IF NOT EXISTS idx_orders_active_open 
  ON orders(created_at DESC) 
  WHERE status IN ('OPEN', 'IN_PROGRESS', 'AWAITING_PAYMENT') 
    AND is_active = true;

COMMENT ON INDEX idx_orders_active_open IS 'Índice para dashboard de comandas em andamento (otimiza Realtime)';

-- ============================
-- 10. Atualizar RLS Policies (se necessário)
-- ============================
-- As policies existentes devem continuar funcionando, pois usam apenas 'status'
-- Mas vamos garantir que as comparações funcionem:

-- Recriar policy de visualização (exemplo)
DROP POLICY IF EXISTS orders_select_policy ON orders;

CREATE POLICY orders_select_policy ON orders
  FOR SELECT
  USING (
    -- Usuário pode ver comandas da sua unidade
    unit_id IN (
      SELECT unit_id 
      FROM professionals 
      WHERE user_id = auth.uid()
    )
  );

-- ============================
-- 11. Validações de integridade
-- ============================
-- Garantir que comandas fechadas tenham payment_method_id e account_id
DO $$
DECLARE
  invalid_closed_orders INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_closed_orders
  FROM orders
  WHERE status = 'CLOSED'
    AND (payment_method_id IS NULL OR account_id IS NULL);
  
  IF invalid_closed_orders > 0 THEN
    RAISE WARNING 'Atenção: % comandas CLOSED sem dados de pagamento', invalid_closed_orders;
    -- Não aborta a migração, apenas alerta
  END IF;
END $$;

-- ============================
-- 12. Log da migração
-- ============================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '📊 Estatísticas:';
  RAISE NOTICE '   - OPEN: % comandas', (SELECT COUNT(*) FROM orders WHERE status = 'OPEN');
  RAISE NOTICE '   - IN_PROGRESS: % comandas', (SELECT COUNT(*) FROM orders WHERE status = 'IN_PROGRESS');
  RAISE NOTICE '   - AWAITING_PAYMENT: % comandas', (SELECT COUNT(*) FROM orders WHERE status = 'AWAITING_PAYMENT');
  RAISE NOTICE '   - CLOSED: % comandas', (SELECT COUNT(*) FROM orders WHERE status = 'CLOSED');
  RAISE NOTICE '   - CANCELED: % comandas', (SELECT COUNT(*) FROM orders WHERE status = 'CANCELED');
END $$;

COMMIT;

-- ============================
-- ROLLBACK (caso necessário)
-- ============================
-- Para reverter esta migration, execute:
/*
BEGIN;

-- Recriar coluna VARCHAR
ALTER TABLE orders ADD COLUMN status_old VARCHAR(50);

-- Converter ENUM de volta para VARCHAR
UPDATE orders
SET status_old = CASE 
  WHEN status = 'OPEN' THEN 'open'
  WHEN status = 'IN_PROGRESS' THEN 'open'  -- Volta para 'open'
  WHEN status = 'AWAITING_PAYMENT' THEN 'open'  -- Volta para 'open'
  WHEN status = 'CLOSED' THEN 'closed'
  WHEN status = 'CANCELED' THEN 'canceled'
END;

-- Dropar coluna ENUM e renomear
ALTER TABLE orders DROP COLUMN status;
ALTER TABLE orders RENAME COLUMN status_old TO status;

-- Definir default
ALTER TABLE orders 
  ALTER COLUMN status SET DEFAULT 'open',
  ALTER COLUMN status SET NOT NULL;

-- Dropar o tipo ENUM
DROP TYPE order_status_enum;

-- Dropar índices novos
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_unit_status;
DROP INDEX IF EXISTS idx_orders_active_open;

COMMIT;
*/
