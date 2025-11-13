# 📦 Plano de Implementação — Módulo de Estoque (v2.0)

**Versão:** 2.0.0 | **Data:** 13 de novembro de 2025 | **Autor:** Andrey Viana
**Status:** 🟡 Planejamento Ativo | **Prioridade:** 🔴 Alta

---

## 📊 Status Geral do Projeto

| Componente               | Concluído | Pendente | Status |
| :----------------------- | --------: | -------: | :----: |
| **Interface (UI)**       |      100% |       0% |   ✅   |
| **CRUD Produtos**        |      100% |       0% |   ✅   |
| **Controle Estoque**     |       40% |      60% |   🟡   |
| **Alertas Básicos**      |       30% |      70% |   🟡   |
| **Movimentações**        |        0% |     100% |   ❌   |
| **Fornecedores**         |        0% |     100% |   ❌   |
| **Compras**              |        0% |     100% |   ❌   |
| **Vendas/Serviços**      |        0% |     100% |   ❌   |
| **Relatórios**           |        0% |     100% |   ❌   |
| **Alertas Inteligentes** |        0% |     100% |   ❌   |
| **TOTAL**                |   **30%** |  **70%** |   🟡   |

---

## 🎯 Objetivo do Módulo

Garantir **controle total** dos insumos e produtos de revenda da barbearia, com:

- ✅ Rastreabilidade ponta a ponta (quem, quando, quanto, por quê)
- ✅ Integração automática com vendas e serviços
- ✅ Automação de compras com aprovação em tempo real
- ✅ Monitoramento preventivo via alertas inteligentes
- ✅ Relatórios gerenciais com insights de consumo e giro
- ✅ Suporte multi-unidade (Mangabeiras, Nova Lima)

---

## 📋 Arquitetura Técnica

### Entidades Principais

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   products  │      │  product_categories │  │   suppliers │
└─────────────┘      └──────────────────┘      └─────────────┘
       ↓                                               ↓
       └───────────────┬────────────────┬──────────────┘
                       ↓                ↓
              ┌────────────────────┐    │
              │  stock_movements   │◄───┘
              │  (entradas/saídas) │
              └────────────────────┘
                       ↓
              ┌────────────────────┐
              │  purchase_requests │
              └────────────────────┘
                       ↓
              ┌────────────────────┐
              │  purchases         │
              │  + items           │
              │  + payments        │
              │  + attachments     │
              └────────────────────┘
                       ↓
              ┌────────────────────┐
              │  expenses          │
              │  (auto-launch)     │
              └────────────────────┘
