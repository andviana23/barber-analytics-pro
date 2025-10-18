# 🧩 Barber Analytics Pro — Database Schema

> Estrutura de banco de dados relacional (PostgreSQL) utilizada no Supabase  
> Todas as tabelas seguem convenção `snake_case` e possuem `UUID` como chave primária.
> **Atualizado em:** 2024-10-17 via Supabase MCP

---

## 🏢 Table: `units`

| Column     | Type        | Description                        | Constraints                   |
| ---------- | ----------- | ---------------------------------- | ----------------------------- |
| id         | UUID        | Primary key                        | PK, DEFAULT gen_random_uuid() |
| name       | VARCHAR     | Nome da unidade (mín 3 caracteres) | CHECK char_length(name) >= 3  |
| user_id    | UUID        | Proprietário da unidade            | FK → auth.users.id            |
| status     | BOOLEAN     | Status ativo (soft delete legado)  | DEFAULT true                  |
| is_active  | BOOLEAN     | Soft delete flag                   | DEFAULT true                  |
| created_at | TIMESTAMPTZ | Data de criação                    | DEFAULT now()                 |
| updated_at | TIMESTAMPTZ | Data da última atualização         | DEFAULT now()                 |

**Comentário:** Unidades/lojas do sistema (base multi-tenant)  
**RLS:** ✅ Ativo  
**Registros:** 2

---

## 💈 Table: `professionals`

| Column          | Type        | Description                | Constraints                           |
| --------------- | ----------- | -------------------------- | ------------------------------------- |
| id              | UUID        | Primary key                | PK, DEFAULT gen_random_uuid()         |
| unit_id         | UUID        | Referência à unidade       | FK → units.id                         |
| user_id         | UUID        | Usuário vinculado          | FK → auth.users.id                    |
| name            | VARCHAR     | Nome do profissional       | CHECK char_length(name) >= 3          |
| role            | VARCHAR     | Cargo/função               | -                                     |
| commission_rate | NUMERIC     | Taxa de comissão (0-100%)  | CHECK commission_rate >= 0 AND <= 100 |
| is_active       | BOOLEAN     | Status ativo               | DEFAULT true                          |
| created_at      | TIMESTAMPTZ | Data de criação            | DEFAULT now()                         |
| updated_at      | TIMESTAMPTZ | Data da última atualização | DEFAULT now()                         |

**Comentário:** Profissionais vinculados às unidades  
**RLS:** ✅ Ativo  
**Registros:** 0

---

## 👥 Table: `parties`

| Column      | Type        | Description                | Constraints                                    |
| ----------- | ----------- | -------------------------- | ---------------------------------------------- |
| id          | UUID        | Primary key                | PK, DEFAULT gen_random_uuid()                  |
| unit_id     | UUID        | Referência à unidade       | FK → units.id                                  |
| nome        | VARCHAR     | Nome da parte              | CHECK char_length(nome) >= 3                   |
| tipo        | PARTY_TYPE  | Tipo: Cliente/Fornecedor   | ENUM                                           |
| cpf_cnpj    | VARCHAR     | CPF (11) ou CNPJ (14)      | CHECK char_length(cpf_cnpj) IN (11, 14)        |
| telefone    | VARCHAR     | Telefone de contato        | NULLABLE                                       |
| email       | VARCHAR     | Email de contato           | NULLABLE, CHECK email ~\* '^\\S+@\\S+\\.\\S+$' |
| endereco    | TEXT        | Endereço completo          | NULLABLE                                       |
| observacoes | TEXT        | Observações adicionais     | NULLABLE                                       |
| is_active   | BOOLEAN     | Status ativo               | DEFAULT true                                   |
| created_at  | TIMESTAMPTZ | Data de criação            | DEFAULT now()                                  |
| updated_at  | TIMESTAMPTZ | Data da última atualização | DEFAULT now()                                  |

**Comentário:** Clientes e fornecedores (terceiros)  
**RLS:** ✅ Ativo  
**Registros:** 0

---

## 🏦 Table: `bank_accounts`

