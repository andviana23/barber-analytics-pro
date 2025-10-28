# Análise de Gaps - Módulo de Conciliação Bancária

**Data da Análise:** 21 de outubro de 2025
**Sistema:** Barber Analytics Pro
**Módulo:** Conciliação Bancária

---

## 📊 Status Geral

### ✅ O que JÁ EXISTE (67% completo)

| Componente                | Status    | Localização                                                                                                                                |
| ------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Serviços**              |           |                                                                                                                                            |
| ReconciliationService     | ✅ EXISTE | [src/services/reconciliationService.js](src/services/reconciliationService.js)                                                             |
| BankStatementsService     | ✅ EXISTE | [src/services/bankStatementsService.js](src/services/bankStatementsService.js)                                                             |
| BankAccountsService       | ✅ EXISTE | [src/services/bankAccountsService.js](src/services/bankAccountsService.js)                                                                 |
| **Hooks**                 |           |                                                                                                                                            |
| useReconciliationMatches  | ✅ EXISTE | [src/hooks/useReconciliationMatches.js](src/hooks/useReconciliationMatches.js)                                                             |
| useBankStatements         | ✅ EXISTE | [src/hooks/useBankStatements.js](src/hooks/useBankStatements.js)                                                                           |
| useBankAccounts           | ✅ EXISTE | [src/hooks/useBankAccounts.js](src/hooks/useBankAccounts.js)                                                                               |
| **Páginas**               |           |                                                                                                                                            |
| FinanceiroAdvancedPage    | ✅ EXISTE | [src/pages/FinanceiroAdvancedPage/FinanceiroAdvancedPage.jsx](src/pages/FinanceiroAdvancedPage/FinanceiroAdvancedPage.jsx)                 |
| ConciliacaoTab            | ✅ EXISTE | [src/pages/FinanceiroAdvancedPage/ConciliacaoTab.jsx](src/pages/FinanceiroAdvancedPage/ConciliacaoTab.jsx:219)                             |
| **Organisms**             |           |                                                                                                                                            |
| ConciliacaoPanel          | ✅ EXISTE | [src/organisms/ConciliacaoPanel/ConciliacaoPanel.jsx](src/organisms/ConciliacaoPanel/ConciliacaoPanel.jsx:1013)                            |
| **Molecules**             |           |                                                                                                                                            |
| ReconciliationMatchCard   | ✅ EXISTE | [src/molecules/ReconciliationMatchCard/ReconciliationMatchCard.jsx](src/molecules/ReconciliationMatchCard/ReconciliationMatchCard.jsx:671) |
| **Templates**             |           |                                                                                                                                            |
| ImportStatementModal      | ✅ EXISTE | [src/templates/ImportStatementModal.jsx](src/templates/ImportStatementModal.jsx:1164)                                                      |
| ManualReconciliationModal | ✅ EXISTE | [src/templates/ManualReconciliationModal.jsx](src/templates/ManualReconciliationModal.jsx:1074)                                            |
| **Atoms**                 |           |                                                                                                                                            |
| StatusBadge               | ✅ EXISTE | [src/atoms/StatusBadge/StatusBadge.jsx](src/atoms/StatusBadge/StatusBadge.jsx)                                                             |
| DateRangePicker           | ✅ EXISTE | [src/atoms/DateRangePicker/DateRangePicker.jsx](src/atoms/DateRangePicker/DateRangePicker.jsx)                                             |

---

## ❌ O que está FALTANDO (33%)

### 1. 🗄️ Banco de Dados - CRÍTICO

#### 1.1 Tabelas Principais

**❌ `bank_accounts` - NÃO EXISTE**

```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,

  -- Dados da conta
  bank_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('Corrente', 'Poupança', 'Investimento')),
  agency VARCHAR(20) NOT NULL,
  account_number VARCHAR(30) NOT NULL,
  nickname VARCHAR(100),

  -- Saldo
  current_balance NUMERIC(12,2) DEFAULT 0,
  opening_balance NUMERIC(12,2) DEFAULT 0,
  opening_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_main BOOLEAN DEFAULT false,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(unit_id, bank_name, agency, account_number)
);

-- Índices
CREATE INDEX idx_bank_accounts_unit_id ON bank_accounts(unit_id);
CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active);

-- RLS Policies
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank accounts from their units"
ON bank_accounts FOR SELECT
USING (
  unit_id IN (
    SELECT id FROM units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert bank accounts in their units"
ON bank_accounts FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT id FROM units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update bank accounts in their units"
ON bank_accounts FOR UPDATE
USING (
  unit_id IN (
    SELECT id FROM units WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete bank accounts in their units"
ON bank_accounts FOR DELETE
USING (
  unit_id IN (
    SELECT id FROM units WHERE user_id = auth.uid()
  )
);
```