```

### Fluxo de Dados

1. **Movimentação** → Atualiza `products.current_stock` via trigger
2. **Compra Aprovada** → Cria `purchase` + gera `expense` + registra `stock_movement`
3. **Venda/Serviço** → Dispara saída automática no `stock_movements`
4. **Alerta** → Monitora estoques críticos + notifica via Telegram

---

## 🚀 Roadmap Geral

7

### Semana 1-2: Fundação (Movimentações)

- ✅ Schema + Triggers
- ✅ Repository + Service
- ✅ Hooks + Componentes
- 📊 Cobertura: 85%+ testes

### Semana 3-4: Fornecedores + Compras (Fase 1)

- ✅ Tabelas fornecedores
- ✅ Fluxo de solicitação e cotação
- 📧 Integração Telegram (aprovação)

### Semana 5-6: Compras (Fase 2) + Integração

- ✅ Pagamento + Recebimento
- ✅ Supabase Storage (anexos)
- ✅ Integração com vendas/serviços

### Semana 7-8: Relatórios + Alertas

- ✅ Views SQL + Dashboards
- ✅ Alertas inteligentes + Cron jobs
- 📧 Notificações (Telegram + E-mail)

### Semana 9: Validação + Deploy

- ✅ Testes E2E (Playwright)
- ✅ Security review (RLS, masking)
- 🚀 Deploy staging + produção

---

## 📝 Sprints Detalhados com Tarefas

### 🏁 Sprint 1 — Fundação: Movimentações de Estoque

**Duração:** 5 dias | **Fim Esperado:** 18 de novembro
**Objetivo:** Schema completo, lógica de movimentação e interface básica
**Prioridade:** 🔴 CRÍTICA

#### 1.1 Database Setup

- [ ] **Criar tabela `product_categories`**
  - [ ] Campo: `id` (UUID)
  - [ ] Campo: `name` (string)
  - [ ] Campo: `description` (text, nullable)
  - [ ] Campo: `is_active` (boolean, default true)
  - [ ] Índices: name, is_active
  - [ ] RLS: Leitura por unit_id

- [ ] **Estender tabela `products`**
  - [ ] Adicionar: `category_id` (FK → product_categories)
  - [ ] Adicionar: `min_stock` (int, default 5)
  - [ ] Adicionar: `max_stock` (int, default 100)
  - [ ] Adicionar: `unit_measurement` (enum: UN, KG, L, etc)
  - [ ] Adicionar: `is_active` (boolean, default true)
  - [ ] Criar índices: category_id, is_active

- [ ] **Criar tabela `stock_movements`**

  ```sql
  CREATE TABLE stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id),
    product_id UUID NOT NULL REFERENCES products(id),
    movement_type ENUM ('ENTRADA', 'SAIDA') NOT NULL,
    reason ENUM ('COMPRA', 'VENDA', 'AJUSTE', 'CONSUMO_INTERNO', 'LIMPEZA', 'DEVOLUCAO') NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    reference_id UUID,
    reference_type ENUM ('PURCHASE', 'REVENUE', 'SERVICE'),
    performed_by UUID NOT NULL REFERENCES professionals(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
  );
  ```

  - [ ] Índices: unit_id, product_id, movement_type, reason, created_at, reference_id
  - [ ] RLS: Leitura/Escrita por unit_id do profissional

- [ ] **Criar função `fn_update_product_stock()`**
  - [ ] Atualizar `current_stock` ao inserir movimento
  - [ ] Reverter ao deletar movimento
  - [ ] Validar estoque não negativo
  - [ ] Registrar histórico

- [ ] **Criar view `vw_stock_summary`**
  ```sql
  SELECT
    p.id, p.name, p.current_stock, p.min_stock, p.max_stock,
    COUNT(DISTINCT sm.id) as total_movements_today,
    SUM(CASE WHEN sm.movement_type = 'ENTRADA' THEN sm.quantity ELSE 0 END) as entries_today,
    SUM(CASE WHEN sm.movement_type = 'SAIDA' THEN sm.quantity ELSE 0 END) as exits_today,
    p.unit_cost * p.current_stock as stock_value
  FROM products p
  LEFT JOIN stock_movements sm ON p.id = sm.product_id AND sm.created_at::DATE = CURRENT_DATE
  GROUP BY p.id
  ```

#### 1.2 Backend (Node.js)

- [ ] **Criar `stockMovementRepository.js`**
  - [ ] `create(movementData)` → { data, error }
  - [ ] `findByProductAndDate(productId, startDate, endDate)` → array
  - [ ] `findByUnit(unitId, filters)` → paginated
  - [ ] `delete(id)` → { data, error }
  - [ ] `revert(id)` → desfaz movimento

- [ ] **Criar DTOs**
  - [ ] `CreateStockMovementDTO` com validações
    - [ ] quantity > 0
    - [ ] movement_type válido
    - [ ] reason obrigatório
    - [ ] unit_id válido
  - [ ] `UpdateStockMovementDTO` (apenas notes)

- [ ] **Criar `stockMovementService.js`**
  - [ ] `recordEntry(productId, quantity, reason, unitCost, unit, performedBy)`
  - [ ] `recordExit(productId, quantity, reason, performedBy)`
  - [ ] `adjustStock(productId, quantity, reason, performedBy)`
  - [ ] `getStockHistory(filters)` com paginação
  - [ ] Validações de permissão (barbeiro, gerente, admin)
  - [ ] Auditoria automática via `audit_log`

- [ ] **Testes Unitários (Vitest)**
  - [ ] Repository: 10 testes (CRUD, filtros, paginação)
  - [ ] Service: 12 testes (validações, permissões, casos extremos)
  - [ ] DTO: 8 testes (validação de dados)
  - [ ] Coverage: ≥ 85% linhas

#### 1.3 Frontend (React)

- [ ] **Criar hook `useStockMovements.ts`**

  ```typescript
  const { data, isLoading, error, refetch, hasMore, loadMore } =
    useStockMovements({
      unitId,
      productId,
      filters,
      page: 1,
      pageSize: 20,
    });
  ```

  - [ ] Cache TanStack Query
  - [ ] Paginação automática
  - [ ] Refetch em background (30s)

- [ ] **Criar componentes**
  - [ ] `StockMovementTable.jsx` — Lista com filtros
    - [ ] Colunas: Produto, Quantidade, Tipo, Motivo, Responsável, Data
    - [ ] Filtros: Produto, Motivo, Período, Profissional
    - [ ] Ações: Visualizar detalhes, Editar notas, Reverter
    - [ ] Paginação infinita (scroll)

  - [ ] `StockMovementModal.jsx` — Criar/Editar
    - [ ] Form com validação
    - [ ] Autocomplete de produtos
    - [ ] Seletor de motivo (radio buttons)
    - [ ] Preview do impacto no estoque

  - [ ] `StockSummaryCard.jsx` — KPI do dia
    - [ ] Total entradas
    - [ ] Total saídas
    - [ ] Saldo
    - [ ] Produtos críticos (< min_stock)

- [ ] **Criar página `StockMovementsPage.jsx`**
  - [ ] Header com filtros avançados
  - [ ] Abas: Hoje, Últimos 7 dias, Período customizado
  - [ ] Integração com components
  - [ ] Export CSV (últimos 30 dias)

- [ ] **Design System Compliance**
  - [ ] Usar classes `.card-theme`, `.text-theme-*`, `.btn-theme-*`
  - [ ] Dark mode 100% funcional
  - [ ] Responsive (mobile first)

#### 1.4 Validação & QA

- [ ] **Testes E2E (Playwright)**
  - [ ] Fluxo: Criar movimento entrada → Visualizar → Verificar estoque atualizado
  - [ ] Fluxo: Tentar saída com estoque insuficiente (erro)
  - [ ] Fluxo: Reverter movimento → Confirmar estoque recalculado
  - [ ] Fluxo: Filtrar por período → Validar resultados

- [ ] **Testes de Performance**
  - [ ] Query de 1000 movimentos: < 500ms
  - [ ] Render de tabela com 100 items: < 2s
  - [ ] Atualização de estoque via trigger: < 100ms

- [ ] **Verificação**
  - [ ] Build passa: `npm run build`
  - [ ] Lint OK: `npm run lint`
  - [ ] Testes passam: `npm run test:all`
  - [ ] Cobertura ≥ 85%: `npm run test:coverage`

#### 1.5 Documentação

- [ ] Atualizar `docs/04_MODULES/ESTOQUE.md` — Movimentações
- [ ] Diagrama ER no README
- [ ] Exemplos de API (curl/Postman)
- [ ] Guia de troubleshooting

---

### 🏁 Sprint 2 — Fornecedores (Part I)

**Duração:** 4 dias | **Fim Esperado:** 22 de novembro
**Objetivo:** CRUD de fornecedores + integração com compras
**Prioridade:** 🔴 CRÍTICA

#### 2.1 Database Setup

- [ ] **Criar tabela `suppliers`**

  ```sql
  CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id),
    name VARCHAR(255) NOT NULL,
    cnpj_cpf VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    address TEXT,
    status ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO') DEFAULT 'ATIVO',
    payment_terms VARCHAR(255), -- Ex: "30 dias", "15/30/60"
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```

  - [ ] Índices: unit_id, cnpj_cpf, status
  - [ ] Unique: cnpj_cpf por unit_id
  - [ ] RLS: Leitura/Escrita por unit_id

- [ ] **Criar tabela `supplier_contacts`**
  - [ ] Campos: id, supplier_id, contact_name, phone, email, role
  - [ ] Permite múltiplos contatos por fornecedor

- [ ] **Criar tabela `supplier_files`**
  - [ ] Campos: id, supplier_id, file_name, file_path (Supabase), type, uploaded_by, uploaded_at
  - [ ] Suporte: Contratos, certificados, CNAEs, documentos

#### 2.2 Backend

- [ ] **Criar `supplierRepository.js`**
  - [ ] CRUD completo (create, read, update, delete/soft-delete)
  - [ ] `findByUnit(unitId)` com status filter
  - [ ] `findByCNPJ(cnpj)`
  - [ ] `getPurchaseHistory(supplierId)` — últimas 10 compras

- [ ] **Criar DTOs**
  - [ ] `CreateSupplierDTO` — validações CNPJ/CPF, email
  - [ ] `UpdateSupplierDTO`

- [ ] **Criar `supplierService.js`**
  - [ ] Validação CNPJ/CPF via função utilitária
  - [ ] Detecção de duplicidade
  - [ ] Status workflow (ATIVO → INATIVO → BLOQUEADO)
  - [ ] Integração com audit_log

- [ ] **Testes Unitários**
  - [ ] Repository: 8 testes
  - [ ] Service: 10 testes (validações, duplicidade)
  - [ ] DTO: 6 testes

#### 2.3 Frontend

- [ ] **Criar hook `useSuppliers.ts`**
  - [ ] Lista com filtros (status, busca por nome/CNPJ)
  - [ ] Refetch automático

- [ ] **Criar componentes**
  - [ ] `SuppliersTable.jsx` — Lista com CNPJ mascarado
  - [ ] `SupplierModal.jsx` — Criar/Editar
  - [ ] `SupplierDetailsView.jsx` — Detalhes + histórico compras
  - [ ] `SupplierContactsList.jsx` — Gerenciar contatos

- [ ] **Criar página `SuppliersPage.jsx`**
  - [ ] Listagem com paginação
  - [ ] Busca por nome, CNPJ
  - [ ] Filtro por status
  - [ ] Ações: Editar, Ver detalhes, Arquivar

#### 2.4 QA & Deploy

- [ ] Testes E2E: Criar, editar, arquivar fornecedor
- [ ] Validação Build: ✅
- [ ] Cobertura ≥ 85%: ✅
- [ ] Commit & Push: ✅

---

### 🏁 Sprint 3 — Compras (Solicitação + Cotação)

**Duração:** 5 dias | **Fim Esperado:** 27 de novembro
**Objetivo:** Fluxo de solicitação de compra e cotação com aprovação
**Prioridade:** 🔴 CRÍTICA

#### 3.1 Database Setup

- [ ] **Criar tabela `purchase_requests`**

  ```sql
  CREATE TABLE purchase_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id),
    requested_by UUID NOT NULL REFERENCES professionals(id),
    status ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'DRAFT',
    total_estimated DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```

- [ ] **Criar tabela `purchase_request_items`**
  - [ ] Campos: id, request_id, product_id, quantity, unit_measurement, notes

- [ ] **Criar tabela `purchase_quotes`**

  ```sql
  CREATE TABLE purchase_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    unit_cost DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    delivery_days INT,
    payment_terms VARCHAR(255),
    notes TEXT,
    is_selected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

