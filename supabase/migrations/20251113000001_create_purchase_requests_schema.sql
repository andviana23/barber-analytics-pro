-- =====================================================
-- Sprint 3.1: Purchase Requests Schema
-- Created: 13/11/2025
-- Author: Andrey Viana
-- Description: Solicitação de compras e cotações com aprovação
-- =====================================================

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- Status da solicitação de compra
CREATE TYPE purchase_request_status_enum AS ENUM (
  'DRAFT',        -- Rascunho (editável)
  'SUBMITTED',    -- Enviado para aprovação
  'APPROVED',     -- Aprovado (gera purchase order)
  'REJECTED',     -- Rejeitado
  'CANCELLED'     -- Cancelado pelo solicitante
);

COMMENT ON TYPE purchase_request_status_enum IS 'Status do ciclo de vida de uma solicitação de compra';

-- =====================================================
-- 2. TABLES
-- =====================================================

-- 2.1 Tabela principal: purchase_requests
CREATE TABLE purchase_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relacionamentos
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  requested_by UUID NOT NULL REFERENCES professionals(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES professionals(id) ON DELETE SET NULL,
  rejected_by UUID REFERENCES professionals(id) ON DELETE SET NULL,

  -- Dados da solicitação
  request_number VARCHAR(50) UNIQUE, -- Gerado automaticamente (ex: REQ-2025-001)
  status purchase_request_status_enum DEFAULT 'DRAFT' NOT NULL,
  priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),

  -- Valores (calculados automaticamente a partir dos items)
  total_estimated DECIMAL(12,2) DEFAULT 0.00,

  -- Justificativa e notas
  justification TEXT, -- Por que precisa comprar
  notes TEXT,         -- Observações adicionais

  -- Aprovação/Rejeição
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Auditoria
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários
COMMENT ON TABLE purchase_requests IS 'Solicitações de compra criadas por profissionais';
COMMENT ON COLUMN purchase_requests.request_number IS 'Número único da solicitação (REQ-YYYY-NNN)';
COMMENT ON COLUMN purchase_requests.priority IS 'Prioridade da solicitação (LOW, NORMAL, HIGH, URGENT)';
COMMENT ON COLUMN purchase_requests.justification IS 'Justificativa da necessidade de compra';
COMMENT ON COLUMN purchase_requests.total_estimated IS 'Valor total estimado calculado a partir dos items';

-- Índices
CREATE INDEX idx_purchase_requests_unit_id ON purchase_requests(unit_id);
CREATE INDEX idx_purchase_requests_requested_by ON purchase_requests(requested_by);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_created_at ON purchase_requests(created_at DESC);
CREATE INDEX idx_purchase_requests_request_number ON purchase_requests(request_number);
CREATE INDEX idx_purchase_requests_is_active ON purchase_requests(is_active);

-- 2.2 Tabela de items: purchase_request_items
CREATE TABLE purchase_request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relacionamentos
  request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Dados do item
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_measurement VARCHAR(20) NOT NULL, -- UN, KG, L, M, etc
  estimated_unit_cost DECIMAL(10,2), -- Custo unitário estimado (opcional)
  estimated_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * COALESCE(estimated_unit_cost, 0)) STORED,

  -- Notas específicas do item
  notes TEXT,

  -- Auditoria
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraint: Não permitir item duplicado na mesma requisição
  UNIQUE(request_id, product_id)
);

-- Comentários
COMMENT ON TABLE purchase_request_items IS 'Items solicitados em cada requisição de compra';
COMMENT ON COLUMN purchase_request_items.quantity IS 'Quantidade solicitada do produto';
COMMENT ON COLUMN purchase_request_items.unit_measurement IS 'Unidade de medida (UN, KG, L, M, etc)';
COMMENT ON COLUMN purchase_request_items.estimated_unit_cost IS 'Custo unitário estimado (se conhecido)';

-- Índices
CREATE INDEX idx_purchase_request_items_request_id ON purchase_request_items(request_id);
CREATE INDEX idx_purchase_request_items_product_id ON purchase_request_items(product_id);
CREATE INDEX idx_purchase_request_items_is_active ON purchase_request_items(is_active);