| Column          | Type        | Description                | Constraints                        |
| --------------- | ----------- | -------------------------- | ---------------------------------- |
| id              | UUID        | Primary key                | PK, DEFAULT gen_random_uuid()      |
| unit_id         | UUID        | Referência à unidade       | FK → units.id                      |
| name            | VARCHAR     | Nome da conta              | CHECK char_length(name) >= 3       |
| bank_name       | VARCHAR     | Nome do banco              | -                                  |
| agency          | VARCHAR     | Agência (apenas números)   | CHECK agency ~ '^[\\d-]+$'         |
| account_number  | VARCHAR     | Número da conta            | CHECK account_number ~ '^[\\d-]+$' |
| nickname        | VARCHAR     | Apelido da conta           | NULLABLE                           |
| initial_balance | NUMERIC     | Saldo inicial              | DEFAULT 0.00                       |
| is_active       | BOOLEAN     | Status ativo               | DEFAULT true                       |
| created_at      | TIMESTAMPTZ | Data de criação            | DEFAULT now()                      |
| updated_at      | TIMESTAMPTZ | Data da última atualização | DEFAULT now()                      |

**Comentário:** Contas bancárias das unidades  
**RLS:** ✅ Ativo  
**Registros:** 1

---

## 💳 Table: `payment_methods`

| Column         | Type        | Description                | Constraints                         |
| -------------- | ----------- | -------------------------- | ----------------------------------- |
| id             | UUID        | Primary key                | PK, DEFAULT gen_random_uuid()       |
| unit_id        | UUID        | Referência à unidade       | FK → units.id                       |
| created_by     | UUID        | Usuário criador            | FK → auth.users.id, NULLABLE        |
| name           | VARCHAR     | Nome do método             | CHECK char_length(name) >= 3        |
| fee_percentage | NUMERIC     | Taxa em % (0-100)          | DEFAULT 0.00, CHECK >= 0 AND <= 100 |
| receipt_days   | INTEGER     | Prazo de recebimento (D+N) | DEFAULT 0, CHECK >= 0               |
| is_active      | BOOLEAN     | Status ativo               | DEFAULT true                        |
| created_at     | TIMESTAMPTZ | Data de criação            | DEFAULT now()                       |
| updated_at     | TIMESTAMPTZ | Data da última atualização | DEFAULT now()                       |

**Comentário:** Métodos de pagamento configuráveis por unidade  
**RLS:** ✅ Ativo  
**Registros:** 1

---

## 📊 Table: `bank_statements`

| Column           | Type                  | Description                      | Constraints                         |
| ---------------- | --------------------- | -------------------------------- | ----------------------------------- |
| id               | UUID                  | Primary key                      | PK, DEFAULT gen_random_uuid()       |
| bank_account_id  | UUID                  | Referência à conta               | FK → bank_accounts.id               |
| transaction_date | DATE                  | Data da transação                | -                                   |
| description      | TEXT                  | Descrição da transação           | CHECK char_length(description) >= 3 |
| amount           | NUMERIC               | Valor da transação               | CHECK amount <> 0                   |
| type             | BANK_TRANSACTION_TYPE | Credit/Debit                     | ENUM                                |
| balance_after    | NUMERIC               | Saldo após transação             | NULLABLE                            |
| reconciled       | BOOLEAN               | Flag de conciliação              | DEFAULT false                       |
| status           | VARCHAR               | Status: pending/reconciled       | DEFAULT 'pending'                   |
| hash_unique      | VARCHAR               | Hash para detecção de duplicatas | UNIQUE                              |
| created_at       | TIMESTAMPTZ           | Data de criação                  | DEFAULT now()                       |

**Comentário:** Extratos bancários importados  
**RLS:** ✅ Ativo  
**Registros:** 0

---

## 💰 Table: `revenues`