- [ ] **Criar view `vw_pending_approvals`**
  - [ ] Mostrar solicitações com status SUBMITTED aguardando aprovação

#### 3.2 Backend

- [ ] **Criar `purchaseRequestService.js`**
  - [ ] `createRequest(items, unitId, requestedBy)`
  - [ ] `submitForApproval(requestId)`
  - [ ] `approve(requestId, approvedBy)` → gera Purchase order
  - [ ] `reject(requestId, reason, rejectedBy)`
  - [ ] Notificação Telegram ao submeter (com botões: Aprovar/Rejeitar)

- [ ] **Criar `purchaseQuoteService.js`**
  - [ ] `recordQuote(requestId, supplierId, items, terms)`
  - [ ] `selectQuote(quoteId)` → marca como selecionada
  - [ ] `compareQuotes(requestId)` → retorna análise de preços

- [ ] **Integração Telegram**
  - [ ] Enviar notificação com tabela de cotações
  - [ ] Botões inline para aprovar/rejeitar
  - [ ] Callback handling para decisões

- [ ] **Testes: 15+ unitários**

#### 3.3 Frontend

- [ ] **Criar página `PurchaseRequestsPage.jsx`**
  - [ ] Tabs: Drafts, Enviados, Aprovados, Rejeitados
  - [ ] Listagem com status visual
  - [ ] Ações: Editar (se draft), Enviar, Ver detalhes