**❌ `bank_statements` - NÃO EXISTE**

```sql
CREATE TABLE bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,

  -- Dados da transação
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  document VARCHAR(100),

  -- Valores
  amount NUMERIC(12,2) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Credit', 'Debit')),
  balance_after NUMERIC(12,2),

  -- Conciliação
  reconciled BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reconciled')),

  -- Detecção de duplicatas
  hash_unique VARCHAR(64) NOT NULL,

  -- Importação
  import_batch_id UUID,
  import_date TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(bank_account_id, hash_unique)
);

-- Índices
CREATE INDEX idx_bank_statements_account ON bank_statements(bank_account_id);
CREATE INDEX idx_bank_statements_date ON bank_statements(transaction_date);
CREATE INDEX idx_bank_statements_reconciled ON bank_statements(reconciled);
CREATE INDEX idx_bank_statements_status ON bank_statements(status);
CREATE INDEX idx_bank_statements_hash ON bank_statements(hash_unique);

-- RLS Policies
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view statements from their accounts"
ON bank_statements FOR SELECT
USING (
  bank_account_id IN (
    SELECT id FROM bank_accounts
    WHERE unit_id IN (
      SELECT id FROM units WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert statements in their accounts"
ON bank_statements FOR INSERT
WITH CHECK (
  bank_account_id IN (
    SELECT id FROM bank_accounts
    WHERE unit_id IN (
      SELECT id FROM units WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update statements in their accounts"
ON bank_statements FOR UPDATE
USING (
  bank_account_id IN (
    SELECT id FROM bank_accounts
    WHERE unit_id IN (
      SELECT id FROM units WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete statements in their accounts"
ON bank_statements FOR DELETE
USING (
  bank_account_id IN (
    SELECT id FROM bank_accounts
    WHERE unit_id IN (
      SELECT id FROM units WHERE user_id = auth.uid()
    )
  )
);
```

**❌ `reconciliations` - NÃO EXISTE**

```sql
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vínculos
  statement_id UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  reference_type VARCHAR(20) NOT NULL CHECK (reference_type IN ('Revenue', 'Expense')),
  reference_id UUID NOT NULL,

  -- Dados da conciliação
  reconciliation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'Divergent', 'rejected')),

  -- Diferenças
  difference NUMERIC(12,2) DEFAULT 0,
  notes TEXT,

  -- Confirmação
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id),

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(statement_id, reference_type, reference_id)
);

-- Índices
CREATE INDEX idx_reconciliations_statement ON reconciliations(statement_id);
CREATE INDEX idx_reconciliations_reference ON reconciliations(reference_type, reference_id);
CREATE INDEX idx_reconciliations_status ON reconciliations(status);
CREATE INDEX idx_reconciliations_date ON reconciliations(reconciliation_date);

-- RLS Policies
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reconciliations from their units"
ON reconciliations FOR SELECT
USING (
  statement_id IN (
    SELECT bs.id FROM bank_statements bs
    INNER JOIN bank_accounts ba ON bs.bank_account_id = ba.id
    WHERE ba.unit_id IN (
      SELECT id FROM units WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert reconciliations in their units"
ON reconciliations FOR INSERT
WITH CHECK (
  statement_id IN (
    SELECT bs.id FROM bank_statements bs
    INNER JOIN bank_accounts ba ON bs.bank_account_id = ba.id
    WHERE ba.unit_id IN (
      SELECT id FROM units WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update reconciliations in their units"
ON reconciliations FOR UPDATE
USING (
  statement_id IN (
    SELECT bs.id FROM bank_statements bs
    INNER JOIN bank_accounts ba ON bs.bank_account_id = ba.id
    WHERE ba.unit_id IN (
      SELECT id FROM units WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete reconciliations in their units"
ON reconciliations FOR DELETE
USING (
  statement_id IN (
    SELECT bs.id FROM bank_statements bs
    INNER JOIN bank_accounts ba ON bs.bank_account_id = ba.id
    WHERE ba.unit_id IN (
      SELECT id FROM units WHERE user_id = auth.uid()
    )
  )
);
```