| Column                | Type               | Description                            | Constraints                                          |
| --------------------- | ------------------ | -------------------------------------- | ---------------------------------------------------- |
| id                    | UUID               | Primary key                            | PK, DEFAULT gen_random_uuid()                        |
| type                  | INCOME_TYPE        | Tipo: service/product/commission/other | ENUM                                                 |
| value                 | NUMERIC            | Valor principal (0.01-999999.99)       | CHECK value > 0 AND <= 999999.99                     |
| date                  | DATE               | Data da receita                        | DEFAULT CURRENT_DATE, CHECK <= CURRENT_DATE + 1 year |
| unit_id               | UUID               | Unidade que gerou                      | FK → units.id, NULLABLE                              |
| account_id            | UUID               | Conta bancária destino                 | FK → bank_accounts.id, NULLABLE                      |
| category_id           | UUID               | Categoria da receita                   | FK → categories.id, NULLABLE                         |
| professional_id       | UUID               | Profissional responsável               | FK → professionals.id, NULLABLE                      |
| user_id               | UUID               | Usuário que registrou                  | FK → auth.users.id, NULLABLE                         |
| party_id              | UUID               | Cliente/parte relacionada              | FK → parties.id, NULLABLE                            |
| source                | TEXT               | Origem/fonte da receita                | NULLABLE                                             |
| observations          | TEXT               | Observações adicionais                 | NULLABLE                                             |
| gross_amount          | NUMERIC            | Valor bruto (antes taxas)              | NULLABLE, CHECK > 0                                  |
| net_amount            | NUMERIC            | Valor líquido (após taxas)             | NULLABLE, CHECK > 0                                  |
| fees                  | NUMERIC            | Taxas descontadas                      | DEFAULT 0.00, CHECK >= 0                             |
| accrual_start_date    | DATE               | Início período competência             | NULLABLE                                             |
| accrual_end_date      | DATE               | Fim período competência                | NULLABLE                                             |
| expected_receipt_date | DATE               | Data prevista recebimento              | NULLABLE                                             |
| actual_receipt_date   | DATE               | Data efetiva recebimento               | NULLABLE                                             |
| status                | TRANSACTION_STATUS | Status da transação                    | DEFAULT 'Pending', ENUM                              |
| is_active             | BOOLEAN            | Soft delete flag                       | DEFAULT true                                         |
| created_at            | TIMESTAMPTZ        | Data de criação                        | DEFAULT now()                                        |
| updated_at            | TIMESTAMPTZ        | Data da última atualização             | DEFAULT now()                                        |

**Comentário:** Receitas do sistema (núcleo financeiro)  
**RLS:** ✅ Ativo  
**Registros:** 3

---

## 💸 Table: `expenses`

| Column                | Type               | Description                                | Constraints                                          |
| --------------------- | ------------------ | ------------------------------------------ | ---------------------------------------------------- |
| id                    | UUID               | Primary key                                | PK, DEFAULT gen_random_uuid()                        |
| type                  | EXPENSE_TYPE       | Tipo: rent/salary/supplies/utilities/other | ENUM                                                 |
| value                 | NUMERIC            | Valor da despesa                           | CHECK value > 0 AND <= 999999.99                     |
| date                  | DATE               | Data da despesa                            | DEFAULT CURRENT_DATE, CHECK <= CURRENT_DATE + 1 year |
| unit_id               | UUID               | Referência à unidade                       | FK → units.id                                        |
| account_id            | UUID               | Conta bancária origem                      | FK → bank_accounts.id, NULLABLE                      |
| category_id           | UUID               | Categoria da despesa                       | FK → categories.id, NULLABLE                         |
| party_id              | UUID               | Fornecedor relacionado                     | FK → parties.id, NULLABLE                            |
| user_id               | UUID               | Usuário que registrou                      | FK → auth.users.id, NULLABLE                         |
| description           | TEXT               | Descrição da despesa                       | NULLABLE                                             |
| observations          | TEXT               | Observações adicionais                     | NULLABLE                                             |
| expected_payment_date | DATE               | Data prevista pagamento                    | NULLABLE                                             |
| actual_payment_date   | DATE               | Data efetiva pagamento                     | NULLABLE                                             |
| status                | TRANSACTION_STATUS | Status da despesa                          | DEFAULT 'Pending', ENUM                              |
| is_active             | BOOLEAN            | Status ativo                               | DEFAULT true                                         |
| created_at            | TIMESTAMPTZ        | Data de criação                            | DEFAULT now()                                        |
| updated_at            | TIMESTAMPTZ        | Data da última atualização                 | DEFAULT now()                                        |

**Comentário:** Despesas do sistema (saídas financeiras)  
**RLS:** ✅ Ativo  
**Registros:** 0

---

## 🏷️ Table: `categories`