- [ ] **Criar `PurchaseRequestModal.jsx`**
  - [ ] Form para criar solicitação
  - [ ] Adicionar items (produto, quantidade)
  - [ ] Salvação como draft + envio para aprovação

- [ ] **Criar `PurchaseQuotesView.jsx`**
  - [ ] Tabela comparativa de cotações
  - [ ] Highlight melhor preço
  - [ ] Ação: Selecionar cotação

- [ ] **Integração com Telegram**
  - [ ] Webhook para processar aprovações
  - [ ] Feedback visual ao usuário

#### 3.4 QA

- [ ] E2E: Criar solicitação → Submeter → Receber no Telegram → Aprovar
- [ ] Build, Lint, Tests: ✅
- [ ] Cobertura ≥ 85%: ✅

---

### 🏁 Sprint 4 — Compras (Recebimento + Pagamento)

**Duração:** 5 dias | **Fim Esperado:** 2 de dezembro
**Objetivo:** Fluxo completo de compra, recebimento, pagamento e integração com estoque
**Prioridade:** 🔴 CRÍTICA

#### 4.1 Database

- [ ] **Criar tabela `purchases`** (gerada da quote aprovada)
  - [ ] Campos: id, quote_id, unit_id, supplier_id, order_number, status, total_amount, receiving_date, receiving_by, created_at
  - [ ] Status: APPROVED, IN_DELIVERY, RECEIVED, PARTIALLY_RECEIVED, CANCELLED

- [ ] **Criar tabela `purchase_items`**
  - [ ] Campos: purchase_id, product_id, quantity_requested, quantity_received, unit_cost, total_cost

