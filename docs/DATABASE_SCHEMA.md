# 🗄️ Database Schema — Barber Analytics Pro

> **Resumo das estruturas do PostgreSQL (Supabase) utilizadas pelo projeto, incluindo extensões, enums, tabelas, views e funções.**
>
> **Atualizado em:** 2025-10-22  
> **Autor:** Codex (IA)

---

## 🎯 Visão Geral

- 🗃️ Banco: PostgreSQL 17 (Supabase)
- 🧩 Multi-tenant: `unit_id` presente na maioria das tabelas de negócio.
- 🕳️ Soft delete: uso recorrente de `is_active`.
- 🔐 Segurança: Row-Level Security (RLS) habilitada para dados sensíveis.

---

## 🧰 Extensões Ativas

- `plpgsql` • `pg_stat_statements` • `uuid-ossp` • `pgcrypto`
- `supabase_vault` • `pg_graphql`

Essas extensões oferecem suporte a UUIDs, criptografia, telemetria e integrações GraphQL/Vault.

---

## 🗂️ Schemas

- `public` — domínio principal (tabelas do produto)
- `graphql`, `graphql_public` — camadas para GraphQL
- `vault` — armazenamento de segredos (Supabase Vault)
- `realtime` — pub/sub do Supabase
- `supabase_migrations`, `extensions` — infraestrutura

---

## 🔤 Enums Relevantes

- `bank_transaction_type` (`Credit`, `Debit`)
- `expense_type` (`rent`, `salary`, `supplies`, `utilities`, `other`)
- `goal_period` (`monthly`, `quarterly`, `yearly`)
- `goal_type` (`revenue_general`, `subscription`, `product_sales`, `expenses`, `profit`)
- `income_type` (`service`, `product`, `commission`, `other`)
- `party_type` (`Cliente`, `Fornecedor`)
- `transaction_status` (`Pending`, `Partial`, `Received`, `Paid`, `Cancelled`, `Overdue`)
- `payment_status`, `subscription_*` (ciclos e estados de assinaturas)

---

## 📋 Tabelas-Chave (resumo)

| Tabela                          | Propósito                    | Colunas de destaque                                                                                                                                 |
| ------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `units`                         | Unidades/lojas (tenant)      | `id`, `name`, `status`, `is_active`, `created_at`, `updated_at`                                                                                     |
| `revenues`                      | Receitas financeiras         | `type`, `value`, `date`, `unit_id`, `account_id`, `category_id`, `payment_method_id`, `status`, `gross_amount`, `net_amount`, `fees`, `source_hash` |
| `expenses`                      | Despesas                     | `type`, `value`, `date`, `unit_id`, `category_id`, `party_id`, `status`, `expected_payment_date`, `actual_payment_date`                             |
| `bank_accounts`                 | Contas bancárias             | `unit_id`, `name`, `bank_name`, `agency`, `account_number`, `initial_balance`, `is_active`                                                          |
| `bank_statements`               | Extratos importados          | `bank_account_id`, `transaction_date`, `description`, `amount`, `type`, `hash_unique`, `reconciled`, `status`                                       |
| `parties`                       | Clientes/fornecedores        | `unit_id`, `name`, `party_type`, `cpf_cnpj`, `email`, `is_active`                                                                                   |
| `professionals`                 | Profissionais/barbeiros      | `unit_id`, `name`, `role`, `points`, `is_active`                                                                                                    |
| `barbers_turn_list`             | Fila atual da Lista da Vez   | `unit_id`, `professional_id`, `points`, `position`, `last_updated`                                                                                  |
| `barbers_turn_history`          | Histórico mensal da fila     | `unit_id`, `professional_id`, `month`, `year`, `total_points`, `final_position`                                                                     |
| `goals`, `goal_history`         | Metas financeiras            | `unit_id`, `goal_type`, `period`, `target_value`, `achieved_value`                                                                                  |
| `products`, `product_movements` | Estoque e movimentações      | `unit_id`, `sku`, `stock`, `movement_type`, `quantity`                                                                                              |
| `cash_registers`                | Caixas (abertura/fechamento) | `unit_id`, `opened_by`, `closed_by`, `opening_balance`, `closing_balance`, `status`, `opening_time`, `closing_time`                                 |
| `services`                      | Serviços oferecidos          | `unit_id`, `name`, `duration_minutes`, `price`, `commission_percentage`, `is_active`                                                                |
| `orders`                        | Comandas/pedidos             | `unit_id`, `client_id`, `professional_id`, `cash_register_id`, `status`, `total_amount`, `created_at`, `closed_at`                                  |
| `order_items`                   | Itens da comanda             | `order_id`, `service_id`, `professional_id`, `quantity`, `unit_price`, `commission_percentage`, `commission_value`                                  |