-- 2.3 Tabela de cotações: purchase_quotes
CREATE TABLE purchase_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relacionamentos
  request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  quoted_by UUID REFERENCES professionals(id) ON DELETE SET NULL, -- Quem fez a cotação

  -- Dados da cotação
  quote_number VARCHAR(50) UNIQUE, -- Número da cotação (COT-2025-001)

  -- Valores (calculados a partir dos items)
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),

  -- Condições comerciais
  delivery_days INT CHECK (delivery_days >= 0), -- Prazo de entrega em dias
  payment_terms VARCHAR(255), -- Ex: "30/60 dias", "À vista", "Parcelado 3x"

  -- Notas e arquivos
  notes TEXT,
  attachment_url TEXT, -- URL do arquivo anexo (cotação em PDF, por exemplo)

  -- Seleção
  is_selected BOOLEAN DEFAULT false, -- Se foi a cotação escolhida
  selected_at TIMESTAMPTZ,
  selected_by UUID REFERENCES professionals(id) ON DELETE SET NULL,
  selection_reason TEXT, -- Motivo da escolha

  -- Auditoria
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraint: Apenas uma cotação selecionada por requisição
  CONSTRAINT only_one_selected_quote_per_request UNIQUE (request_id, is_selected) DEFERRABLE INITIALLY DEFERRED
);

-- Comentários
COMMENT ON TABLE purchase_quotes IS 'Cotações de fornecedores para solicitações de compra';
COMMENT ON COLUMN purchase_quotes.quote_number IS 'Número único da cotação (COT-YYYY-NNN)';
COMMENT ON COLUMN purchase_quotes.delivery_days IS 'Prazo de entrega em dias úteis';
COMMENT ON COLUMN purchase_quotes.payment_terms IS 'Condições de pagamento oferecidas pelo fornecedor';
COMMENT ON COLUMN purchase_quotes.is_selected IS 'Indica se esta cotação foi selecionada para compra';

-- Índices
CREATE INDEX idx_purchase_quotes_request_id ON purchase_quotes(request_id);
CREATE INDEX idx_purchase_quotes_supplier_id ON purchase_quotes(supplier_id);
CREATE INDEX idx_purchase_quotes_is_selected ON purchase_quotes(is_selected) WHERE is_selected = true;
CREATE INDEX idx_purchase_quotes_created_at ON purchase_quotes(created_at DESC);
CREATE INDEX idx_purchase_quotes_quote_number ON purchase_quotes(quote_number);
CREATE INDEX idx_purchase_quotes_is_active ON purchase_quotes(is_active);

-- 2.4 Tabela de items da cotação: purchase_quote_items
CREATE TABLE purchase_quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relacionamentos
  quote_id UUID NOT NULL REFERENCES purchase_quotes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Dados do item cotado
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Notas específicas do item
  notes TEXT,

  -- Auditoria
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraint: Não permitir item duplicado na mesma cotação
  UNIQUE(quote_id, product_id)
);

-- Comentários
COMMENT ON TABLE purchase_quote_items IS 'Items individuais de cada cotação com preços do fornecedor';
COMMENT ON COLUMN purchase_quote_items.unit_cost IS 'Custo unitário oferecido pelo fornecedor';

-- Índices
CREATE INDEX idx_purchase_quote_items_quote_id ON purchase_quote_items(quote_id);
CREATE INDEX idx_purchase_quote_items_product_id ON purchase_quote_items(product_id);

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- 3.1 Função para gerar número de requisição automaticamente
CREATE OR REPLACE FUNCTION fn_generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INT;
  year_suffix VARCHAR(4);
BEGIN
  -- Pegar ano atual
  year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Buscar próximo número sequencial do ano
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 10) AS INT)), 0) + 1
  INTO next_number
  FROM purchase_requests
  WHERE request_number LIKE 'REQ-' || year_suffix || '-%';

  -- Gerar número no formato REQ-YYYY-NNN
  NEW.request_number := 'REQ-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generate_request_number() IS 'Gera número único de requisição no formato REQ-YYYY-NNN';

-- 3.2 Função para gerar número de cotação automaticamente
CREATE OR REPLACE FUNCTION fn_generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INT;
  year_suffix VARCHAR(4);