#### 1.2 Triggers e Functions

**❌ Trigger para atualizar `updated_at`**

```sql
-- Function genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabela
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_statements_updated_at
  BEFORE UPDATE ON bank_statements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reconciliations_updated_at
  BEFORE UPDATE ON reconciliations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**❌ Trigger para sincronizar status de extrato**

```sql
CREATE OR REPLACE FUNCTION sync_bank_statement_reconciliation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando reconciliação é criada ou confirmada
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'confirmed' THEN
    UPDATE bank_statements
    SET
      reconciled = true,
      status = 'reconciled'
    WHERE id = NEW.statement_id;
  END IF;

  -- Quando reconciliação é deletada
  IF TG_OP = 'DELETE' THEN
    UPDATE bank_statements
    SET
      reconciled = false,
      status = 'pending'
    WHERE id = OLD.statement_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_bank_statement_status
  AFTER INSERT OR UPDATE OR DELETE ON reconciliations
  FOR EACH ROW
  EXECUTE FUNCTION sync_bank_statement_reconciliation_status();
```

**❌ Function para gerar hash único de extrato**

```sql
CREATE OR REPLACE FUNCTION generate_statement_hash(
  p_account_id UUID,
  p_date DATE,
  p_amount NUMERIC,
  p_description TEXT
) RETURNS VARCHAR(64) AS $$
BEGIN
  -- Hash MD5 dos dados principais para detecção de duplicatas
  RETURN md5(
    p_account_id::text ||
    p_date::text ||
    p_amount::text ||
    LOWER(TRIM(p_description))
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

#### 1.3 Views

**❌ `vw_reconciliation_summary` - NÃO EXISTE**

```sql
CREATE OR REPLACE VIEW vw_reconciliation_summary AS
SELECT
  ba.id AS account_id,
  ba.bank_name,
  ba.nickname AS account_nickname,
  ba.unit_id,

  -- Período (mês/ano)
  DATE_TRUNC('month', bs.transaction_date) AS period,

  -- Contadores
  COUNT(bs.id) AS total_statements,
  COUNT(r.id) FILTER (WHERE r.status = 'confirmed') AS total_reconciled,
  COUNT(bs.id) FILTER (WHERE bs.reconciled = false) AS total_pending,

  -- Valores
  SUM(bs.amount) AS total_amount,
  SUM(bs.amount) FILTER (WHERE bs.reconciled = true) AS reconciled_amount,
  SUM(bs.amount) FILTER (WHERE bs.reconciled = false) AS pending_amount,
  SUM(r.difference) FILTER (WHERE r.status = 'confirmed') AS divergent_amount

FROM bank_accounts ba
LEFT JOIN bank_statements bs ON bs.bank_account_id = ba.id
LEFT JOIN reconciliations r ON r.statement_id = bs.id

WHERE ba.is_active = true

GROUP BY
  ba.id,
  ba.bank_name,
  ba.nickname,
  ba.unit_id,
  DATE_TRUNC('month', bs.transaction_date)

ORDER BY period DESC, ba.bank_name;
```

---

### 2. 📁 Exports e Integrações

**❌ `src/services/index.js` - Faltam exports**

Arquivo atual:

```javascript
export * from './supabase';
export { default as auditService } from './auditService';
export { default as bankAccountsService } from './bankAccountsService';
export { default as dashboardService } from './dashboardService';
export { default as filaService } from './filaService';
export { default as financeiroService } from './financeiroService';
export { default as profissionaisService } from './profissionaisService';
export { default as relatoriosService } from './relatoriosService';
export { default as unitsService } from './unitsService';
```

**Adicionar:**

```javascript
export { default as bankStatementsService } from './bankStatementsService';
export { ReconciliationService } from './reconciliationService';
```

---

### 3. 🔗 Integrações com Backend

#### 3.1 Verificar Conexões Supabase

Os serviços já existem, mas é necessário **validar**:

✅ `bankStatementsService.js` - [src/services/bankStatementsService.js](src/services/bankStatementsService.js:15533)

- ✅ `getStatements(filters)`
- ✅ `getUnreconciledStatements(accountId)`
- ✅ `getStatementById(id)`
- ✅ `importStatements(payload)`
- ⚠️ **VERIFICAR:** Se métodos estão usando nomes corretos de tabelas/colunas

✅ `bankAccountsService.js` - [src/services/bankAccountsService.js](src/services/bankAccountsService.js:12616)

- ✅ `getBankAccounts(unitId, includeInactive)`
- ✅ `createBankAccount(data)`
- ✅ `updateBankAccount(id, data)`
- ✅ `deleteBankAccount(id)` (soft delete)
- ⚠️ **VERIFICAR:** Se métodos estão usando nomes corretos de tabelas/colunas

✅ `reconciliationService.js` - [src/services/reconciliationService.js](src/services/reconciliationService.js:36254)

- ✅ `getReconciliations(filters)`
- ✅ `getMatches(accountId)`
- ✅ `autoMatch(params)`
- ✅ `confirmReconciliation(...)`
- ✅ `rejectReconciliation(id)`
- ✅ `manualLink(params)`
- ⚠️ **VERIFICAR:** Se métodos estão usando nomes corretos de tabelas/colunas

---

### 4. 🧪 Testes

**❌ Nenhum teste implementado**

Arquivos de teste que devem ser criados:

- `src/services/__tests__/reconciliationService.spec.js`
- `src/hooks/__tests__/useReconciliationMatches.spec.js`
- `src/components/__tests__/ReconciliationMatchCard.spec.jsx`

---

### 5. 📚 Documentação para Usuário

**❌ Manual do usuário não existe**

Criar:

- `docs/manual-conciliacao.md` - Manual de uso da conciliação
- Screenshots e GIFs explicativos
- Vídeo tutorial (opcional)

---

## 🎯 Plano de Ativação

### Fase 1: Banco de Dados (CRÍTICO) 🔴

**Prioridade:** ALTA
**Estimativa:** 2-3 horas
**Responsável:** Backend/DBA

**Tarefas:**

1. [ ] Criar arquivo `db/migrations/create_bank_accounts.sql`
2. [ ] Criar arquivo `db/migrations/create_bank_statements.sql`
3. [ ] Criar arquivo `db/migrations/create_reconciliations.sql`
4. [ ] Criar arquivo `db/migrations/create_reconciliation_triggers.sql`
5. [ ] Criar arquivo `db/migrations/create_reconciliation_views.sql`
6. [ ] Executar migrations no Supabase
7. [ ] Validar RLS policies
8. [ ] Testar triggers

**Script de execução:**

```bash
# No Supabase SQL Editor, executar em ordem:
# 1. create_bank_accounts.sql
# 2. create_bank_statements.sql
# 3. create_reconciliations.sql
# 4. create_reconciliation_triggers.sql
# 5. create_reconciliation_views.sql
```

### Fase 2: Validação de Serviços 🟡

**Prioridade:** MÉDIA
**Estimativa:** 1-2 horas
**Responsável:** Backend

**Tarefas:**

1. [ ] Abrir `src/services/bankStatementsService.js`
2. [ ] Verificar se queries usam `bank_statements` (não `receitas` ou `despesas`)
3. [ ] Validar campos: `bank_account_id`, `transaction_date`, `amount`, `type`
4. [ ] Testar método `importStatements()` com arquivo CSV real
5. [ ] Abrir `src/services/bankAccountsService.js`
6. [ ] Validar campos: `unit_id`, `bank_name`, `account_type`, `agency`, `account_number`
7. [ ] Testar CRUD completo
8. [ ] Abrir `src/services/reconciliationService.js`
9. [ ] Validar campos: `statement_id`, `reference_type`, `reference_id`
10. [ ] Testar `autoMatch()` com dados reais
11. [ ] Testar `confirmReconciliation()`

### Fase 3: Exports e Integrações 🟢

**Prioridade:** BAIXA
**Estimativa:** 15 minutos
**Responsável:** Frontend

**Tarefas:**

1. [ ] Editar `src/services/index.js`
2. [ ] Adicionar exports de `bankStatementsService` e `ReconciliationService`
3. [ ] Validar imports em componentes

### Fase 4: Teste End-to-End 🔵

**Prioridade:** ALTA
**Estimativa:** 2 horas
**Responsável:** QA/Dev

**Tarefas:**

1. [ ] Acessar página `FinanceiroAdvancedPage`
2. [ ] Selecionar unidade
3. [ ] Ir para tab "Conciliação"
4. [ ] Criar conta bancária (se não existir)
5. [ ] Importar extrato CSV de teste
6. [ ] Executar auto-match
7. [ ] Confirmar matches encontrados
8. [ ] Testar vinculação manual
9. [ ] Validar estatísticas
10. [ ] Verificar histórico de conciliações

### Fase 5: Documentação 📖

**Prioridade:** MÉDIA
**Estimativa:** 3 horas
**Responsável:** Tech Writer/Dev

**Tarefas:**

1. [ ] Criar `docs/manual-conciliacao.md`
2. [ ] Screenshots de cada etapa
3. [ ] Vídeo tutorial (5-10 min)
4. [ ] Publicar na wiki

---

## 📋 Checklist de Ativação

### Pré-requisitos

- [ ] Tabela `units` existe e está populada
- [ ] Tabela `revenues` existe e tem dados
- [ ] Tabela `expenses` existe e tem dados
- [ ] Tabela `parties` existe (para nomes de clientes/fornecedores)
- [ ] Auth (Supabase) está funcionando

### Banco de Dados

- [ ] Tabela `bank_accounts` criada
- [ ] Tabela `bank_statements` criada
- [ ] Tabela `reconciliations` criada
- [ ] Triggers criados e testados
- [ ] Views criadas
- [ ] RLS policies aplicadas e testadas
- [ ] Índices criados

### Serviços

- [ ] `bankAccountsService` validado
- [ ] `bankStatementsService` validado
- [ ] `reconciliationService` validado
- [ ] Exports adicionados em `index.js`

### Frontend

- [ ] ConciliacaoTab carrega sem erros
- [ ] ConciliacaoPanel renderiza
- [ ] Filtros funcionam
- [ ] Importação de extrato funciona
- [ ] Auto-match funciona
- [ ] Confirmação de match funciona
- [ ] Vinculação manual funciona
- [ ] Estatísticas são exibidas corretamente

### Testes

- [ ] Teste de importação de CSV
- [ ] Teste de auto-matching
- [ ] Teste de confirmação
- [ ] Teste de rejeição
- [ ] Teste de vinculação manual
- [ ] Teste de estatísticas

### Documentação

- [ ] Manual do usuário criado
- [ ] Screenshots adicionados
- [ ] Vídeo tutorial gravado (opcional)
- [ ] README atualizado

---

## 🚀 Comandos Rápidos

### Criar migrations

```bash
# Criar arquivos de migration
touch db/migrations/001_create_bank_accounts.sql
touch db/migrations/002_create_bank_statements.sql
touch db/migrations/003_create_reconciliations.sql
touch db/migrations/004_create_triggers.sql
touch db/migrations/005_create_views.sql
```

### Executar no Supabase

```sql
-- Copiar e colar no Supabase SQL Editor
-- Executar um por vez para verificar erros
```

### Testar serviços no console

```javascript
// No DevTools Console
import { bankAccountsService } from './services';

// Testar criação de conta
const account = await bankAccountsService.createBankAccount({
  unit_id: 'sua-unit-id',
  bank_name: 'Itaú',
  account_type: 'Corrente',
  agency: '1234',
  account_number: '56789-0',
  nickname: 'Conta Principal',
});

console.log('Conta criada:', account);
```

---

## 🎓 Recursos Adicionais

### Tutoriais Recomendados

- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- [Testing React Hooks](https://react-hooks-testing-library.com/)

### Ferramentas Úteis

- [Supabase Dashboard](https://app.supabase.com/)
- [Postman](https://www.postman.com/) - Para testar APIs
- [DB Diagram](https://dbdiagram.io/) - Para visualizar ERD

---

## ✅ Resumo

**Total de itens faltando:** 14
**Críticos (bloqueantes):** 6 (banco de dados)
**Importantes:** 4 (validações de serviço)
**Nice to have:** 4 (testes e docs)

**Tempo estimado total:** 8-10 horas

**Próximo passo recomendado:** Começar pela Fase 1 (Banco de Dados) - sem as tabelas, nada funciona.

---

**Data:** 21/10/2025
**Analista:** Claude AI
**Status:** ✅ Análise Completa