---

## 💼 Módulo de Caixa e Comandas (Novo)

### 📊 cash_registers - Gestão de Caixas

Tabela para controle de abertura e fechamento de caixas por unidade.

**Campos principais:**

- `id` (UUID, PK) - Identificador único
- `unit_id` (UUID, FK → units) - Unidade do caixa
- `opened_by` (UUID, FK → users) - Usuário que abriu
- `closed_by` (UUID, FK → users, nullable) - Usuário que fechou
- `opening_balance` (NUMERIC) - Saldo inicial informado
- `closing_balance` (NUMERIC, nullable) - Saldo final informado
- `status` (VARCHAR) - Status: 'open' | 'closed'
- `opening_time` (TIMESTAMP) - Data/hora de abertura
- `closing_time` (TIMESTAMP, nullable) - Data/hora de fechamento
- `observations` (TEXT, nullable) - Observações gerais

**Constraints:**

- ✅ Apenas 1 caixa aberto por unidade (validação via função SQL)
- ✅ `opening_balance >= 0`
- ✅ `closing_balance >= 0` (quando presente)

**Índices:**

- `idx_cash_registers_unit_status` - (unit_id, status) para busca de caixa ativo
- `idx_cash_registers_opening_time` - Para ordenação por data

**RLS Policies:**

- SELECT: Usuários veem caixas da sua unidade
- INSERT: Apenas Recepcionista, Gerente e Admin (via `fn_can_manage_cash_register`)
- UPDATE: Apenas Recepcionista, Gerente e Admin para fechamento
- DELETE: Não permitido

### 🛠️ services - Catálogo de Serviços

Serviços oferecidos pela barbearia com controle de comissão.

**Campos principais:**

- `id` (UUID, PK) - Identificador único
- `unit_id` (UUID, FK → units) - Unidade proprietária
- `name` (VARCHAR, 100) - Nome do serviço
- `description` (TEXT, nullable) - Descrição detalhada
- `duration_minutes` (INTEGER) - Duração estimada em minutos
- `price` (NUMERIC) - Preço do serviço
- `commission_percentage` (NUMERIC) - Percentual de comissão (0-100)
- `is_active` (BOOLEAN, default true) - Ativo/inativo (soft delete)
- `created_at`, `updated_at` (TIMESTAMP) - Auditoria

**Constraints:**

- ✅ `price > 0`
- ✅ `commission_percentage >= 0 AND <= 100`
- ✅ `duration_minutes > 0`
- ✅ Nome único por unidade (unique index)

**Índices:**

- `idx_services_unit_active` - (unit_id, is_active) para listagem
- `idx_services_name` - Para busca por nome

**RLS Policies:**

- SELECT: Todos os usuários da unidade
- INSERT/UPDATE/DELETE: Apenas Gerente e Admin (via `fn_can_manage_services`)

### 📋 orders - Comandas/Pedidos

Controle de comandas abertas e fechadas vinculadas a um caixa.

**Campos principais:**

- `id` (UUID, PK) - Identificador único
- `unit_id` (UUID, FK → units) - Unidade
- `cash_register_id` (UUID, FK → cash_registers) - Caixa vinculado
- `client_id` (UUID, FK → parties, nullable) - Cliente atendido
- `professional_id` (UUID, FK → professionals) - Profissional responsável
- `status` (VARCHAR) - Status: 'open' | 'closed' | 'canceled'
- `total_amount` (NUMERIC, default 0) - Total calculado automaticamente
- `created_at` (TIMESTAMP) - Data/hora de criação
- `closed_at` (TIMESTAMP, nullable) - Data/hora de fechamento
- `canceled_at` (TIMESTAMP, nullable) - Data/hora de cancelamento
- `cancel_reason` (TEXT, nullable) - Motivo do cancelamento
- `observations` (TEXT, nullable) - Observações gerais

