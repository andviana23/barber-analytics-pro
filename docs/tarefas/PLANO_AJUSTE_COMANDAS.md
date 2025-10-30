# 🔧 Plano de Ajuste - Módulo de Comandas

**Sistema:** Barber Analytics Pro  
**Módulo:** Comandas (Orders)  
**Data:** 30/10/2025  
**Autor:** Andrey Viana  
**Prioridade:** Alta (P1)

---

## 📊 Resumo Executivo

Este documento apresenta um plano estruturado para correção de bugs e melhorias identificados no módulo de Comandas do sistema Barber Analytics Pro. Os ajustes visam aumentar a **robustez**, **consistência** e **experiência do usuário** no fluxo de criação, edição e fechamento de comandas.

### 🎯 Objetivos

- Corrigir inconsistências nas regras de edição de comandas
- Melhorar segurança e performance dos cálculos de totais
- Implementar validações de estoque (se aplicável)
- Adicionar auditoria e rastreabilidade
- Otimizar experiência do usuário

---

## 🐛 Bugs Identificados

### 1️⃣ **Bug Crítico: Inconsistência na Edição de Itens**

**Descrição:**  
É possível **adicionar** serviços a uma comanda com status `IN_PROGRESS` (Em Atendimento), mas **não é possível remover** serviços nesse mesmo status. A função `removeServiceFromOrder` valida apenas status `OPEN`.

**Localização:**

- `src/services/orderService.js` → `removeServiceFromOrder()` (linha ~200)

**Impacto:**

- Bloqueio operacional: usuário adiciona serviço errado e não consegue remover
- UX ruim: quebra da expectativa de edição durante atendimento
- Necessidade de cancelar toda a comanda para corrigir erro simples

**Código Atual (Problemático):**

```javascript
// Valida se comanda está aberta
if (order.status !== 'open') {
  const error = new Error(
    'Não é possível remover serviços de uma comanda fechada ou cancelada'
  );
  toast.error(error.message);
  return { data: null, error };
}
```

**Correção Proposta:**

```javascript
// Valida se comanda pode ser editada
if (!canEditOrder(order.status)) {
  const error = new Error(
    `Não é possível remover serviços de uma comanda com status ${order.status}`
  );
  toast.error(error.message);
  return { data: null, error };
}
```

**Validação Necessária:**

- Usar `canEditOrder()` de `orderStatus.js` (já implementado)
- Permite edição em status: `OPEN` e `IN_PROGRESS`
- Bloqueia edição em: `AWAITING_PAYMENT`, `CLOSED`, `CANCELED`

---

### 2️⃣ **Bug de Segurança: Cálculo de Totais no Frontend**

**Descrição:**  
A função `getOrderDetails()` calcula os totais da comanda **no lado do cliente** usando `calculateOrderTotals()` do DTO. Isso pode gerar:

- Inconsistências entre frontend e backend
- Vulnerabilidade de manipulação (valores podem ser alterados no browser)
- Divergência de regras de negócio

**Localização:**

- `src/services/orderService.js` → `getOrderDetails()` (linha ~450)
- `src/dtos/OrderItemDTO.js` → `calculateOrderTotals()` (linha ~150)

**Impacto:**

- **Segurança:** Totais exibidos podem não refletir a realidade do banco
- **Confiabilidade:** Cálculos diferentes entre backend (fn_calculate_order_totals) e frontend
- **Performance:** Processamento desnecessário no cliente

**Código Atual (Problemático):**

```javascript
async getOrderDetails(orderId) {
  try {
    const { data: order, error } = await orderRepository.getOrderById(orderId);
    if (error) {
      toast.error('Erro ao buscar comanda');
      return { data: null, error };
    }

    // ❌ Calcula totais no frontend
    const totals = calculateOrderTotals(order.items || []);

    return {
      data: {
        ...order,
        totals,
      },
      error: null,
    };
  } catch (error) {
    toast.error('Erro inesperado ao buscar comanda');
    return { data: null, error };
  }
}
```

**Correção Proposta:**