- [ ] **Criar tabela `purchase_payments`**

  ```sql
  CREATE TABLE purchase_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES purchases(id),
    payment_method ENUM ('DINHEIRO', 'PIX', 'BOLETO', 'CARTAO_CREDITO', 'TRANSFERENCIA'),
    installments INT DEFAULT 1,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO') DEFAULT 'PENDENTE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

- [ ] **Criar tabela `purchase_attachments`**
  - [ ] Campos: id, purchase_id, file_name, file_path (Storage), type, uploaded_by, uploaded_at

#### 4.2 Backend

- [ ] **Criar `purchaseService.js`**
  - [ ] `createFromQuote(quoteId)`
  - [ ] `recordReceiving(purchaseId, itemsReceived, receivedBy)` → atualiza items
  - [ ] `completeReceiving(purchaseId)` → Gera stock_movement + expense
  - [ ] `recordPayment(purchaseId, paymentData)`
  - [ ] Atualizar expense automaticamente ao confirmar recebimento

- [ ] **Criar `purchasePaymentService.js`**
  - [ ] Calcular vencimentos para parcelados
  - [ ] Gerar lembretes de vencimento via cron job

- [ ] **Supabase Storage Setup**
  - [ ] Bucket `purchases` com RLS
  - [ ] Upload via `uploadAttachment(purchaseId, file)`

- [ ] **Testes: 20+**

#### 4.3 Frontend

- [ ] **Criar página `PurchaseDetailsPage.jsx`**
  - [ ] Exibir ordem aprovada
  - [ ] Seção: Recebimento (form com scan ou digitação de qtds)
  - [ ] Seção: Pagamento (parcelamento visual)
  - [ ] Upload de anexos (nota fiscal, comprovante)

- [ ] **Criar `PurchaseReceivingModal.jsx`**
  - [ ] Tabela com quantidade solicitada vs recebida
  - [ ] Aceitar parcial
  - [ ] Registrar responsável (data + profissional)

- [ ] **Criar `PaymentScheduleView.jsx`**
  - [ ] Timeline de vencimentos
  - [ ] Status de cada parcela
  - [ ] Opção de registrar pagamento

- [ ] **Integração Supabase Storage**
  - [ ] Drag-drop de arquivos
  - [ ] Preview de documentos

#### 4.4 QA

- [ ] E2E: Recebimento completo → Estoque atualizado → Despesa criada
- [ ] E2E: Parcelamento → Lembretes de vencimento disparam
- [ ] Build, Tests, Coverage: ✅

---

### 🏁 Sprint 5 — Integração Vendas + Serviços + Alertas Básicos

**Duração:** 4 dias | **Fim Esperado:** 6 de dezembro
**Objetivo:** Consumo automático de estoque + alertas de baixo estoque
**Prioridade:** 🟠 ALTA

#### 5.1 Database

- [ ] **Criar tabela `service_consumables`**
  - [ ] Campos: service_id, product_id, quantity_consumed, unit_measurement
  - [ ] Uso: Definir consumo automático por serviço (ex: Corte consome 1 Shampoo + 1 Tônico)

- [ ] **Criar tabela `stock_alerts`**
  ```sql
  CREATE TABLE stock_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id),
    product_id UUID NOT NULL REFERENCES products(id),
    alert_type ENUM ('MINIMO', 'ZERADO', 'ALTA_SAIDA', 'COMPRA_PENDENTE', 'PAGAMENTO_VENCENDO'),
    severity ENUM ('INFO', 'WARNING', 'CRITICAL') DEFAULT 'INFO',
    message TEXT,
    status ENUM ('NEW', 'ACKNOWLEDGED', 'RESOLVED') DEFAULT 'NEW',
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES professionals(id)
  );
  ```

#### 5.2 Backend

- [ ] **Atualizar `revenueService.js`**
  - [ ] Ao criar revenue com `product_id`, consumir estoque automaticamente
  - [ ] `consumeProductForRevenue(productId, quantity, unit)`
  - [ ] Validar estoque suficiente antes (erro se < 0)
  - [ ] Registrar movimento automático (reason: 'VENDA')

- [ ] **Criar `serviceConsumablesService.js`**
  - [ ] `consumeByService(serviceId, barber)` → Registra saídas automáticas
  - [ ] Executado ao finalizar comanda

- [ ] **Criar `stockAlertService.js`**
  - [ ] `checkMinimumStock()` — Job diário
  - [ ] `detectHighExit()` — Variação > 30% em 7 dias
  - [ ] `getOpenAlerts(unitId, severity)` — Para dashboard
  - [ ] `acknowledgeAlert(alertId, acknowledgedBy)`
  - [ ] Enviar notificações Telegram

- [ ] **Criar pg_cron job**
  - [ ] Executar `stockAlertService.checkMinimumStock()` às 06:00
  - [ ] Executar `stockAlertService.detectHighExit()` diariamente

- [ ] **Testes: 18+**

#### 5.3 Frontend

- [ ] **Criar página `StockAlertsPage.jsx`**
  - [ ] Listagem de alertas com filtros (tipo, severidade, status)
  - [ ] Timeline: NEW → ACKNOWLEDGED → RESOLVED
  - [ ] Ação: Reconhecer alerta, Marcar como resolvido
  - [ ] Cards de alerta crítico no dashboard

- [ ] **Widget `AlertsBadge.jsx` (Navbar)**
  - [ ] Contador de alertas não lidos
  - [ ] Click → Ir para página de alertas

#### 5.4 QA

- [ ] E2E: Criar venda → Estoque reduzido automaticamente
- [ ] E2E: Estoque abaixo do mínimo → Alerta criado → Telegram enviado
- [ ] Build, Tests, Coverage: ✅

---

### 🏁 Sprint 6 — Relatórios Gerenciais

**Duração:** 4 dias | **Fim Esperado:** 10 de dezembro
**Objetivo:** Dashboards de consumo, giro, perdas
**Prioridade:** 🟠 ALTA

#### 6.1 Database

- [ ] **Criar views analíticas**
  - [ ] `vw_stock_consumption_barber` — Consumo por profissional
  - [ ] `vw_stock_consumption_category` — Por categoria
  - [ ] `vw_stock_value` — Valor total em estoque
  - [ ] `vw_stock_turnover` — Índice de giro
  - [ ] `vw_purchases_monthly` — Gastos mensais por fornecedor

#### 6.2 Backend

- [ ] **Criar `inventoryReportsService.js`**
  - [ ] `getConsumptionByBarber(unitId, period)` → JSON
  - [ ] `getConsumptionByCategory(unitId, period)` → JSON
  - [ ] `getStockValue(unitId)` → Valor total
  - [ ] `getTopConsumers(unitId, limit)` → Top 10 produtos
  - [ ] `exportToCSV()` — Relatório completo
  - [ ] `exportToPDF()` — Usando reportlab ou similar

- [ ] **Testes: 10+**

#### 6.3 Frontend

- [ ] **Criar página `InventoryReportsPage.jsx`**
  - [ ] Filtros: Período, Unidade, Categoria
  - [ ] Cards KPI: Total consumido, Total giro, Valor em estoque
  - [ ] Gráficos (Recharts):
    - [ ] Consumo diário (linha)
    - [ ] Top 10 produtos (barra)
    - [ ] Consumo por categoria (pizza)
    - [ ] Consumo por barbeiro (barra horizontal)

  - [ ] Tabelas:
    - [ ] Produtos críticos
    - [ ] Maiores gastos mensais
    - [ ] Histórico de ajustes

- [ ] **Ações de Export**
  - [ ] Botão: Download CSV
  - [ ] Botão: Download PDF

- [ ] **Design System Compliant**

#### 6.4 QA

- [ ] E2E: Acessar relatório → Filtrar período → Export CSV funciona
- [ ] Performance: Relatório com 1 ano de dados < 2s
- [ ] Build, Tests: ✅

---

### 🏁 Sprint 7 — Alertas Inteligentes + Notificações

**Duração:** 3 dias | **Fim Esperado:** 13 de dezembro
**Objetivo:** Sistema completo de alertas com notificações multi-canal
**Prioridade:** 🟠 ALTA

#### 7.1 Database

- [ ] **Expandir `stock_alerts`** com webhooks
  - [ ] Adicionar: `notified_at`, `notification_channels` (array: telegram, email)

#### 7.2 Backend

- [ ] **Expandir `stockAlertService.js`**
  - [ ] `notifyTelegram(alert)` — Via bot
  - [ ] `notifyEmail(alert)` — Via Supabase Mail
  - [ ] Integração com cron jobs:
    - [ ] MINIMO: Quando `current_stock < min_stock`
    - [ ] ZERADO: Quando `current_stock = 0`
    - [ ] ALTA_SAIDA: Saída > 30% em 7 dias
    - [ ] COMPRA_PENDENTE: Solicitação aberta > 24h
    - [ ] PAGAMENTO_VENCENDO: Vence em 3 dias

- [ ] **Criar `alertNotificationService.js`**
  - [ ] Template de mensagens (Telegram + Email)
  - [ ] Retry logic para falhas

- [ ] **Testes: 12+**

#### 7.3 Frontend

- [ ] **Aprimorar `StockAlertsPage.jsx`**
  - [ ] Kanban board: NEW | ACKNOWLEDGED | RESOLVED
  - [ ] Drag-drop entre colunas
  - [ ] Filtros avançados
  - [ ] Exportar alertas resolvidos (relatório)

#### 7.4 QA

- [ ] E2E: Estoque atinge mínimo → Alerta criado → Telegram enviado → Email enviado
- [ ] Build, Tests: ✅

---

### 🏁 Sprint 8 — Validação Final + Security + Deploy

**Duração:** 5 dias | **Fim Esperado:** 18 de dezembro
**Objetivo:** Testes completos, segurança, documentação e deploy
**Prioridade:** 🔴 CRÍTICA

#### 8.1 Security & Compliance

- [ ] **RLS Policies Review**
  - [ ] Verificar todas as tabelas novas têm RLS ativada
  - [ ] Testar: Um barbeiro não vê dados de outro unit_id
  - [ ] Testar: Admin consegue acessar dados cross-unit (se necessário)

- [ ] **Dados Sensíveis**
  - [ ] Implementar masking em logs: CNPJ/CPF, valores de pagamento
  - [ ] Audit log com versioning de mudanças

- [ ] **Testes de Permissão**
  - [ ] Barbeiro: Pode registrar movimentação? ✅
  - [ ] Barbeiro: Pode criar compra? ❌
  - [ ] Gerente: Pode aprovar compra? ✅
  - [ ] Admin: Pode tudo? ✅

#### 8.2 Testes E2E Completos (Playwright)

- [ ] **Fluxo 1: Compra Completa**
  - [ ] Gerente cria solicitação
  - [ ] Adiciona 3 itens
  - [ ] Submete para aprovação
  - [ ] Admin aprova (Telegram)
  - [ ] Fornecedor entrega
  - [ ] Recebimento registrado
  - [ ] Estoque atualizado ✅
  - [ ] Despesa criada ✅
  - [ ] Pagamento agendado ✅

- [ ] **Fluxo 2: Venda com Consumo**
  - [ ] Cliente compra produto de revenda
  - [ ] Estoque reduzido automaticamente ✅
  - [ ] Movimento registrado ✅
  - [ ] Se estoque < mínimo → Alerta criado ✅

- [ ] **Fluxo 3: Serviço com Consumo**
  - [ ] Barbeiro realiza corte (configurable consumables)
  - [ ] Ao finalizar → Shampoo e tônico consumidos ✅
  - [ ] Movimentos registrados ✅

- [ ] **Fluxo 4: Alertas End-to-End**
  - [ ] Estoque atinge crítico
  - [ ] Alerta criado na DB
  - [ ] Telegram enviado ✅
  - [ ] Email enviado ✅
  - [ ] Dashboard reflete alerta ✅

#### 8.3 Performance Testing

- [ ] **Testes de Carga (k6)**
  - [ ] Registrar 100 movimentos/min → Tempo resposta < 500ms
  - [ ] Gerar relatório com 1 ano de dados → < 2s
  - [ ] Carregar tabela de 10k itens → < 3s

#### 8.4 Documentação

- [ ] **Criar `docs/04_MODULES/ESTOQUE.md`**
  - [ ] Visão geral do módulo
  - [ ] Arquitetura (diagrama ER)
  - [ ] Fluxos principais (diagramas swimlane)
  - [ ] API Reference (endpoints)
  - [ ] Exemplos de uso (curl/JS)

- [ ] **Atualizar `docs/08_TESTING_STRATEGY.md`**
  - [ ] Adicionar cenários de teste estoque
  - [ ] Coverage goals ≥ 85%

- [ ] **README.md**
  - [ ] Instruções para rodar módulo localmente
  - [ ] Troubleshooting

- [ ] **Changelog**
  - [ ] Adicionar entrada para v2.1.0 (módulo estoque)

#### 8.5 Deploy

- [ ] **Staging**
  - [ ] Rodar migrations
  - [ ] Popular dados de teste
  - [ ] Validar tudo funciona
  - [ ] Testar cron jobs

- [ ] **Production**
  - [ ] Backup DB
  - [ ] Executar migrations
  - [ ] Deploy código
  - [ ] Smoke tests
  - [ ] Monitorar 24h

- [ ] **Rollback Plan**
  - [ ] Scripts reverter DDL
  - [ ] Restaurar dados se necessário

#### 8.6 Validação Final

- [ ] **Checklist de Go-Live**
  - [ ] [ ] Todos os testes passam (154+ testes)
  - [ ] [ ] Coverage ≥ 85%
  - [ ] [ ] Build sem erros: `npm run build`
  - [ ] [ ] Lint OK: `npm run lint`
  - [ ] [ ] E2E todos os fluxos: ✅
  - [ ] [ ] RLS policies verificadas: ✅
  - [ ] [ ] Documentação completa: ✅
  - [ ] [ ] Deploy staging validado: ✅
  - [ ] [ ] Monitoramento alertas configurado: ✅
  - [ ] [ ] Aprovação do PO: ✅

---

## 📅 Timeline Geral

| Sprint                      | Período         |        Dias | Status       |
| :-------------------------- | :-------------- | ----------: | :----------- |
| **Sprint 1: Movimentações** | 13-18 nov       |           5 | 🟡 Planejado |
| **Sprint 2: Fornecedores**  | 19-22 nov       |           4 | 🟡 Planejado |
| **Sprint 3: Compras (P1)**  | 23-27 nov       |           5 | 🟡 Planejado |
| **Sprint 4: Compras (P2)**  | 28 nov - 2 dez  |           5 | 🟡 Planejado |
| **Sprint 5: Integração**    | 3-6 dez         |           4 | 🟡 Planejado |
| **Sprint 6: Relatórios**    | 7-10 dez        |           4 | 🟡 Planejado |
| **Sprint 7: Alertas**       | 11-13 dez       |           3 | 🟡 Planejado |
| **Sprint 8: Deploy**        | 14-18 dez       |           5 | 🟡 Planejado |
| **TOTAL**                   | 13 nov - 18 dez | **35 dias** | 🟡           |

---

## ✅ Critérios de Aceite Globais

### Funcionalidades

- [x] Movimentações registram e atualizam estoque em tempo real
- [x] Toda compra aprovada gera expense + movimentação entrada
- [x] Consumo por serviço/venda baixa estoque automaticamente
- [x] Alertas disparam corretamente (Telegram + Email)
- [x] Relatórios sem consultas manual (100% automático)
- [x] Multi-tenant funcionando (Mangabeiras ≠ Nova Lima)

### Qualidade

- [x] Testes unitários: ≥ 85% coverage
- [x] Testes integração: ≥ 80% coverage
- [x] Testes E2E: Fluxos críticos 100%
- [x] Build sem erros
- [x] Lint 0 problemas
- [x] Sem warnings no console (prod)

### Segurança

- [x] RLS policies em todas as tabelas novas
- [x] Sem acesso cross-unit
- [x] Dados sensíveis mascarados em logs
- [x] Auditoria completa (quem, quando, o quê)

### Performance

- [x] Queries < 500ms (p95)
- [x] Render UI < 2s
- [x] Trigger updates < 100ms
- [x] Relatório 1 ano < 2s

### Documentação

- [x] API Reference completo
- [x] Diagramas (ER, swimlane)
- [x] Guia troubleshooting
- [x] Exemplos de uso

---

## 🔗 Dependências Críticas

### Internas

- ✅ `expenseService` — Lançar despesas automáticas
- ✅ `revenueService` — Consumir estoque em vendas
- ✅ `telegramService` — Enviar notificações
- ✅ `authService` — Verificar permissões
- ✅ `auditLogService` — Registrar mudanças

### Externas

- ✅ PostgreSQL + pg_cron — Agendamentos
- ✅ Supabase Storage — Anexos de compras
- ✅ Telegram Bot API — Notificações
- ✅ Sendgrid/Resend — Emails

---

## 📊 Matriz de Responsabilidades

| Tarefa            | Backend | Frontend | QA  | DevOps |
| :---------------- | :-----: | :------: | :-: | :----: |
| Schema DDL        |   ✅    |          | ⚠️  |   ✅   |
| Repository        |   ✅    |          | ⚠️  |        |
| Service           |   ✅    |          | ⚠️  |        |
| DTO Validation    |   ✅    |          | ⚠️  |        |
| API Endpoints     |   ✅    |          | ⚠️  |        |
| Unit Tests        |   ✅    |    ✅    | ⚠️  |        |
| Integration Tests |   ✅    |          | ⚠️  |        |
| React Components  |         |    ✅    | ⚠️  |        |
| Hooks             |         |    ✅    | ⚠️  |        |
| Pages             |         |    ✅    | ⚠️  |        |
| E2E Tests         |         |          | ✅  |        |
| Performance Tests |         |          | ✅  |   ⚠️   |
| Deployment        |         |          |     |   ✅   |
| Monitoring        |         |          |     |   ✅   |

---

## 🎯 KPIs de Sucesso

| Métrica              |        Meta |       Atual | Status |
| :------------------- | ----------: | ----------: | :----: |
| **Coverage**         |       ≥ 85% |   Planejado |   🟡   |
| **Build Time**       |       < 30s |     Validar |   🟡   |
| **Test Execution**   |        < 2m |     Validar |   🟡   |
| **API Response**     | < 500ms p95 |     Validar |   🟡   |
| **E2E Pass Rate**    |        100% |   Planejado |   🟡   |
| **On-Time Delivery** |     35 dias | Cumprimento |   🟡   |

---

## 🚨 Riscos + Mitigações

| Risco                             | Impacto  | Probabilidade | Mitigação                       |
| :-------------------------------- | :------: | :-----------: | :------------------------------ |
| Trigger performance (alta volume) | 🔴 Alto  |   🟡 Média    | Índices + testes load           |
| Integração Telegram instável      | 🟠 Médio |   🟡 Média    | Retry logic + fallback email    |
| Dados duplicados em estoque       | 🔴 Alto  |   🟢 Baixa    | Unique constraints + transações |
| RLS bug permite cross-unit        | 🔴 Alto  |   🟢 Baixa    | Testes RLS extensivos           |
| Deploy quebra produção            | 🔴 Alto  |   🟢 Baixa    | Staging completo + rollback     |

---

## 📞 Contato & Escalação

- **PO:** Andrey Viana
- **Tech Lead:** Andrey Viana
- **DevOps:** Andrey Viana
- **Escalação Crítica:** @Andrey (Telegram)