**Constraints:**

- ✅ Não permitir adicionar itens se status != 'open'
- ✅ Apenas uma comanda ativa por profissional (business rule no service)
- ✅ `total_amount >= 0`

**Índices:**

- `idx_orders_unit_status` - (unit_id, status) para filtros
- `idx_orders_cash_register` - (cash_register_id) para relatórios de caixa
- `idx_orders_professional` - (professional_id, status) para comandas do barbeiro
- `idx_orders_created_at` - Para ordenação temporal

**Triggers:**

- `trg_update_order_total` - Recalcula total após INSERT/UPDATE/DELETE em order_items

**RLS Policies:**

- SELECT: Profissionais veem suas comandas, Gerente/Admin veem todas da unidade
- INSERT: Todos os usuários autenticados
- UPDATE: Quem criou ou Gerente/Admin (validação de status)
- DELETE: Não permitido (usar cancelamento)

### 🧾 order_items - Itens da Comanda

Serviços incluídos em cada comanda com cálculo de comissão.

**Campos principais:**

- `id` (UUID, PK) - Identificador único
- `order_id` (UUID, FK → orders, ON DELETE CASCADE) - Comanda pai
- `service_id` (UUID, FK → services) - Serviço prestado
- `professional_id` (UUID, FK → professionals) - Profissional que executou
- `quantity` (INTEGER, default 1) - Quantidade
- `unit_price` (NUMERIC) - Preço unitário (snapshot do service.price)
- `commission_percentage` (NUMERIC) - % de comissão (snapshot)
- `commission_value` (NUMERIC) - Valor da comissão calculado
- `created_at` (TIMESTAMP) - Auditoria

**Constraints:**

- ✅ `quantity >= 1`
- ✅ `unit_price > 0`
- ✅ `commission_percentage >= 0 AND <= 100`

**Índices:**

- `idx_order_items_order_id` - Para busca de itens por comanda
- `idx_order_items_service_id` - Para estatísticas de serviços
- `idx_order_items_professional_id` - Para relatório de comissões

**Triggers:**

- Ao INSERT/UPDATE/DELETE → dispara recálculo do total da ordem

**Cálculo Automático:**

```sql
commission_value = (unit_price * quantity * commission_percentage) / 100
```

**RLS Policies:**

- Herda permissões da ordem pai (via JOIN)

---

## 👓 Views & Materializações

- `vw_turn_list_complete` — join entre `barbers_turn_list`, `units`, `professionals`.
- `vw_turn_history_complete` — histórico enriquecido com nomes de unidade e profissional.
- `vw_cash_register_summary` — resumo de caixa com receitas, despesas e saldo esperado.
- `vw_order_details` — detalhes completos de comandas com itens, serviços e totais.
- `vw_commission_by_professional` — agrupamento de comissões por profissional e período.
- Views auxiliares para dashboards (consultar migrations para detalhes atualizados).

---

## 🧮 Funções & RPC

### 📋 Lista da Vez

- `fn_initialize_turn_list(unit_id uuid)` - Inicializa fila de profissionais
- `fn_add_point_to_barber(unit_id uuid, professional_id uuid)` - Adiciona ponto
- `fn_reorder_turn_list(unit_id uuid)` - Reordena por pontos
- `fn_monthly_reset_turn_list()` - Reset automático mensal

### 💰 Módulo Financeiro

- `fn_calculate_dre(unit_id uuid, start_date date, end_date date)` - Calcula DRE

### 💼 Módulo de Caixa e Comandas

- `fn_can_manage_cash_register(user_id uuid, unit_id uuid)` - Valida permissão para gerenciar caixa
- `fn_can_manage_services(user_id uuid)` - Valida permissão para gerenciar serviços
- `fn_get_active_cash_register(unit_id uuid)` - Retorna caixa aberto ou NULL
- `fn_calculate_order_total(order_id uuid)` - Calcula total da comanda
- `fn_calculate_commission(unit_price numeric, commission_percentage numeric)` - Calcula comissão
- `fn_close_order_and_generate_revenue(order_id uuid)` - Fecha comanda e gera receita
- `fn_close_cash_register(cash_register_id uuid, closed_by uuid, closing_balance numeric)` - Fecha caixa com validações