1. **Criar View SQL** que já retorna os totais calculados:

```sql
CREATE OR REPLACE VIEW vw_orders_with_totals AS
SELECT
  o.*,
  COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_amount,
  COALESCE(SUM(oi.commission_value), 0) AS total_commission,
  COUNT(oi.id) AS items_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;
```

2. **Usar a view no Repository**:

```javascript
async getOrderById(id) {
  const { data: order, error } = await supabase
    .from('vw_orders_with_totals')
    .select(`
      *,
      unit:units(id, name),
      client:parties!client_id(id, nome, cpf_cnpj, telefone, email),
      professional:professionals!professional_id(id, name, role),
      cash_register:cash_registers(id, status, opening_time),
      items:order_items(
        *,
        service:services(id, name, duration_minutes),
        professional:professionals!professional_id(id, name)
      )
    `)
    .eq('id', id)
    .single();

  return { data: order, error };
}
```

3. **Remover cálculo do Service**:

```javascript
async getOrderDetails(orderId) {
  try {
    const { data: order, error } = await orderRepository.getOrderById(orderId);

    if (error) {
      toast.error('Erro ao buscar comanda');
      return { data: null, error };
    }

    // ✅ Totais já vêm calculados do banco
    return { data: order, error: null };
  } catch (error) {
    toast.error('Erro inesperado ao buscar comanda');
    return { data: null, error };
  }
}
```

---

### 3️⃣ **Possível Bug: Falta de Validação de Estoque**

**Descrição:**  
Não há validação se o sistema gerencia produtos (além de serviços). Se vender produtos, é possível adicionar itens sem verificar disponibilidade em estoque.

**Localização:**

- `src/services/orderService.js` → `addServiceToOrder()` (linha ~100)

**Impacto:**

- Venda de produtos indisponíveis
- Estoque negativo
- Divergência entre sistema e realidade física

**Verificação Necessária:**

1. Confirmar se o sistema gerencia **produtos** além de serviços
2. Verificar tabela `products` e `stock` no banco

**Correção Proposta (se aplicável):**

```javascript
async addServiceToOrder(orderId, serviceData) {
  try {
    // ... validações existentes ...

    // Busca dados do serviço/produto
    const { data: service, error: serviceError } =
      await serviceRepository.getServiceById(serviceData.serviceId);

    if (serviceError) {
      toast.error('Erro ao buscar dados do serviço');
      return { data: null, error: serviceError };
    }

    if (!service.active) {
      const error = new Error('Este serviço está desativado');
      toast.error(error.message);
      return { data: null, error };
    }

    // ✅ NOVA VALIDAÇÃO: Se for produto, verifica estoque
    if (service.type === 'product') {
      const { data: stock, error: stockError } =
        await stockRepository.getStockByProductId(service.id, order.unit_id);

      if (stockError || !stock) {
        toast.error('Erro ao verificar estoque do produto');
        return { data: null, error: stockError || new Error('Produto sem estoque cadastrado') };
      }

      const requestedQuantity = serviceData.quantity || 1;

      if (stock.available_quantity < requestedQuantity) {
        const error = new Error(
          `Estoque insuficiente. Disponível: ${stock.available_quantity}, Solicitado: ${requestedQuantity}`
        );
        toast.error(error.message);
        return { data: null, error };
      }
    }

    // ... continua lógica normal ...
  } catch (error) {
    toast.error('Erro inesperado ao adicionar serviço');
    return { data: null, error };
  }
}
```

---

## 🔄 Melhorias Propostas

### 4️⃣ **Melhoria: Auditoria Completa de Ações**

**Objetivo:**  
Registrar todas as ações críticas em comandas para rastreabilidade e compliance.

**Implementação:**

1. **Criar tabela de auditoria**:

```sql
CREATE TABLE order_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'item_added', 'item_removed', 'closed', 'canceled'
  details JSONB, -- dados adicionais da ação
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_audit_order_id ON order_audit_log(order_id);
CREATE INDEX idx_order_audit_created_at ON order_audit_log(created_at);
```