| Column        | Type         | Description                | Constraints                               |
| ------------- | ------------ | -------------------------- | ----------------------------------------- |
| id            | UUID         | Primary key                | PK, DEFAULT gen_random_uuid()             |
| unit_id       | UUID         | Referência à unidade       | FK → units.id                             |
| name          | VARCHAR(100) | Nome da categoria          | NOT NULL, CHECK char_length(name) >= 2    |
| description   | TEXT         | Descrição da categoria     | NULLABLE                                  |
| category_type | VARCHAR(20)  | Tipo: Revenue/Expense      | NOT NULL, CHECK IN ('Revenue', 'Expense') |
| parent_id     | UUID         | Categoria pai (hierarquia) | FK → categories.id, NULLABLE              |
| is_active     | BOOLEAN      | Status ativo               | DEFAULT true                              |
| created_at    | TIMESTAMPTZ  | Data de criação            | DEFAULT now()                             |
| updated_at    | TIMESTAMPTZ  | Data da última atualização | DEFAULT now()                             |

**Comentário:** Categorias hierárquicas para classificação de receitas e despesas  
**RLS:** ✅ Ativo (políticas por unit_id)  
**Registros:** 0  
**Índices:**

- `idx_categories_unit_type` - (unit_id, category_type) WHERE is_active = true
- `idx_categories_name_search` - (name)
- `idx_categories_parent` - (parent_id) WHERE parent_id IS NOT NULL
- `idx_categories_active` - (unit_id, category_type, is_active)

**Relacionamentos:**

- `revenues.category_id` → categories.id (índice: idx_revenues_category)
- `expenses.category_id` → categories.id (índice: idx_expenses_category)

**Regras de Negócio:**

- Categoria pai deve ser do mesmo tipo (Revenue ou Expense)
- Categoria pai deve estar ativa (is_active = true)
- Categoria não pode ser pai de si mesma
- Apenas categorias principais (sem parent_id) podem ser pais
- Não pode excluir categoria com subcategorias ativas
- Suporta hierarquia de 2 níveis (Principal → Subcategoria)

**Exemplos de Uso:**

```sql
-- Criar categoria principal de Receitas
INSERT INTO categories (unit_id, name, category_type, description)
VALUES ('uuid-unit', 'Serviços', 'Revenue', 'Serviços prestados aos clientes');

-- Criar subcategoria
INSERT INTO categories (unit_id, name, category_type, parent_id)
VALUES ('uuid-unit', 'Corte de Cabelo', 'Revenue', 'uuid-servicos');

-- Buscar árvore de categorias
WITH RECURSIVE category_tree AS (
  SELECT id, name, parent_id, category_type, 0 as level
  FROM categories
  WHERE parent_id IS NULL AND unit_id = 'uuid-unit' AND is_active = true
  UNION ALL
  SELECT c.id, c.name, c.parent_id, c.category_type, ct.level + 1
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
  WHERE c.is_active = true
)
SELECT * FROM category_tree ORDER BY level, name;
```

---

## 🔗 Table: `reconciliations`

| Column              | Type        | Description                                  | Constraints                     |
| ------------------- | ----------- | -------------------------------------------- | ------------------------------- |
| id                  | UUID        | Primary key                                  | PK, DEFAULT gen_random_uuid()   |
| bank_statement_id   | UUID        | Referência ao extrato                        | FK → bank_statements.id, UNIQUE |
| reference_type      | VARCHAR     | Tipo: Revenue/Expense                        | CHECK IN ('Revenue', 'Expense') |
| reference_id        | UUID        | ID da receita/despesa                        | -                               |
| reconciliation_date | TIMESTAMPTZ | Data da conciliação                          | DEFAULT now()                   |
| status              | VARCHAR     | Status: pending/confirmed/Divergent/rejected | DEFAULT 'confirmed'             |
| difference          | NUMERIC     | Diferença entre valores                      | DEFAULT 0.00, NULLABLE          |
| notes               | TEXT        | Notas da conciliação                         | NULLABLE                        |
| confirmed_at        | TIMESTAMPTZ | Data de confirmação                          | NULLABLE                        |
| created_at          | TIMESTAMPTZ | Data de criação                              | DEFAULT now()                   |

**Comentário:** Conciliação bancária - vínculo extratos x lançamentos  
**RLS:** ✅ Ativo  
**Registros:** 0

---

## 📝 Table: `access_logs`