BEGIN
  -- Pegar ano atual
  year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Buscar próximo número sequencial do ano
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 10) AS INT)), 0) + 1
  INTO next_number
  FROM purchase_quotes
  WHERE quote_number LIKE 'COT-' || year_suffix || '-%';

  -- Gerar número no formato COT-YYYY-NNN
  NEW.quote_number := 'COT-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generate_quote_number() IS 'Gera número único de cotação no formato COT-YYYY-NNN';

-- 3.3 Função para calcular total estimado da requisição
CREATE OR REPLACE FUNCTION fn_update_request_total_estimated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_requests
  SET total_estimated = (
    SELECT COALESCE(SUM(estimated_total), 0)
    FROM purchase_request_items
    WHERE request_id = COALESCE(NEW.request_id, OLD.request_id)
      AND is_active = true
  )
  WHERE id = COALESCE(NEW.request_id, OLD.request_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_update_request_total_estimated() IS 'Recalcula total estimado da requisição ao modificar items';

-- 3.4 Função para calcular total da cotação
CREATE OR REPLACE FUNCTION fn_update_quote_total_price()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_quotes
  SET total_price = (
    SELECT COALESCE(SUM(total_cost), 0)
    FROM purchase_quote_items
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id)
      AND is_active = true
  )
  WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_update_quote_total_price() IS 'Recalcula total da cotação ao modificar items';

-- 3.5 Função para garantir apenas uma cotação selecionada por requisição
CREATE OR REPLACE FUNCTION fn_ensure_single_selected_quote()
RETURNS TRIGGER AS $$
BEGIN
  -- Se marcando como selecionada, desmarcar outras da mesma requisição
  IF NEW.is_selected = true THEN
    UPDATE purchase_quotes
    SET is_selected = false,
        selected_at = NULL,
        selected_by = NULL
    WHERE request_id = NEW.request_id
      AND id != NEW.id
      AND is_selected = true;

    -- Registrar timestamp e usuário da seleção
    NEW.selected_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_ensure_single_selected_quote() IS 'Garante que apenas uma cotação seja selecionada por requisição';

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- 4.1 Trigger para gerar número de requisição
CREATE TRIGGER trg_generate_request_number
  BEFORE INSERT ON purchase_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION fn_generate_request_number();

-- 4.2 Trigger para gerar número de cotação
CREATE TRIGGER trg_generate_quote_number
  BEFORE INSERT ON purchase_quotes
  FOR EACH ROW
  WHEN (NEW.quote_number IS NULL)
  EXECUTE FUNCTION fn_generate_quote_number();

-- 4.3 Trigger para atualizar updated_at (purchase_requests)
CREATE TRIGGER trg_purchase_requests_updated_at
  BEFORE UPDATE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- 4.4 Trigger para atualizar updated_at (purchase_request_items)
CREATE TRIGGER trg_purchase_request_items_updated_at
  BEFORE UPDATE ON purchase_request_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- 4.5 Trigger para atualizar updated_at (purchase_quotes)
CREATE TRIGGER trg_purchase_quotes_updated_at
  BEFORE UPDATE ON purchase_quotes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- 4.6 Trigger para recalcular total estimado da requisição
CREATE TRIGGER trg_update_request_total_estimated_insert
  AFTER INSERT ON purchase_request_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_request_total_estimated();