2. **Adicionar logs no Service Layer**:

```javascript
async logOrderAction(orderId, action, details = {}) {
  try {
    const { user } = await supabase.auth.getUser();

    await supabase.from('order_audit_log').insert({
      order_id: orderId,
      user_id: user?.id,
      action,
      details,
    });
  } catch (error) {
    console.error('[OrderService] Erro ao registrar auditoria:', error);
    // Não interrompe o fluxo principal
  }
}

// Exemplo de uso
async createOrder(data) {
  // ... lógica de criação ...

  if (!result.error) {
    await this.logOrderAction(result.data.id, 'created', {
      clientId: data.clientId,
      professionalId: data.professionalId,
    });
  }

  return result;
}
```

---

### 5️⃣ **Melhoria: Validação de Transição de Status**

**Objetivo:**  
Garantir que todas as mudanças de status seguem a máquina de estados definida.

**Status Atual:**  
A validação existe em `orderStatus.js`, mas não é aplicada em todas as operações.

**Implementação:**

1. **Adicionar trigger no banco** (segurança extra):

```sql
CREATE OR REPLACE FUNCTION fn_validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Valida transições permitidas
  IF OLD.status = 'CLOSED' AND NEW.status NOT IN ('CANCELED') THEN
    RAISE EXCEPTION 'Transição inválida: CLOSED → %', NEW.status;
  END IF;

  IF OLD.status = 'CANCELED' THEN
    RAISE EXCEPTION 'Comandas canceladas não podem mudar de status';
  END IF;

  -- Registra a transição
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_order_status_transition
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_validate_order_status_transition();
```

2. **Garantir uso de `validateStatusTransition` no Service**:

```javascript
async updateOrderStatus(orderId, newStatus) {
  try {
    const { data: order, error: orderError } =
      await orderRepository.getOrderById(orderId);

    if (orderError) {
      toast.error('Erro ao buscar comanda');
      return { data: null, error: orderError };
    }

    // ✅ Validação obrigatória
    const transitionValidation = validateStatusTransition(
      order.status,
      newStatus
    );

    if (!transitionValidation.success) {
      const error = new Error(transitionValidation.error);
      toast.error(error.message);
      return { data: null, error };
    }

    // ... continua ...
  }
}
```

---

### 6️⃣ **Melhoria: Adicionar Campo `cancel_reason` na Tabela**

**Objetivo:**  
Permitir registro do motivo de cancelamento diretamente no banco.

**Implementação:**

```sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.cancel_reason IS 'Motivo do cancelamento da comanda';
COMMENT ON COLUMN orders.canceled_by IS 'Usuário que cancelou a comanda';
COMMENT ON COLUMN orders.canceled_at IS 'Data e hora do cancelamento';
```

**Atualizar Repository:**

```javascript
async cancelOrder(id, reason, userId = null) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: ORDER_STATUS.CANCELED,
        cancel_reason: reason,
        canceled_by: userId,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .neq('status', ORDER_STATUS.CANCELED)
      .select()
      .single();

    if (error) {
      console.error('[OrderRepository] Erro ao cancelar comanda:', error);
      return { data: null, error };
    }

    if (!order) {
      return {
        data: null,
        error: new Error('Comanda não encontrada ou já está cancelada'),
      };
    }

    console.log('[OrderRepository] Comanda cancelada com sucesso:', id);
    return { data: order, error: null };
  } catch (error) {
    console.error('[OrderRepository] Exceção ao cancelar comanda:', error);
    return { data: null, error };
  }
}
```

---

### 7️⃣ **Melhoria: Performance - Paginação e Cache**

**Objetivo:**  
Otimizar listagem de comandas para unidades com alto volume.

**Implementação:**

1. **Adicionar índices no banco**:

```sql
-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_orders_unit_status_date
ON orders(unit_id, status, created_at DESC);

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_orders_client_id
ON orders(client_id);

-- Índice para busca por profissional
CREATE INDEX IF NOT EXISTS idx_orders_professional_id
ON orders(professional_id);

-- Índice para busca por caixa
CREATE INDEX IF NOT EXISTS idx_orders_cash_register_id
ON orders(cash_register_id);
```