| Column     | Type        | Description             | Constraints                    |
| ---------- | ----------- | ----------------------- | ------------------------------ |
| id         | UUID        | Primary key             | PK, DEFAULT gen_random_uuid()  |
| user_id    | UUID        | Usuário que executou    | FK → auth.users.id, NULLABLE   |
| action     | VARCHAR     | Ação realizada          | CHECK char_length(action) >= 3 |
| resource   | VARCHAR     | Recurso acessado        | NULLABLE                       |
| timestamp  | TIMESTAMPTZ | Data/hora da ação       | DEFAULT now()                  |
| ip_address | INET        | Endereço IP             | NULLABLE                       |
| user_agent | TEXT        | User Agent do navegador | NULLABLE                       |

**Comentário:** Logs de auditoria e acesso ao sistema  
**RLS:** ✅ Ativo  
**Registros:** 0

---

## 🎯 Table: `goals`

| Column         | Type        | Description                        | Constraints                         |
| -------------- | ----------- | ---------------------------------- | ----------------------------------- |
| id             | UUID        | Primary key                        | PK, DEFAULT gen_random_uuid()       |
| unit_id        | UUID        | Referência à unidade               | FK → units.id                       |
| goal_type      | ENUM        | Tipo de meta                       | goal_type ENUM                      |
| period         | ENUM        | Período da meta                    | goal_period ENUM, DEFAULT 'monthly' |
| target_value   | DECIMAL     | Valor alvo da meta                 | NOT NULL                            |
| achieved_value | DECIMAL     | Valor atingido                     | DEFAULT 0                           |
| goal_year      | INTEGER     | Ano da meta                        | NOT NULL                            |
| goal_month     | INTEGER     | Mês da meta (NULL para anual)      | -                                   |
| goal_quarter   | INTEGER     | Trimestre (NULL para mensal/anual) | -                                   |
| is_active      | BOOLEAN     | Meta ativa                         | DEFAULT true                        |
| created_at     | TIMESTAMPTZ | Data de criação                    | DEFAULT now()                       |
| updated_at     | TIMESTAMPTZ | Data da última atualização         | DEFAULT now()                       |
| created_by     | UUID        | Usuário criador                    | FK → auth.users.id                  |

**Comentário:** Metas financeiras por unidade e período  
**RLS:** ✅ Ativo  
**Registros:** 0

---

## 📊 Views

### `vw_goals_with_units`

View que combina metas com informações das unidades, incluindo cálculos de progresso e status.

| Column              | Type        | Description                               |
| ------------------- | ----------- | ----------------------------------------- |
| id                  | UUID        | ID da meta                                |
| unit_id             | UUID        | ID da unidade                             |
| unit_name           | TEXT        | Nome da unidade                           |
| goal_type           | ENUM        | Tipo da meta                              |
| period              | ENUM        | Período da meta                           |
| target_value        | DECIMAL     | Valor alvo                                |
| achieved_value      | DECIMAL     | Valor atingido                            |
| goal_year           | INTEGER     | Ano da meta                               |
| goal_month          | INTEGER     | Mês da meta (NULL para anual)             |
| goal_quarter        | INTEGER     | Trimestre (NULL para mensal/anual)        |
| is_active           | BOOLEAN     | Meta ativa                                |
| created_at          | TIMESTAMPTZ | Data de criação                           |
| updated_at          | TIMESTAMPTZ | Data da última atualização                |
| created_by          | UUID        | Usuário criador                           |
| progress_percentage | DECIMAL     | Percentual de progresso (0-100)           |
| remaining_value     | DECIMAL     | Valor restante para atingir meta          |
| status              | TEXT        | Status: achieved/on_track/behind/critical |

**Comentário:** View para consultas otimizadas de metas com informações das unidades  
**Registros:** 10 (5 metas por unidade)

### `vw_financial_summary`

View agregada para relatórios financeiros com dados consolidados por unidade.

| Column             | Type        | Description                                      |
| ------------------ | ----------- | ------------------------------------------------ |
| unit_id            | UUID        | ID da unidade                                    |
| unit_name          | TEXT        | Nome da unidade                                  |
| total_revenue      | DECIMAL     | Receita total                                    |
| total_expenses     | DECIMAL     | Despesas total                                   |
| net_profit         | DECIMAL     | Lucro líquido                                    |
| avg_profit_margin  | DECIMAL     | Margem média de lucro (%)                        |
| months_with_data   | INTEGER     | Meses com dados                                  |
| last_month         | DATE        | Último mês com dados                             |
| first_month        | DATE        | Primeiro mês com dados                           |
| performance_status | TEXT        | Status: excellent/good/average/needs_improvement |
| activity_status    | TEXT        | Status: active/recent/inactive                   |
| generated_at       | TIMESTAMPTZ | Data de geração da view                          |