CREATE TRIGGER trg_update_request_total_estimated_update
  AFTER UPDATE ON purchase_request_items
  FOR EACH ROW
  WHEN (OLD.estimated_total IS DISTINCT FROM NEW.estimated_total OR OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION fn_update_request_total_estimated();

CREATE TRIGGER trg_update_request_total_estimated_delete
  AFTER DELETE ON purchase_request_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_request_total_estimated();

-- 4.7 Trigger para recalcular total da cotação
CREATE TRIGGER trg_update_quote_total_price_insert
  AFTER INSERT ON purchase_quote_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_quote_total_price();

CREATE TRIGGER trg_update_quote_total_price_update
  AFTER UPDATE ON purchase_quote_items
  FOR EACH ROW
  WHEN (OLD.total_cost IS DISTINCT FROM NEW.total_cost OR OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION fn_update_quote_total_price();

CREATE TRIGGER trg_update_quote_total_price_delete
  AFTER DELETE ON purchase_quote_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_quote_total_price();

-- 4.8 Trigger para garantir apenas uma cotação selecionada
CREATE TRIGGER trg_ensure_single_selected_quote
  BEFORE UPDATE OF is_selected ON purchase_quotes
  FOR EACH ROW
  WHEN (NEW.is_selected = true AND OLD.is_selected = false)
  EXECUTE FUNCTION fn_ensure_single_selected_quote();

-- =====================================================
-- 5. VIEWS
-- =====================================================

-- 5.1 View: Solicitações pendentes de aprovação
CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT
  pr.id,
  pr.request_number,
  pr.unit_id,
  u.name AS unit_name,
  pr.requested_by,
  p.name AS requested_by_name,
  pr.priority,
  pr.total_estimated,
  pr.justification,
  pr.created_at,

  -- Contagem de items
  COUNT(DISTINCT pri.id) AS items_count,

  -- Produtos solicitados (concatenados)
  STRING_AGG(DISTINCT prod.name, ', ' ORDER BY prod.name) AS products_list

FROM purchase_requests pr
INNER JOIN units u ON pr.unit_id = u.id
INNER JOIN professionals p ON pr.requested_by = p.id
LEFT JOIN purchase_request_items pri ON pr.id = pri.request_id AND pri.is_active = true
LEFT JOIN products prod ON pri.product_id = prod.id

WHERE pr.status = 'SUBMITTED'
  AND pr.is_active = true

GROUP BY pr.id, u.name, p.name

ORDER BY
  CASE pr.priority
    WHEN 'URGENT' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'NORMAL' THEN 3
    WHEN 'LOW' THEN 4
  END,
  pr.created_at ASC;

COMMENT ON VIEW vw_pending_approvals IS 'Solicitações de compra com status SUBMITTED aguardando aprovação, ordenadas por prioridade';

-- 5.2 View: Comparação de cotações
CREATE OR REPLACE VIEW vw_quote_comparison AS
SELECT
  pq.request_id,
  pr.request_number,
  pq.id AS quote_id,
  pq.quote_number,
  pq.supplier_id,
  s.name AS supplier_name,
  pq.total_price,
  pq.delivery_days,
  pq.payment_terms,
  pq.is_selected,
  pq.created_at AS quoted_at,

  -- Ranking de preço (1 = mais barato)
  DENSE_RANK() OVER (PARTITION BY pq.request_id ORDER BY pq.total_price ASC) AS price_rank,

  -- Diferença percentual em relação ao mais barato
  ROUND(
    ((pq.total_price - MIN(pq.total_price) OVER (PARTITION BY pq.request_id)) /
     NULLIF(MIN(pq.total_price) OVER (PARTITION BY pq.request_id), 0)) * 100,
    2
  ) AS price_diff_percentage,

  -- Contagem de items cotados
  COUNT(DISTINCT pqi.id) AS items_count

FROM purchase_quotes pq
INNER JOIN purchase_requests pr ON pq.request_id = pr.id
INNER JOIN suppliers s ON pq.supplier_id = s.id
LEFT JOIN purchase_quote_items pqi ON pq.id = pqi.quote_id AND pqi.is_active = true

WHERE pq.is_active = true
  AND pr.is_active = true
  AND s.is_active = true

GROUP BY pq.id, pr.request_number, s.name

ORDER BY pq.request_id, price_rank;

COMMENT ON VIEW vw_quote_comparison IS 'Comparação de cotações por requisição com ranking de preços';

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- 6.1 Enable RLS em todas as tabelas
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_quote_items ENABLE ROW LEVEL SECURITY;

-- 6.2 Policies para purchase_requests

-- SELECT: Ver solicitações da própria unidade
CREATE POLICY purchase_requests_select_own_unit
  ON purchase_requests
  FOR SELECT
  USING (
    unit_id IN (
      SELECT unit_id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- INSERT: Criar solicitações para a própria unidade
CREATE POLICY purchase_requests_insert_own_unit
  ON purchase_requests
  FOR INSERT
  WITH CHECK (
    unit_id IN (
      SELECT unit_id FROM professionals WHERE user_id = auth.uid()
    )
    AND requested_by IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Editar solicitações próprias (DRAFT ou CANCELLED) ou aprovar/rejeitar (gerente/admin)
CREATE POLICY purchase_requests_update_own_or_approve
  ON purchase_requests
  FOR UPDATE
  USING (
    -- Solicitações próprias em DRAFT
    (requested_by IN (SELECT id FROM professionals WHERE user_id = auth.uid()) AND status = 'DRAFT')
    OR
    -- Gerente/Admin pode aprovar/rejeitar
    (unit_id IN (
      SELECT p.unit_id
      FROM professionals p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('gerente', 'admin', 'administrador')
        AND p.is_active = true
    ))
  );

-- DELETE: Soft delete de solicitações próprias em DRAFT
CREATE POLICY purchase_requests_delete_own_draft
  ON purchase_requests
  FOR UPDATE
  USING (
    requested_by IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    AND status = 'DRAFT'
  );

-- 6.3 Policies para purchase_request_items

-- SELECT: Ver items de solicitações da própria unidade
CREATE POLICY purchase_request_items_select_own_unit
  ON purchase_request_items
  FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM purchase_requests
      WHERE unit_id IN (
        SELECT unit_id FROM professionals WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Adicionar items em solicitações próprias (DRAFT)
CREATE POLICY purchase_request_items_insert_own_draft
  ON purchase_request_items
  FOR INSERT
  WITH CHECK (
    request_id IN (
      SELECT id FROM purchase_requests
      WHERE requested_by IN (SELECT id FROM professionals WHERE user_id = auth.uid())
        AND status = 'DRAFT'
    )
  );

-- UPDATE: Editar items de solicitações próprias (DRAFT)
CREATE POLICY purchase_request_items_update_own_draft
  ON purchase_request_items
  FOR UPDATE
  USING (
    request_id IN (
      SELECT id FROM purchase_requests
      WHERE requested_by IN (SELECT id FROM professionals WHERE user_id = auth.uid())
        AND status = 'DRAFT'
    )
  );

-- DELETE: Remover items de solicitações próprias (DRAFT)
CREATE POLICY purchase_request_items_delete_own_draft
  ON purchase_request_items
  FOR DELETE
  USING (
    request_id IN (
      SELECT id FROM purchase_requests
      WHERE requested_by IN (SELECT id FROM professionals WHERE user_id = auth.uid())
        AND status = 'DRAFT'
    )
  );

-- 6.4 Policies para purchase_quotes

-- SELECT: Ver cotações de solicitações da própria unidade
CREATE POLICY purchase_quotes_select_own_unit
  ON purchase_quotes
  FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM purchase_requests
      WHERE unit_id IN (
        SELECT unit_id FROM professionals WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Gerente/Admin pode criar cotações
CREATE POLICY purchase_quotes_insert_manager
  ON purchase_quotes
  FOR INSERT
  WITH CHECK (
    request_id IN (
      SELECT pr.id
      FROM purchase_requests pr
      INNER JOIN professionals p ON p.unit_id = pr.unit_id
      WHERE p.user_id = auth.uid()
        AND p.role IN ('gerente', 'admin', 'administrador')
        AND p.is_active = true
        AND pr.status IN ('SUBMITTED', 'APPROVED')
    )
  );

-- UPDATE: Gerente/Admin pode editar/selecionar cotações
CREATE POLICY purchase_quotes_update_manager
  ON purchase_quotes
  FOR UPDATE
  USING (
    request_id IN (
      SELECT pr.id
      FROM purchase_requests pr
      INNER JOIN professionals p ON p.unit_id = pr.unit_id
      WHERE p.user_id = auth.uid()
        AND p.role IN ('gerente', 'admin', 'administrador')
        AND p.is_active = true
    )
  );

-- DELETE: Gerente/Admin pode remover cotações
CREATE POLICY purchase_quotes_delete_manager
  ON purchase_quotes
  FOR DELETE
  USING (
    request_id IN (
      SELECT pr.id
      FROM purchase_requests pr
      INNER JOIN professionals p ON p.unit_id = pr.unit_id
      WHERE p.user_id = auth.uid()
        AND p.role IN ('gerente', 'admin', 'administrador')
        AND p.is_active = true
    )
  );

-- 6.5 Policies para purchase_quote_items

-- SELECT: Ver items de cotações da própria unidade
CREATE POLICY purchase_quote_items_select_own_unit
  ON purchase_quote_items
  FOR SELECT
  USING (
    quote_id IN (
      SELECT pq.id FROM purchase_quotes pq
      INNER JOIN purchase_requests pr ON pq.request_id = pr.id
      WHERE pr.unit_id IN (
        SELECT unit_id FROM professionals WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Gerente/Admin pode adicionar items nas cotações
CREATE POLICY purchase_quote_items_insert_manager
  ON purchase_quote_items
  FOR INSERT
  WITH CHECK (
    quote_id IN (
      SELECT pq.id FROM purchase_quotes pq
      INNER JOIN purchase_requests pr ON pq.request_id = pr.id
      INNER JOIN professionals p ON p.unit_id = pr.unit_id
      WHERE p.user_id = auth.uid()
        AND p.role IN ('gerente', 'admin', 'administrador')
        AND p.is_active = true
    )
  );

-- UPDATE: Gerente/Admin pode editar items de cotações
CREATE POLICY purchase_quote_items_update_manager
  ON purchase_quote_items
  FOR UPDATE
  USING (
    quote_id IN (
      SELECT pq.id FROM purchase_quotes pq
      INNER JOIN purchase_requests pr ON pq.request_id = pr.id
      INNER JOIN professionals p ON p.unit_id = pr.unit_id
      WHERE p.user_id = auth.uid()
        AND p.role IN ('gerente', 'admin', 'administrador')
        AND p.is_active = true
    )
  );

-- DELETE: Gerente/Admin pode remover items de cotações
CREATE POLICY purchase_quote_items_delete_manager
  ON purchase_quote_items
  FOR DELETE
  USING (
    quote_id IN (
      SELECT pq.id FROM purchase_quotes pq
      INNER JOIN purchase_requests pr ON pq.request_id = pr.id
      INNER JOIN professionals p ON p.unit_id = pr.unit_id
      WHERE p.user_id = auth.uid()
        AND p.role IN ('gerente', 'admin', 'administrador')
        AND p.is_active = true
    )
  );

-- =====================================================
-- 7. GRANTS
-- =====================================================

-- Permissões para usuários autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_request_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_quote_items TO authenticated;

-- Permissões para views
GRANT SELECT ON vw_pending_approvals TO authenticated;
GRANT SELECT ON vw_quote_comparison TO authenticated;

-- =====================================================
-- 8. VALIDATION & TESTING
-- =====================================================

-- 8.1 Criar dados de teste (comentado - descomentar para testar)
/*
-- Inserir solicitação de teste
INSERT INTO purchase_requests (unit_id, requested_by, priority, justification)
VALUES (
  (SELECT id FROM units LIMIT 1),
  (SELECT id FROM professionals WHERE is_active = true LIMIT 1),
  'NORMAL',
  'Estoque baixo de produtos de higienização'
);

-- Inserir items da solicitação
INSERT INTO purchase_request_items (request_id, product_id, quantity, unit_measurement, estimated_unit_cost)
VALUES
  (
    (SELECT id FROM purchase_requests ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM products WHERE name ILIKE '%shampoo%' LIMIT 1),
    10,
    'UN',
    25.00
  ),
  (
    (SELECT id FROM purchase_requests ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM products WHERE name ILIKE '%gel%' LIMIT 1),
    5,
    'UN',
    30.00
  );

-- Verificar cálculo automático do total
SELECT
  request_number,
  total_estimated,
  (SELECT COUNT(*) FROM purchase_request_items WHERE request_id = purchase_requests.id) AS items_count
FROM purchase_requests
ORDER BY created_at DESC
LIMIT 1;
*/

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sprint 3.1: Purchase Requests Schema criado com sucesso!';
  RAISE NOTICE '📊 4 tabelas criadas: purchase_requests, purchase_request_items, purchase_quotes, purchase_quote_items';
  RAISE NOTICE '🔧 5 funções criadas: geração de números, cálculo de totais, seleção única';
  RAISE NOTICE '⚡ 13 triggers configurados: auditoria, cálculos automáticos, validações';
  RAISE NOTICE '👁️ 2 views criadas: vw_pending_approvals, vw_quote_comparison';
  RAISE NOTICE '🔒 20 RLS policies configuradas: controle de acesso por role e unidade';
END $$;