2. **Implementar cache no hook**:

```javascript
const useOrders = (unitId, enableRealtime = true) => {
  const [orders, setOrders] = useState([]);
  const [cache, setCache] = useState(new Map());

  const fetchOrders = useCallback(
    async (filters = {}) => {
      if (!unitId) return;

      // Gera cache key
      const cacheKey = JSON.stringify({ unitId, filters });

      // Verifica cache (válido por 5 minutos)
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setOrders(cached.data);
        setCount(cached.count);
        return;
      }

      setLoading(true);
      setError(null);

      const {
        data,
        error: err,
        count: total,
      } = await orderService.listOrders(unitId, filters);

      if (err) {
        setError(err.message);
        setOrders([]);
      } else {
        const filteredOrders = filterOrdersByPermission(data || [], user);
        setOrders(filteredOrders);
        setCount(total || 0);

        // Salva no cache
        setCache(prev =>
          new Map(prev).set(cacheKey, {
            data: filteredOrders,
            count: total || 0,
            timestamp: Date.now(),
          })
        );
      }

      setLoading(false);
    },
    [unitId, user, cache]
  );

  // ... resto do hook ...
};
```

---

## 📋 Checklist de Implementação

### Fase 1: Correções Críticas (P0)

- [ ] **Bug #1**: Corrigir validação de remoção de itens em `IN_PROGRESS`
  - [ ] Atualizar `orderService.js` → `removeServiceFromOrder()`
  - [ ] Adicionar testes unitários
  - [ ] Testar manualmente nos status `OPEN` e `IN_PROGRESS`

- [ ] **Bug #2**: Migrar cálculo de totais para o backend
  - [ ] Criar view SQL `vw_orders_with_totals`
  - [ ] Atualizar `orderRepository.js` → `getOrderById()`
  - [ ] Remover cálculo do `orderService.js` → `getOrderDetails()`
  - [ ] Validar com testes E2E

### Fase 2: Melhorias de Segurança (P1)

- [ ] **Melhoria #4**: Implementar auditoria completa
  - [ ] Criar tabela `order_audit_log`
  - [ ] Adicionar método `logOrderAction()` no Service
  - [ ] Integrar em todas as operações críticas

- [ ] **Melhoria #5**: Validação de transição de status
  - [ ] Criar trigger `trg_validate_order_status_transition`
  - [ ] Garantir uso de `validateStatusTransition` em todas as mudanças

- [ ] **Melhoria #6**: Campo `cancel_reason`
  - [ ] Adicionar colunas à tabela `orders`
  - [ ] Atualizar Repository e Service
  - [ ] Atualizar UI para exibir motivo

### Fase 3: Performance e UX (P2)

- [ ] **Bug #3**: Validação de estoque (se aplicável)
  - [ ] Verificar se sistema gerencia produtos
  - [ ] Implementar validação de estoque
  - [ ] Adicionar testes

- [ ] **Melhoria #7**: Performance
  - [ ] Criar índices no banco
  - [ ] Implementar cache no hook
  - [ ] Testar com 1000+ comandas

### Fase 4: Testes e Validação (P1)

- [ ] Testes unitários de todos os services alterados
- [ ] Testes de integração do fluxo completo
- [ ] Testes E2E (Playwright) dos cenários:
  - [ ] Criar comanda → Adicionar item → Remover item → Fechar
  - [ ] Criar comanda → Mudar status → Cancelar
  - [ ] Validar cálculos de totais
  - [ ] Validar auditoria

---

## 🧪 Estratégia de Testes

### Testes Unitários

