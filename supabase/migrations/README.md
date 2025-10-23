# 🗄️ Financial Module Migrations

> **Migrations completas do módulo financeiro para Barber Analytics Pro**
> **Data:** 22/10/2025

---

## 📋 Resumo das Migrations

### 1. `20251022000001_financial_module_complete_schema.sql`

**350 linhas | Schema completo**

Cria todas as tabelas do módulo financeiro:

- ✅ `bank_accounts` — Contas bancárias
- ✅ `payment_methods` — Métodos de pagamento
- ✅ `parties` — Clientes e fornecedores
- ✅ `categories` — Categorias hierárquicas (pai/filho)
- ✅ `revenues` — Receitas com competência
- ✅ `expenses` — Despesas com vencimento
- ✅ `bank_statements` — Extratos bancários importados

**Includes:**

- Indexes otimizados para queries frequentes
- Triggers de `updated_at` automáticos
- Check constraints para validações
- Comentários de documentação

### 2. `20251022000002_financial_module_rls_policies.sql`

**280 linhas | RLS Policies**

Implementa segurança Row Level Security:

- ✅ Políticas por role (barbeiro, gerente, admin)
- ✅ Função helper `get_user_unit_ids()`
- ✅ Permissões granulares (SELECT, INSERT, UPDATE, DELETE)
- ✅ Multi-tenant via `unit_id`

**Permissões:**
| Tabela | Barbeiro | Gerente | Admin |
|--------|----------|---------|-------|
| bank_accounts | View | View, Edit | Full |
| revenues | View, Create, Edit | Full | Full |
| expenses | View, Create, Edit | Full | Full |
| reconciliations | View, Create, Edit | Full | Full |

### 3. `20251022000003_financial_module_fixtures.sql`

**280 linhas | Test Fixtures**

Dados de teste para QA e E2E:

- 2 Bank Accounts (Corrente, Poupança)
- 3 Payment Methods (PIX, Cartão, Dinheiro)
- 3 Parties (2 clientes, 1 fornecedor)
- 6 Categories (2 pai + 4 filhas)
- 2 Revenues (1 received, 1 pending)
- 3 Expenses (1 paid, 1 pending, 1 overdue)
- 3 Bank Statements (2 reconciled, 1 unreconciled)

---

## 🚀 Como Aplicar as Migrations

### Opção 1: Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI (se não tiver)
npm install -g supabase

# 2. Login
supabase login

# 3. Link ao projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Aplicar migrations
supabase db push

# 5. Verificar status
supabase db diff
```

### Opção 2: Supabase Dashboard (Manual)

1. Acesse: https://app.supabase.com/project/SEU_PROJECT/editor
2. Vá em: **SQL Editor**
3. Copie e execute cada migration **na ordem**:
   - Primeiro: `20251022000001_financial_module_complete_schema.sql`
   - Segundo: `20251022000002_financial_module_rls_policies.sql`
   - Terceiro: `20251022000003_financial_module_fixtures.sql` (opcional, apenas para testes)

### Opção 3: psql (Direto no PostgreSQL)

```bash
# Conectar ao banco
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/[DATABASE]

# Executar migrations na ordem
\i supabase/migrations/20251022000001_financial_module_complete_schema.sql
\i supabase/migrations/20251022000002_financial_module_rls_policies.sql
\i supabase/migrations/20251022000003_financial_module_fixtures.sql
```

---

## ✅ Verificação Pós-Migration

Execute estas queries para validar:

```sql
-- 1. Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'bank_accounts', 'payment_methods', 'parties',
  'categories', 'revenues', 'expenses', 'bank_statements'
);

-- 2. Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'bank_accounts', 'revenues', 'expenses', 'bank_statements'
);

-- 3. Verificar policies criadas
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- 4. Verificar função helper
SELECT proname
FROM pg_proc
WHERE proname = 'get_user_unit_ids';

-- 5. Contar fixtures (opcional)
SELECT
  'bank_accounts' as table, COUNT(*) as rows FROM bank_accounts
UNION ALL
SELECT 'revenues', COUNT(*) FROM revenues
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses;
```

---

## 🔄 Rollback (Se Necessário)

Para reverter as migrations:

```sql
-- 1. Remover fixtures
DELETE FROM bank_statements WHERE created_at > '2025-10-22';
DELETE FROM expenses WHERE created_at > '2025-10-22';
DELETE FROM revenues WHERE created_at > '2025-10-22';
DELETE FROM categories WHERE created_at > '2025-10-22';
DELETE FROM parties WHERE created_at > '2025-10-22';
DELETE FROM payment_methods WHERE created_at > '2025-10-22';
DELETE FROM bank_accounts WHERE created_at > '2025-10-22';

-- 2. Remover RLS policies
DROP POLICY IF EXISTS "Users can view bank accounts from their unit" ON bank_accounts;
-- (repetir para todas as policies)

-- 3. Remover função helper
DROP FUNCTION IF EXISTS get_user_unit_ids();

-- 4. Remover tabelas (CUIDADO!)
DROP TABLE IF EXISTS bank_statements CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS revenues CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
```

---

## 📊 Impacto no Sistema

### Antes das Migrations:

- ❌ Tabelas financeiras não documentadas
- ❌ RLS policies inconsistentes
- ❌ Sem dados de teste estruturados
- ❌ Documentação técnica desatualizada

### Depois das Migrations:

- ✅ Schema completo e versionado
- ✅ RLS policies implementadas e documentadas
- ✅ Fixtures prontas para QA/E2E
- ✅ Documentação técnica atualizada (`DATABASE_SCHEMA.md`, `FINANCIAL_MODULE.md`)
- ✅ Sistema pronto para modo Conciliação

---

## 🎯 Próximos Passos

1. ✅ Aplicar migrations no ambiente de desenvolvimento
2. ✅ Validar com fixtures de teste
3. ✅ Testar funcionalidades no frontend
4. ⏳ Executar testes E2E Playwright
5. ⏳ Aplicar migrations em staging
6. ⏳ Deploy para produção

---

## 📚 Documentação Relacionada

- [`DATABASE_SCHEMA.md`](../docs/DATABASE_SCHEMA.md) — Schema completo e RLS policies
- [`FINANCIAL_MODULE.md`](../docs/FINANCIAL_MODULE.md) — Documentação do módulo financeiro
- [`FINANCIAL_MODULE_CHECKLIST.md`](../docs/FINANCIAL_MODULE_CHECKLIST.md) — Checklist de implementação

---

## 🆘 Suporte

Em caso de dúvidas ou problemas:

1. Verifique logs do Supabase: https://app.supabase.com/project/SEU_PROJECT/logs
2. Consulte documentação: https://supabase.com/docs/guides/database
3. Revise este README e as migrations

---

**Criado por:** AI Assistant  
**Data:** 22/10/2025  
**Versão:** 1.0.0