Essas funções são expostas como RPC via Supabase e utilizadas pelos services/hook correspondentes.

---

## 🔐 Row-Level Security (RLS Policies)

### 📊 Módulo Financeiro - Políticas Detalhadas

Todas as tabelas do módulo financeiro possuem RLS habilitado. As políticas seguem o padrão:

#### 1. **Bank Accounts**

- ✅ **SELECT**: Usuários podem visualizar contas da sua unidade
- ✅ **INSERT**: Apenas administradores
- ✅ **UPDATE**: Administradores e gerentes da unidade
- ✅ **DELETE**: Apenas administradores

#### 2. **Payment Methods**

- ✅ **SELECT**: Usuários podem visualizar métodos da sua unidade
- ✅ **INSERT**: Apenas administradores
- ✅ **UPDATE**: Administradores e gerentes da unidade
- ❌ **DELETE**: Não permitido (soft delete via `is_active`)

#### 3. **Parties (Clientes/Fornecedores)**

- ✅ **SELECT**: Usuários podem visualizar parties da sua unidade
- ✅ **INSERT**: Todos os usuários autenticados (para sua unidade)
- ✅ **UPDATE**: Usuários da mesma unidade
- ✅ **DELETE**: Apenas administradores

#### 4. **Categories**

- ✅ **SELECT**: Usuários podem visualizar categorias da sua unidade
- ✅ **INSERT**: Apenas administradores
- ✅ **UPDATE**: Administradores e gerentes da unidade
- ❌ **DELETE**: Não permitido (soft delete via `is_active`)

#### 5. **Revenues (Receitas)**

- ✅ **SELECT**: Usuários podem visualizar receitas da sua unidade
- ✅ **INSERT**: Todos os usuários autenticados (para sua unidade)
- ✅ **UPDATE**: Usuários da mesma unidade
- ✅ **DELETE**: Administradores e gerentes da unidade

#### 6. **Expenses (Despesas)**

- ✅ **SELECT**: Usuários podem visualizar despesas da sua unidade
- ✅ **INSERT**: Todos os usuários autenticados (para sua unidade)
- ✅ **UPDATE**: Usuários da mesma unidade
- ✅ **DELETE**: Administradores e gerentes da unidade

#### 7. **Bank Statements (Extratos)**

- ✅ **SELECT**: Usuários podem visualizar extratos da sua unidade
- ✅ **INSERT**: Usuários autenticados (para importação)
- ✅ **UPDATE**: Usuários da mesma unidade (para conciliação)
- ✅ **DELETE**: Apenas administradores

#### 8. **Reconciliations (Conciliações)**

- ✅ **SELECT**: Usuários podem visualizar conciliações da sua unidade
- ✅ **INSERT**: Usuários autenticados (para criar matches)
- ✅ **UPDATE**: Usuários da mesma unidade (para confirmar/rejeitar)
- ✅ **DELETE**: Administradores e gerentes da unidade

### � Módulo de Caixa e Comandas

#### 9. **Cash Registers (Caixas)**

- ✅ **SELECT**: Usuários podem visualizar caixas da sua unidade
- ✅ **INSERT**: Apenas Recepcionista, Gerente e Admin (via `fn_can_manage_cash_register`)
- ✅ **UPDATE**: Apenas Recepcionista, Gerente e Admin (para fechamento)
- ❌ **DELETE**: Não permitido

#### 10. **Services (Serviços)**

- ✅ **SELECT**: Todos os usuários da unidade (para consulta)
- ✅ **INSERT**: Apenas Gerente e Admin (via `fn_can_manage_services`)
- ✅ **UPDATE**: Apenas Gerente e Admin
- ❌ **DELETE**: Não permitido (soft delete via `is_active`)

#### 11. **Orders (Comandas)**

- ✅ **SELECT**: Profissionais veem suas comandas, Gerente/Admin veem todas da unidade
- ✅ **INSERT**: Todos os usuários autenticados (para sua unidade)
- ✅ **UPDATE**: Quem criou a comanda ou Gerente/Admin (validação de status)
- ❌ **DELETE**: Não permitido (usar cancelamento)

#### 12. **Order Items (Itens da Comanda)**