```javascript
// tests/unit/services/orderService.test.js

describe('OrderService - removeServiceFromOrder', () => {
  it('deve permitir remover item de comanda OPEN', async () => {
    // Arrange
    const order = { id: '123', status: 'OPEN', items: [...] };
    const itemId = 'item-123';

    // Act
    const result = await orderService.removeServiceFromOrder(itemId);

    // Assert
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it('deve permitir remover item de comanda IN_PROGRESS', async () => {
    // Arrange
    const order = { id: '123', status: 'IN_PROGRESS', items: [...] };
    const itemId = 'item-123';

    // Act
    const result = await orderService.removeServiceFromOrder(itemId);

    // Assert
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it('NÃO deve permitir remover item de comanda CLOSED', async () => {
    // Arrange
    const order = { id: '123', status: 'CLOSED', items: [...] };
    const itemId = 'item-123';

    // Act
    const result = await orderService.removeServiceFromOrder(itemId);

    // Assert
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('CLOSED');
  });
});
```

### Testes E2E

```typescript
// e2e/orders-edit-flow.spec.ts

test.describe('Edição de Comandas', () => {
  test('deve permitir adicionar E remover item durante atendimento', async ({
    page,
  }) => {
    // Criar comanda
    await page.goto('/orders');
    await page.click('button:has-text("Nova Comanda")');
    await page.selectOption('[name="clientId"]', { index: 1 });
    await page.selectOption('[name="professionalId"]', { index: 1 });
    await page.click('button:has-text("Salvar")');

    // Adicionar item
    await page.click('button:has-text("Adicionar Serviço")');
    await page.selectOption('[name="serviceId"]', { index: 1 });
    await page.click('button:has-text("Adicionar")');

    // Validar item adicionado
    await expect(page.locator('.order-item')).toHaveCount(1);

    // Mudar status para IN_PROGRESS
    await page.click('button:has-text("Iniciar Atendimento")');

    // ✅ Deve permitir remover item
    await page.click('button.remove-item');
    await page.click('button:has-text("Confirmar")');

    // Validar remoção
    await expect(page.locator('.order-item')).toHaveCount(0);
    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
```

---

## 📈 Métricas de Sucesso

### KPIs Técnicos

- ✅ **0 bugs críticos** no módulo de comandas
- ✅ **100% de cobertura** de testes nos métodos alterados
- ✅ **< 100ms** tempo de resposta em cálculos de totais
- ✅ **100% das transições** validadas por trigger SQL

### KPIs de Negócio

- ✅ **0 comandas** com totais inconsistentes
- ✅ **100% de rastreabilidade** de ações críticas
- ✅ **Redução de 80%** em tickets de suporte sobre edição de comandas

---

## 🚀 Cronograma Sugerido

| Fase                            | Duração | Responsável   | Entrega                         |
| ------------------------------- | ------- | ------------- | ------------------------------- |
| **Fase 1** - Correções Críticas | 2 dias  | Dev Backend   | Service + Repository corrigidos |
| **Fase 2** - Segurança          | 3 dias  | Dev Backend   | Auditoria + Validações          |
| **Fase 3** - Performance        | 2 dias  | Dev Fullstack | Índices + Cache                 |
| **Fase 4** - Testes             | 3 dias  | QA + Dev      | Suite completa de testes        |
| **Review & Deploy**             | 1 dia   | Tech Lead     | Produção                        |

**Total:** 11 dias úteis (~2,5 semanas)

---

## 📝 Notas Finais

### Pontos de Atenção

1. **Rollback**: Manter script de rollback para todas as migrations SQL
2. **Comunicação**: Avisar usuários sobre melhorias antes do deploy
3. **Monitoramento**: Acompanhar logs de erro pós-deploy por 48h
4. **Performance**: Validar queries com EXPLAIN ANALYZE antes de aplicar índices

### Próximos Passos

Após implementação deste plano:

1. Documentar novas funcionalidades no `README.md`
2. Atualizar guias de usuário
3. Treinar time de suporte sobre mudanças
4. Revisar outros módulos com padrões similares (Caixa, Financeiro)

---

**✅ Plano aprovado por:** Andrey Viana  
**📅 Data de Criação:** 30/10/2025  
**🔄 Última Atualização:** 30/10/2025  
**📌 Status:** Aguardando implementação
