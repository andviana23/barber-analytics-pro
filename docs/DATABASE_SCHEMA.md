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

| Tabela                          | Propósito                  | Colunas de destaque                                                                                                                                 |
| ------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `units`                         | Unidades/lojas (tenant)    | `id`, `name`, `status`, `is_active`, `created_at`, `updated_at`                                                                                     |
| `revenues`                      | Receitas financeiras       | `type`, `value`, `date`, `unit_id`, `account_id`, `category_id`, `payment_method_id`, `status`, `gross_amount`, `net_amount`, `fees`, `source_hash` |
| `expenses`                      | Despesas                   | `type`, `value`, `date`, `unit_id`, `category_id`, `party_id`, `status`, `expected_payment_date`, `actual_payment_date`                             |
| `bank_accounts`                 | Contas bancárias           | `unit_id`, `name`, `bank_name`, `agency`, `account_number`, `initial_balance`, `is_active`                                                          |
| `bank_statements`               | Extratos importados        | `bank_account_id`, `transaction_date`, `description`, `amount`, `type`, `hash_unique`, `reconciled`, `status`                                       |
| `parties`                       | Clientes/fornecedores      | `unit_id`, `name`, `party_type`, `cpf_cnpj`, `email`, `is_active`                                                                                   |
| `professionals`                 | Profissionais/barbeiros    | `unit_id`, `name`, `role`, `points`, `is_active`                                                                                                    |
| `barbers_turn_list`             | Fila atual da Lista da Vez | `unit_id`, `professional_id`, `points`, `position`, `last_updated`                                                                                  |
| `barbers_turn_history`          | Histórico mensal da fila   | `unit_id`, `professional_id`, `month`, `year`, `total_points`, `final_position`                                                                     |
| `goals`, `goal_history`         | Metas financeiras          | `unit_id`, `goal_type`, `period`, `target_value`, `achieved_value`                                                                                  |
| `products`, `product_movements` | Estoque e movimentações    | `unit_id`, `sku`, `stock`, `movement_type`, `quantity`                                                                                              |

---

## 👓 Views & Materializações

- `vw_turn_list_complete` — join entre `barbers_turn_list`, `units`, `professionals`.
- `vw_turn_history_complete` — histórico enriquecido com nomes de unidade e profissional.
- Views auxiliares para dashboards (consultar migrations para detalhes atualizados).

---

## 🧮 Funções & RPC

- `fn_initialize_turn_list(unit_id uuid)`
- `fn_add_point_to_barber(unit_id uuid, professional_id uuid)`
- `fn_reorder_turn_list(unit_id uuid)`
- `fn_monthly_reset_turn_list()`
- `fn_calculate_dre(unit_id uuid, start_date date, end_date date)`

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

### 🔑 Função Helper: `get_user_unit_ids()`

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

| Tabela              | Barbeiro           | Gerente                    | Admin |
| ------------------- | ------------------ | -------------------------- | ----- |
| **bank_accounts**   | View               | View, Edit                 | Full  |
| **payment_methods** | View               | View, Edit                 | Full  |
| **parties**         | View, Create, Edit | View, Create, Edit         | Full  |
| **categories**      | View               | View, Edit                 | Full  |
| **revenues**        | View, Create, Edit | View, Create, Edit, Delete | Full  |
| **expenses**        | View, Create, Edit | View, Create, Edit, Delete | Full  |
| **bank_statements** | View, Create, Edit | View, Create, Edit         | Full  |
| **reconciliations** | View, Create, Edit | View, Create, Edit, Delete | Full  |

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