- ✅ **SELECT**: Herda permissões da ordem pai
- ✅ **INSERT**: Usuários com permissão na ordem pai (apenas se status='open')
- ✅ **UPDATE**: Usuários com permissão na ordem pai (apenas se status='open')
- ✅ **DELETE**: Usuários com permissão na ordem pai (apenas se status='open')

### 🔑 Funções Helper de Permissão

#### `fn_can_manage_cash_register(user_id UUID, unit_id UUID)`

```sql
CREATE OR REPLACE FUNCTION fn_can_manage_cash_register(
  p_user_id UUID,
  p_unit_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role VARCHAR(50);
  v_user_unit_id UUID;
BEGIN
  -- Busca perfil e unidade do usuário
  SELECT role, unit_id INTO v_user_role, v_user_unit_id
  FROM professionals
  WHERE user_id = p_user_id AND is_active = true;

  -- Valida se pertence à unidade e tem perfil adequado
  RETURN (v_user_unit_id = p_unit_id)
    AND (v_user_role IN ('recepcionista', 'gerente', 'administrador'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `fn_can_manage_services(user_id UUID)`

```sql
CREATE OR REPLACE FUNCTION fn_can_manage_services(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role VARCHAR(50);
BEGIN
  -- Busca perfil do usuário
  SELECT role INTO v_user_role
  FROM professionals
  WHERE user_id = p_user_id AND is_active = true;

  -- Apenas Gerente e Admin podem gerenciar serviços
  RETURN v_user_role IN ('gerente', 'administrador');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### �🔑 Função Helper: `get_user_unit_ids()`

```sql
CREATE OR REPLACE FUNCTION get_user_unit_ids()
RETURNS TABLE (unit_id UUID) AS $$
BEGIN
    -- Admin pode acessar todas as unidades
    IF (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin') THEN
        RETURN QUERY SELECT id FROM units WHERE is_active = true;
    ELSE
        -- Usuários comuns acessam apenas sua unidade
        RETURN QUERY
        SELECT p.unit_id
        FROM professionals p
        WHERE p.user_id = auth.uid()
        AND p.is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 📋 Resumo de Permissões por Role

| Tabela              | Profissional       | Recepcionista          | Gerente                    | Admin |
| ------------------- | ------------------ | ---------------------- | -------------------------- | ----- |
| **bank_accounts**   | View               | View                   | View, Edit                 | Full  |
| **payment_methods** | View               | View                   | View, Edit                 | Full  |
| **parties**         | View, Create, Edit | View, Create, Edit     | View, Create, Edit         | Full  |
| **categories**      | View               | View                   | View, Edit                 | Full  |
| **revenues**        | View, Create, Edit | View, Create, Edit     | View, Create, Edit, Delete | Full  |
| **expenses**        | View, Create, Edit | View, Create, Edit     | View, Create, Edit, Delete | Full  |
| **bank_statements** | View, Create, Edit | View, Create, Edit     | View, Create, Edit         | Full  |
| **reconciliations** | View, Create, Edit | View, Create, Edit     | View, Create, Edit, Delete | Full  |
| **cash_registers**  | ❌ View Only       | View, Open/Close       | View, Open/Close           | Full  |
| **services**        | View               | View                   | View, Create, Edit         | Full  |
| **orders**          | Own: Full          | View All, Create, Edit | View All, Create, Edit     | Full  |
| **order_items**     | Own Orders         | All (if order open)    | All (if order open)        | Full  |

### 🔒 Migrations de RLS

- `20251022000002_financial_module_rls_policies.sql` — Todas as políticas do módulo financeiro
- `create_lista_da_vez_tables.sql` — Políticas da Lista da Vez
- Demais policies versionadas em `supabase/migrations/*.sql`

---

## 🧩 Referências Cruzadas

- [`docs/CONTRATOS.md`](CONTRATOS.md) — detalha DTOs e whitelists.
- [`docs/FINANCIAL_MODULE.md`](FINANCIAL_MODULE.md) — documentação completa do módulo financeiro.
- `supabase/migrations/*.sql` — scripts completos de criação de tabelas, views e policies.
- `supabase/functions/*` — Edge Functions relacionadas ao banco (ex.: `monthly-reset`).