**Comentário:** View para relatórios gerenciais com dados agregados dos últimos 12 meses  
**Registros:** Dinâmico (baseado nas unidades ativas)

---

### `vw_calendar_events`

**Propósito:** Unifica eventos financeiros (receitas e despesas) para exibição no calendário

**Colunas:**

- `id`, `tipo` (Receive/Pay), `status` (Expected/Effective/Overdue)
- `event_date`, `title`, `amount`, `unit_id`, `account_id`, `party_id`
- `ref_type` (Revenue/Expense), `ref_id`, `transaction_status`, `category`

### `vw_cashflow_entries`

**Propósito:** Entradas e saídas agregadas para análise de fluxo de caixa

**Colunas:**

- `transaction_id`, `transaction_type` (Revenue/Expense)
- `unit_id`, `account_id`, `transaction_date`, `description`
- `inflows`, `outflows`, `daily_balance`, `status`

### `vw_dashboard_financials`

**Propósito:** Métricas financeiras agregadas por mês para dashboard

**Colunas:**

- `unit_id`, `period`, `total_revenue`, `total_net_revenue`, `total_fees`
- `received_revenue`, `pending_revenue`, `overdue_revenue`
- `total_transactions`, `received_count`, `pending_count`

### `vw_reconciliation_summary`

**Propósito:** Resumo de conciliação bancária por conta e período

**Colunas:**

- `account_id`, `account_name`, `unit_id`, `period`
- `total_statements`, `total_reconciled`, `total_pending`
- `total_amount`, `reconciled_amount`, `pending_amount`, `divergent_amount`

---

## 🔤 Enums

### `income_type`

- `service` - Serviços prestados
- `product` - Venda de produtos
- `commission` - Comissões recebidas
- `other` - Outras receitas

### `expense_type`

- `rent` - Aluguel
- `salary` - Salários
- `supplies` - Suprimentos
- `utilities` - Utilidades (energia, água, etc.)
- `other` - Outras despesas

### `transaction_status`

- `Pending` - Pendente
- `Partial` - Parcial
- `Received` - Recebido
- `Paid` - Pago
- `Cancelled` - Cancelado
- `Overdue` - Vencido

### `party_type`

- `Cliente` - Cliente
- `Fornecedor` - Fornecedor

### `bank_transaction_type`

- `Credit` - Crédito (entrada)
- `Debit` - Débito (saída)

### `goal_type`

- `revenue_general` - Meta de Faturamento Geral
- `subscription` - Meta de Assinatura
- `product_sales` - Meta de Venda de Produtos
- `expenses` - Meta de Despesas
- `profit` - Meta de Resultado/Lucro

### `goal_period`

- `monthly` - Mensal
- `quarterly` - Trimestral
- `yearly` - Anual

---

## 🔐 Triggers and Functions

| Name                           | Purpose                                         |
| ------------------------------ | ----------------------------------------------- |
| `update_timestamp()`           | Atualiza automaticamente `updated_at`           |
| `trigger_update_professionals` | Mantém timestamps dos profissionais atualizados |
| `trigger_update_units`         | Mantém timestamps das unidades atualizados      |

---

## 🧭 Notes

- **Multi-tenant:** Todas as tabelas principais são filtradas por `unit_id`
- **RLS Ativo:** Row Level Security habilitado em todas as tabelas
- **UUIDs:** Todos os IDs usam `gen_random_uuid()` para consistência
- **ENUMs:** Garantem integridade de dados e simplificam filtros na UI
- **Soft Delete:** Campo `is_active` para exclusão lógica
- **Auditoria:** Campos `created_at` e `updated_at` em todas as tabelas
- **Integração:** Projetado para Supabase Realtime e Edge Functions
- **Arquitetura:** Segue Clean Architecture e normalização 3NF

---

📘 **Arquivo atualizado por:** AI Agent via Supabase MCP  
📅 **Para o Projeto:** Barber Analytics Pro  
🧠 **Stack:** Supabase + React + TypeScript + Tailwind  
🔄 **Última atualização:** 2024-10-17
