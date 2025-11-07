-- =====================================================
-- Migration: RLS Policies para módulo de comandas
-- Descrição: Políticas de segurança robustas para orders, order_items e revenues
-- Autor: Andrey Viana
-- Data: 28/10/2025
-- =====================================================

-- =====================================================
-- 1. TABELA: orders
-- =====================================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON orders;

-- Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuários podem ver comandas da sua unidade
CREATE POLICY "orders_select_policy"
ON orders
FOR SELECT
USING (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid()
  )
  OR
  -- Admins podem ver todas
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- INSERT: Apenas profissionais ativos podem criar comandas
CREATE POLICY "orders_insert_policy"
ON orders
FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid()
  )
  AND
  -- Verificar se existe caixa aberto
  EXISTS (
    SELECT 1 
    FROM cash_registers 
    WHERE unit_id = orders.unit_id 
      AND status = 'open' 
      AND is_active = true
  )
);

-- UPDATE: Apenas profissionais da mesma unidade podem atualizar
-- E apenas se a comanda ainda estiver aberta ou em andamento
CREATE POLICY "orders_update_policy"
ON orders
FOR UPDATE
USING (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid()
  )
  AND status IN ('open', 'in_progress', 'awaiting_payment')
)
WITH CHECK (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid()
  )
);

-- DELETE: Soft delete apenas para gerentes e admins da mesma unidade
CREATE POLICY "orders_delete_policy"
ON orders
FOR UPDATE
USING (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND (
        raw_user_meta_data->>'role' IN ('gerente', 'admin')
      )
  )
)
WITH CHECK (
  is_active = false -- Apenas permite soft delete
);

-- =====================================================
-- 2. TABELA: order_items
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON order_items;

-- Habilitar RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver itens de comandas da sua unidade
CREATE POLICY "order_items_select_policy"
ON order_items
FOR SELECT
USING (
  order_id IN (
    SELECT id 
    FROM orders 
    WHERE unit_id IN (
      SELECT unit_id 
      FROM professionals 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  )
);

-- INSERT: Adicionar itens apenas em comandas abertas da sua unidade
CREATE POLICY "order_items_insert_policy"
ON order_items
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT id 
    FROM orders 
    WHERE unit_id IN (
      SELECT unit_id 
      FROM professionals 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND status IN ('open', 'in_progress')
  )
);

-- UPDATE: Atualizar itens de comandas abertas
CREATE POLICY "order_items_update_policy"
ON order_items
FOR UPDATE
USING (
  order_id IN (
    SELECT id 
    FROM orders 
    WHERE unit_id IN (
      SELECT unit_id 
      FROM professionals 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND status IN ('open', 'in_progress')
  )
)
WITH CHECK (
  order_id IN (
    SELECT id 
    FROM orders 
    WHERE unit_id IN (
      SELECT unit_id 
      FROM professionals 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND status IN ('open', 'in_progress')
  )
);

-- DELETE: Soft delete de itens (gerentes e admins)
CREATE POLICY "order_items_delete_policy"
ON order_items
FOR UPDATE
USING (
  order_id IN (
    SELECT id 
    FROM orders 
    WHERE unit_id IN (
      SELECT unit_id 
      FROM professionals 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND (
          raw_user_meta_data->>'role' IN ('gerente', 'admin')
        )
    )
    AND status IN ('open', 'in_progress')
  )
)
WITH CHECK (
  is_active = false
);

-- =====================================================
-- 3. TABELA: revenues
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "revenues_select_policy" ON revenues;
DROP POLICY IF EXISTS "revenues_insert_policy" ON revenues;
DROP POLICY IF EXISTS "revenues_update_policy" ON revenues;
DROP POLICY IF EXISTS "revenues_delete_policy" ON revenues;

-- Habilitar RLS
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver receitas da sua unidade
CREATE POLICY "revenues_select_policy"
ON revenues
FOR SELECT
USING (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
  OR
  -- Admins podem ver todas
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- INSERT: Apenas sistema (via RPC/Edge Function) pode criar receitas
-- Ou gerentes/admins manualmente
CREATE POLICY "revenues_insert_policy"
ON revenues
FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND (
        raw_user_meta_data->>'role' IN ('gerente', 'admin')
      )
  )
);

-- UPDATE: Apenas gerentes e admins podem atualizar receitas
CREATE POLICY "revenues_update_policy"
ON revenues
FOR UPDATE
USING (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND (
        raw_user_meta_data->>'role' IN ('gerente', 'admin')
      )
  )
)
WITH CHECK (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND (
        raw_user_meta_data->>'role' IN ('gerente', 'admin')
      )
  )
);

-- DELETE: Soft delete apenas para admins
CREATE POLICY "revenues_delete_policy"
ON revenues
FOR UPDATE
USING (
  unit_id IN (
    SELECT unit_id 
    FROM professionals 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND (
        raw_user_meta_data->>'role' = 'admin'
      )
  )
)
WITH CHECK (
  is_active = false
);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON POLICY "orders_select_policy" ON orders IS 
'Permite visualizar comandas da própria unidade ou todas (admin)';

COMMENT ON POLICY "orders_insert_policy" ON orders IS 
'Permite criar comandas se houver caixa aberto na unidade';

COMMENT ON POLICY "orders_update_policy" ON orders IS 
'Permite atualizar comandas abertas da mesma unidade';

COMMENT ON POLICY "order_items_select_policy" ON order_items IS 
'Permite visualizar itens de comandas da própria unidade';

COMMENT ON POLICY "order_items_insert_policy" ON order_items IS 
'Permite adicionar itens em comandas abertas';

COMMENT ON POLICY "revenues_select_policy" ON revenues IS 
'Permite visualizar receitas da própria unidade ou todas (admin)';

COMMENT ON POLICY "revenues_insert_policy" ON revenues IS 
'Permite criar receitas (gerentes e admins)';
