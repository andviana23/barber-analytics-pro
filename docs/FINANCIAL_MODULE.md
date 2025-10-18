# 💰 MÓDULO FINANCEIRO - DOCUMENTAÇÃO COMPLETA

> **Sistema Financeiro Avançado com Contabilidade por Competência, Conciliação Bancária e DRE Automatizada**
>
> **Atualizado em:** 2024-10-17 via Supabase MCP

---

## 🎯 Visão Geral

O **Módulo Financeiro** é o core do BARBER-ANALYTICS-PRO, implementando um sistema completo de gestão financeira com:

- 📊 **Contabilidade por Competência** (Accrual Accounting)
- 🏦 **Conciliação Bancária Automática**
- 📈 **DRE (Demonstração de Resultado)** automatizada
- 💸 **Fluxo de Caixa** projetado e realizado
- 👥 **Gestão de Terceiros** (Clientes/Fornecedores)

> **Nota:** O Calendário Financeiro foi removido do sistema conforme decisão arquitetural.

---

## 🏗️ Clean Architecture Implementation

### **Repository Pattern**

```javascript
// src/repositories/revenueRepository.js
class RevenueRepository {
  async create(data) {
    // Sanitização com whitelist/blacklist
    const sanitizedData = this.sanitizeFields(data);
    const { data: result, error } = await supabase
      .from('revenues')
      .insert(sanitizedData)
      .select()
      .single();

    return { data: result, error };
  }

  async findAll(filters, page, limit) {
    // Query builder com filtros otimizados
    let query = supabase.from('revenues').select('*', { count: 'exact' });

    // Aplicar filtros dinamicamente
    if (filters.unit_id) query = query.eq('unit_id', filters.unit_id);
    if (filters.start_date) query = query.gte('date', filters.start_date);
    if (filters.end_date) query = query.lte('date', filters.end_date);

    return await query.range((page - 1) * limit, page * limit - 1);
  }
}
```

### **Service Layer (Business Logic)**

```javascript
// src/services/financeiroService.js
class FinanceiroService {
  async createReceita(receitaData) {
    // PASSO 1: Validação com DTO
    const validation = CreateRevenueDTO.validate(receitaData);
    if (!validation.isValid) {
      return { data: null, error: validation.errors };
    }

    // PASSO 2: Aplicar regras de negócio
    const businessData = this.applyBusinessRules(validation.data);

    // PASSO 3: Calcular campos derivados
    const enrichedData = this.calculateDerivedFields(businessData);

    // PASSO 4: Delegar ao Repository
    const { data, error } = await revenueRepository.create(enrichedData);

    // PASSO 5: Retornar DTO de resposta
    return {
      data: data ? new RevenueResponseDTO(data) : null,
      error,
    };
  }
}
```

### **DTO Pattern (Data Transfer Objects)**

```javascript
// src/dtos/revenueDTO.js
export class CreateRevenueDTO {
  static ALLOWED_FIELDS = [
    'unit_id',
    'type',
    'source',
    'value',
    'date',
    'party_id',
    'account_id',
    'observations',
    'accrual_start_date',
    'accrual_end_date',
    'expected_receipt_date',
    'gross_amount',
    'fees',
    'net_amount',
  ];

  static FORBIDDEN_FIELDS = [
    'id',
    'created_at',
    'updated_at',
    'user_id',
    'status',
    'actual_receipt_date', // Campos calculados/sistema
  ];

  static validate(data) {
    const errors = [];

    // Validação de valor
    if (!data.value || data.value <= 0) {
      errors.push('Valor deve ser positivo');
    }

    // Validação de competência
    if (data.accrual_start_date && data.accrual_end_date) {
      if (new Date(data.accrual_start_date) > new Date(data.accrual_end_date)) {
        errors.push('Data inicial não pode ser maior que final');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: this.sanitize(data),
    };
  }
}
```

---

## 📊 Estrutura do Banco de Dados

> **Atualizado em:** 2024-10-17 via Supabase MCP

### **Tabelas Principais**

#### **revenues** (Receitas)

```sql
CREATE TABLE revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type income_type NOT NULL, -- 'service', 'product', 'commission', 'other'
  value NUMERIC NOT NULL CHECK (value > 0 AND value <= 999999.99),
  date DATE NOT NULL DEFAULT CURRENT_DATE CHECK (date <= CURRENT_DATE + 1 year),

  -- Multi-tenant e Relacionamentos
  unit_id UUID REFERENCES units(id),
  account_id UUID REFERENCES bank_accounts(id),
  professional_id UUID REFERENCES professionals(id),
  user_id UUID REFERENCES auth.users(id),
  party_id UUID REFERENCES parties(id),

  -- Contabilidade por Competência
  accrual_start_date DATE,
  accrual_end_date DATE,
  expected_receipt_date DATE,
  actual_receipt_date DATE,

  -- Valores Bruto/Líquido
  gross_amount NUMERIC CHECK (gross_amount > 0),
  fees NUMERIC DEFAULT 0.00 CHECK (fees >= 0),
  net_amount NUMERIC CHECK (net_amount > 0),

  -- Status e Metadados
  status transaction_status DEFAULT 'Pending',
  source TEXT,
  observations TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **expenses** (Despesas)

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type expense_type NOT NULL, -- 'rent', 'salary', 'supplies', 'utilities', 'other'
  value NUMERIC NOT NULL CHECK (value > 0 AND value <= 999999.99),
  date DATE NOT NULL DEFAULT CURRENT_DATE CHECK (date <= CURRENT_DATE + 1 year),

  -- Multi-tenant e Relacionamentos
  unit_id UUID REFERENCES units(id),
  account_id UUID REFERENCES bank_accounts(id),
  party_id UUID REFERENCES parties(id),
  user_id UUID REFERENCES auth.users(id),

  -- Contabilidade por Competência
  expected_payment_date DATE,
  actual_payment_date DATE,

  -- Status e Metadados
  status transaction_status DEFAULT 'Pending',
  description TEXT,
  observations TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **parties** (Terceiros)

```sql
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id),
  nome VARCHAR NOT NULL CHECK (char_length(nome) >= 3),
  tipo party_type NOT NULL, -- 'Cliente', 'Fornecedor'
  cpf_cnpj VARCHAR CHECK (char_length(cpf_cnpj) IN (11, 14)),
  telefone VARCHAR,
  email VARCHAR CHECK (email ~* '^\\S+@\\S+\\.\\S+$'),
  endereco TEXT,
  observacoes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **bank_accounts** (Contas Bancárias)

```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id),
  name VARCHAR NOT NULL CHECK (char_length(name) >= 3),
  bank_name VARCHAR NOT NULL,
  agency VARCHAR CHECK (agency ~ '^[\\d-]+$'),
  account_number VARCHAR CHECK (account_number ~ '^[\\d-]+$'),
  nickname VARCHAR,
  initial_balance NUMERIC DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **payment_methods** (Métodos de Pagamento)

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id),
  created_by UUID REFERENCES auth.users(id),
  name VARCHAR NOT NULL CHECK (char_length(name) >= 3),
  fee_percentage NUMERIC DEFAULT 0.00 CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
  receipt_days INTEGER DEFAULT 0 CHECK (receipt_days >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### **Views Otimizadas**

#### **vw_calendar_events** (Eventos do Calendário)

```sql
CREATE VIEW vw_calendar_events AS
-- Recebimentos Esperados
SELECT
    r.id,
    'Receive' AS tipo,
    CASE
        WHEN r.status = 'Overdue' THEN 'Overdue'
        ELSE 'Expected'
    END AS status,
    r.expected_receipt_date AS event_date,
    COALESCE(p.nome, r.source, 'Revenue') AS title,
    COALESCE(r.net_amount, r.value) AS amount,
    r.unit_id, r.account_id, r.party_id,
    'Revenue' AS ref_type, r.id AS ref_id,
    r.status::TEXT AS transaction_status,
    r.type::TEXT AS category
FROM revenues r
LEFT JOIN parties p ON p.id = r.party_id
WHERE r.actual_receipt_date IS NULL
  AND r.status NOT IN ('Cancelled', 'Received')

UNION ALL

-- Recebimentos Efetivos
SELECT
    r.id, 'Receive' AS tipo, 'Effective' AS status,
    r.actual_receipt_date AS event_date,
    COALESCE(p.nome, r.source, 'Revenue') AS title,
    COALESCE(r.net_amount, r.value) AS amount,
    r.unit_id, r.account_id, r.party_id,
    'Revenue' AS ref_type, r.id AS ref_id,
    r.status::TEXT AS transaction_status,
    r.type::TEXT AS category
FROM revenues r
LEFT JOIN parties p ON p.id = r.party_id
WHERE r.actual_receipt_date IS NOT NULL
  AND r.status = 'Received'

UNION ALL

-- Pagamentos (Despesas)
SELECT
    e.id, 'Pay' AS tipo,
    CASE
        WHEN e.status = 'Overdue' THEN 'Overdue'
        WHEN e.actual_payment_date IS NOT NULL THEN 'Effective'
        ELSE 'Expected'
    END AS status,
    COALESCE(e.actual_payment_date, e.expected_payment_date) AS event_date,
    COALESCE(p.nome, e.description, 'Expense') AS title,
    e.value AS amount,
    e.unit_id, e.account_id, e.party_id,
    'Expense' AS ref_type, e.id AS ref_id,
    e.status::TEXT AS transaction_status,
    e.type::TEXT AS category
FROM expenses e
LEFT JOIN parties p ON p.id = e.party_id
WHERE (e.actual_payment_date IS NULL AND e.status NOT IN ('Cancelled', 'Paid'))
   OR (e.actual_payment_date IS NOT NULL AND e.status = 'Paid')
ORDER BY event_date DESC;
```

#### **vw_cashflow_entries** (Entradas de Fluxo de Caixa)

```sql
CREATE VIEW vw_cashflow_entries AS
-- Receitas
SELECT
    r.id AS transaction_id,
    'Revenue' AS transaction_type,
    r.unit_id, r.account_id,
    COALESCE(r.actual_receipt_date, r.expected_receipt_date, r.date) AS transaction_date,
    r.source AS description,
    r.value AS inflows,
    0.00 AS outflows,
    r.value AS daily_balance,
    r.status
FROM revenues r
WHERE r.is_active = true

UNION ALL

-- Despesas
SELECT
    e.id AS transaction_id,
    'Expense' AS transaction_type,
    e.unit_id, e.account_id,
    COALESCE(e.actual_payment_date, e.expected_payment_date, e.date) AS transaction_date,
    e.description,
    0.00 AS inflows,
    e.value AS outflows,
    (-e.value) AS daily_balance,
    e.status
FROM expenses e
WHERE e.is_active = true
ORDER BY transaction_date, transaction_type;
```

#### **vw_dashboard_financials** (Métricas do Dashboard)

```sql
CREATE VIEW vw_dashboard_financials AS
SELECT
    unit_id,
    date_trunc('month', date::timestamp) AS period,
    SUM(value) AS total_revenue,
    SUM(net_amount) AS total_net_revenue,
    SUM(fees) AS total_fees,
    SUM(CASE WHEN status = 'Received' THEN value ELSE 0 END) AS received_revenue,
    SUM(CASE WHEN status = 'Pending' THEN value ELSE 0 END) AS pending_revenue,
    SUM(CASE WHEN status = 'Overdue' THEN value ELSE 0 END) AS overdue_revenue,
    COUNT(*) AS total_transactions,
    COUNT(CASE WHEN status = 'Received' THEN 1 END) AS received_count,
    COUNT(CASE WHEN status = 'Pending' THEN 1 END) AS pending_count
FROM revenues r
WHERE is_active = true
GROUP BY unit_id, date_trunc('month', date::timestamp);
```

#### **vw_reconciliation_summary** (Resumo de Conciliação)

```sql
CREATE VIEW vw_reconciliation_summary AS
SELECT
    ba.id AS account_id,
    ba.name AS account_name,
    ba.unit_id,
    date_trunc('month', bs.transaction_date::timestamp) AS period,
    COUNT(bs.id) AS total_statements,
    COUNT(CASE WHEN bs.reconciled = true THEN 1 END) AS total_reconciled,
    COUNT(CASE WHEN bs.reconciled = false THEN 1 END) AS total_pending,
    SUM(bs.amount) AS total_amount,
    SUM(CASE WHEN bs.reconciled = true THEN bs.amount ELSE 0 END) AS reconciled_amount,
    SUM(CASE WHEN bs.reconciled = false THEN bs.amount ELSE 0 END) AS pending_amount,
    SUM(COALESCE(rec.difference, 0)) AS divergent_amount
FROM bank_accounts ba
LEFT JOIN bank_statements bs ON bs.bank_account_id = ba.id
LEFT JOIN reconciliations rec ON rec.bank_statement_id = bs.id
WHERE ba.is_active = true
GROUP BY ba.id, ba.name, ba.unit_id, date_trunc('month', bs.transaction_date::timestamp);
```

### **ENUMs Definidos**

```sql
-- Tipos de Receita
CREATE TYPE income_type AS ENUM ('service', 'product', 'commission', 'other');

-- Tipos de Despesa
CREATE TYPE expense_type AS ENUM ('rent', 'salary', 'supplies', 'utilities', 'other');

-- Status de Transação
CREATE TYPE transaction_status AS ENUM ('Pending', 'Partial', 'Received', 'Paid', 'Cancelled', 'Overdue');

-- Tipos de Terceiros
CREATE TYPE party_type AS ENUM ('Cliente', 'Fornecedor');

-- Tipos de Transação Bancária
CREATE TYPE bank_transaction_type AS ENUM ('Credit', 'Debit');
```

ORDER BY month DESC;

````

### **Functions e Triggers**

#### **calculate_revenue_status()** (Trigger Function)
```sql
CREATE OR REPLACE FUNCTION calculate_revenue_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se tem data de recebimento efetivo, está Received
  IF NEW.actual_receipt_date IS NOT NULL THEN
    NEW.status := 'Received';

  -- Se está Pending e passou da data prevista, marca como Overdue
  ELSIF NEW.status = 'Pending' AND NEW.expected_receipt_date < CURRENT_DATE THEN
    NEW.status := 'Overdue';

  -- Se não tem status, define como Pending
  ELSIF NEW.status IS NULL THEN
    NEW.status := 'Pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
CREATE TRIGGER trigger_calculate_revenue_status
  BEFORE INSERT OR UPDATE ON revenues
  FOR EACH ROW EXECUTE FUNCTION calculate_revenue_status();
````

---

## ⚙️ Services Implementados

### **1. financeiroService.js** (Core)

```javascript
// Métodos principais
class FinanceiroService {
  // CRUD Receitas
  async getReceitas(filters = {}, page = 1, limit = 50) // Lista com paginação
  async createReceita(receitaData)                      // Criação com DTO
  async getReceitaById(id)                             // Busca por ID
  async updateReceita(id, updateData)                  // Atualização
  async deleteReceita(id)                              // Soft delete

  // Análises e Relatórios
  async getReceitasByPeriod(params)                    // Por período
  async countReceitas(filters = {})                    // Contagem
}
```

### **2. cashflowService.js** (Fluxo de Caixa)

```javascript
class CashflowService {
  async getCashflowEntries(unitId, startDate, endDate, accountId = null) {
    // Usar view vw_cashflow_entries para dados em tempo real
    const { data, error } = await supabase
      .from('vw_cashflow_entries')
      .select('*')
      .eq('unit_id', unitId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: true });

    return { data, error };
  }

  async getCashflowSummary(unitId, period = 'month') {
    // Agregações por período
    const groupBy = period === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';

    const { data, error } = await supabase.rpc('get_cashflow_summary', {
      p_unit_id: unitId,
      p_group_by: groupBy,
    });

    return { data, error };
  }
}
```

### **3. calendarService.js** (Calendário Financeiro)

```javascript
class CalendarService {
  async getCalendarEvents(unitId, startDate, endDate, filters = {}) {
    // Usar view vw_calendar_events que unifica:
    // - Recebimentos esperados/efetivos
    // - Pagamentos esperados/efetivos

    let query = supabase
      .from('vw_calendar_events')
      .select('*')
      .eq('unit_id', unitId)
      .gte('event_date', startDate)
      .lte('event_date', endDate);

    if (filters.tipo) query = query.eq('tipo', filters.tipo);
    if (filters.status) query = query.eq('status', filters.status);

    return await query.order('event_date', { ascending: true });
  }

  async updateEventStatus(id, refType, status) {
    // Atualizar status na tabela original (revenues/expenses)
    const table = refType === 'Revenue' ? 'revenues' : 'expenses';
    const dateField =
      refType === 'Revenue' ? 'actual_receipt_date' : 'actual_payment_date';

    const updateData = {
      status: status,
      [dateField]:
        status === 'Received' || status === 'Paid'
          ? new Date().toISOString().split('T')[0]
          : null,
    };

    return await supabase.from(table).update(updateData).eq('id', id);
  }
}
```

### **4. reconciliationService.js** (Conciliação Bancária)

```javascript
class ReconciliationService {
  async autoMatch(accountId, options = {}) {
    // Algoritmo de correspondência automática
    const tolerance = options.tolerance || 0.01; // R$ 0,01
    const dateTolerance = options.dateTolerance || 3; // 3 dias

    // Buscar extratos não conciliados
    const { data: statements } = await supabase
      .from('bank_statements')
      .select('*')
      .eq('bank_account_id', accountId)
      .eq('reconciled', false);

    // Buscar receitas/despesas pendentes
    const { data: transactions } = await this.getPendingTransactions(accountId);

    const matches = [];

    for (const statement of statements) {
      const match = transactions.find(transaction => {
        const amountMatch =
          Math.abs(statement.amount - transaction.amount) <= tolerance;
        const dateMatch =
          Math.abs(
            new Date(statement.transaction_date) -
              new Date(transaction.expected_date)
          ) <=
          dateTolerance * 24 * 60 * 60 * 1000;

        return amountMatch && dateMatch;
      });

      if (match) {
        matches.push({
          statement_id: statement.id,
          reference_type: match.type, // 'Revenue' or 'Expense'
          reference_id: match.id,
          match_confidence: this.calculateConfidence(statement, match),
        });
      }
    }

    return { matches, error: null };
  }

  async confirmReconciliation(reconciliationId) {
    // Confirmar reconciliação e atualizar status
    const { error } = await supabase
      .from('reconciliations')
      .update({ status: 'Reconciled' })
      .eq('id', reconciliationId);

    return { success: !error, error };
  }
}
```

### **5. partiesService.js** (Terceiros)

```javascript
class PartiesService {
  async createParty(data) {
    // Validação de CPF/CNPJ
    if (data.cpf_cnpj) {
      const isValid =
        data.tipo === 'pessoa_fisica'
          ? this.validateCPF(data.cpf_cnpj)
          : this.validateCNPJ(data.cpf_cnpj);

      if (!isValid) {
        return { data: null, error: 'CPF/CNPJ inválido' };
      }
    }

    // Formatação de telefone
    if (data.telefone) {
      data.telefone = this.formatPhone(data.telefone);
    }

    return await supabase.from('parties').insert(data).select().single();
  }

  validateCPF(cpf) {
    // Algoritmo de validação CPF
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;

    // Verificação de dígitos
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    // Segundo dígito
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    return digit === parseInt(cpf.charAt(10));
  }
}
```

---

## 🎨 Componentes Frontend

### **Atomic Design Structure**

#### **Atoms** (Elementos Básicos)

```javascript
// src/atoms/Input/Input.jsx
export const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  mask,
  ...props
}) => {
  const handleChange = e => {
    let val = e.target.value;

    // Aplicar máscara se fornecida
    if (mask === 'currency') {
      val = formatCurrency(val);
    } else if (mask === 'date') {
      val = formatDate(val);
    }

    onChange?.(val);
  };

  return (
    <div className="form-field">
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};
```

#### **Molecules** (Composições)

```javascript
// src/molecules/KPICard/KPICard.jsx
export const KPICard = ({
  title,
  value,
  trend,
  icon,
  color = 'blue',
  loading = false,
}) => {
  if (loading) {
    return <KPICardSkeleton />;
  }

  return (
    <Card className={`kpi-card kpi-card--${color}`}>
      <div className="kpi-card__header">
        <Icon name={icon} className="kpi-card__icon" />
        <span className="kpi-card__title">{title}</span>
      </div>

      <div className="kpi-card__content">
        <span className="kpi-card__value">{formatCurrency(value)}</span>

        {trend && (
          <div
            className={`kpi-card__trend kpi-card__trend--${trend.direction}`}
          >
            <Icon
              name={trend.direction === 'up' ? 'trending-up' : 'trending-down'}
            />
            <span>{trend.percentage}%</span>
          </div>
        )}
      </div>
    </Card>
  );
};
```

#### **Organisms** (Estruturas Complexas)

```javascript
// src/organisms/FinancialDashboard/FinancialDashboard.jsx
export const FinancialDashboard = ({ unitId, period }) => {
  const { data: kpis, loading } = useFinancialKPIs(unitId, period);
  const { data: cashflow } = useCashflow(unitId, period);
  const { data: dre } = useDRE(unitId, period);

  return (
    <div className="financial-dashboard">
      {/* KPIs Row */}
      <div className="kpi-row">
        <KPICard
          title="Receitas"
          value={kpis?.totalRevenues}
          trend={kpis?.revenuesTrend}
          icon="dollar-sign"
          color="green"
          loading={loading}
        />
        <KPICard
          title="Despesas"
          value={kpis?.totalExpenses}
          trend={kpis?.expensesTrend}
          icon="credit-card"
          color="red"
          loading={loading}
        />
        <KPICard
          title="Lucro Líquido"
          value={kpis?.netProfit}
          trend={kpis?.profitTrend}
          icon="trending-up"
          color="blue"
          loading={loading}
        />
        <KPICard
          title="Margem"
          value={`${kpis?.profitMargin}%`}
          trend={kpis?.marginTrend}
          icon="percent"
          color="purple"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <Card className="chart-card">
          <CardHeader>
            <h3>Fluxo de Caixa</h3>
          </CardHeader>
          <CardContent>
            <CashflowChart data={cashflow} />
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader>
            <h3>DRE Mensal</h3>
          </CardHeader>
          <CardContent>
            <DREChart data={dre} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

#### **Templates** (Layouts)

```javascript
// src/templates/FinancialLayout/FinancialLayout.jsx
export const FinancialLayout = ({ children, activeTab }) => {
  const { user } = useAuth();
  const { currentUnit } = useUnits();

  return (
    <div className="financial-layout">
      <header className="financial-header">
        <div className="header-content">
          <h1>Módulo Financeiro</h1>
          <div className="header-meta">
            <UnitSelector current={currentUnit} />
            <UserMenu user={user} />
          </div>
        </div>

        <nav className="financial-nav">
          <NavTabs
            activeTab={activeTab}
            tabs={[
              { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart' },
              { id: 'receitas', label: 'Receitas', icon: 'dollar-sign' },
              { id: 'despesas', label: 'Despesas', icon: 'credit-card' },
              { id: 'calendar', label: 'Calendário', icon: 'calendar' },
              { id: 'reports', label: 'Relatórios', icon: 'file-text' },
            ]}
          />
        </nav>
      </header>

      <main className="financial-content">{children}</main>
    </div>
  );
};
```

---

## Custom Hooks

### **useReceitas** (Gestão de Estado)

```javascript
// src/hooks/useReceitas.js
export const useReceitas = (filters = {}, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });

  const fetchReceitas = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const result = await financeiroService.getReceitas(
          filters,
          page,
          pagination.limit
        );

        if (result.error) {
          setError(result.error);
          return;
        }

        setData(result.data);
        setPagination(prev => ({
          ...prev,
          page,
          total: result.count,
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  // Auto-fetch quando filtros mudam
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchReceitas(1);
    }
  }, [fetchReceitas, options.autoFetch]);

  const createReceita = useCallback(async data => {
    const result = await financeiroService.createReceita(data);
    if (result.data) {
      // Atualizar lista local
      setData(prev => [result.data, ...prev]);
    }
    return result;
  }, []);

  const updateReceita = useCallback(async (id, data) => {
    const result = await financeiroService.updateReceita(id, data);
    if (result.data) {
      setData(prev => prev.map(item => (item.id === id ? result.data : item)));
    }
    return result;
  }, []);

  const deleteReceita = useCallback(async id => {
    const result = await financeiroService.deleteReceita(id);
    if (result.success) {
      setData(prev => prev.filter(item => item.id !== id));
    }
    return result;
  }, []);

  return {
    // Estado
    data,
    loading,
    error,
    pagination,

    // Ações
    refetch: fetchReceitas,
    createReceita,
    updateReceita,
    deleteReceita,

    // Utilitários
    hasData: data.length > 0,
    isEmpty: !loading && data.length === 0,
    hasError: !!error,
  };
};
```

### **useFinancialKPIs** (Métricas)

```javascript
// src/hooks/useFinancialKPIs.js
export const useFinancialKPIs = (unitId, period) => {
  return useQuery({
    queryKey: ['financial-kpis', unitId, period],
    queryFn: async () => {
      const { startDate, endDate } = calculatePeriodDates(period);

      // Buscar dados atuais
      const currentKPIs = await financeiroService.getKPIs({
        unit_id: unitId,
        start_date: startDate,
        end_date: endDate,
      });

      // Buscar dados do período anterior para comparação
      const { startDate: prevStart, endDate: prevEnd } = calculatePeriodDates(
        period,
        -1
      );

      const previousKPIs = await financeiroService.getKPIs({
        unit_id: unitId,
        start_date: prevStart,
        end_date: prevEnd,
      });

      // Calcular trends
      const trends = calculateTrends(currentKPIs, previousKPIs);

      return {
        ...currentKPIs,
        trends,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });
};

function calculateTrends(current, previous) {
  const calculateTrend = (currentValue, previousValue) => {
    if (!previousValue || previousValue === 0) return null;

    const change = ((currentValue - previousValue) / previousValue) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      direction: change >= 0 ? 'up' : 'down',
      value: change,
    };
  };

  return {
    revenuesTrend: calculateTrend(
      current.totalRevenues,
      previous.totalRevenues
    ),
    expensesTrend: calculateTrend(
      current.totalExpenses,
      previous.totalExpenses
    ),
    profitTrend: calculateTrend(current.netProfit, previous.netProfit),
    marginTrend: calculateTrend(current.profitMargin, previous.profitMargin),
  };
}
```

---

## 🔧 Configurações e Setup

### **Environment Variables**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Financial Module Settings
VITE_DEFAULT_CURRENCY=BRL
VITE_DEFAULT_LOCALE=pt-BR
VITE_AUTO_RECONCILIATION_THRESHOLD=0.01
VITE_CALENDAR_DAYS_AHEAD=90
VITE_CACHE_TTL=300000
```

### **Service Configuration**

```javascript
// src/config/financial.js
export const FINANCIAL_CONFIG = {
  // Paginação
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,

  // Conciliação
  AUTO_MATCH_TOLERANCE: 0.01, // R$ 0,01
  DATE_TOLERANCE_DAYS: 3,
  MIN_CONFIDENCE_SCORE: 0.85,

  // Calendário
  DEFAULT_CALENDAR_RANGE: 90, // dias
  EVENT_COLORS: {
    Receive: '#10B981', // green
    Pay: '#EF4444', // red
    Overdue: '#F59E0B', // amber
  },

  // Formatação
  CURRENCY_FORMAT: {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  },

  // Cache
  CACHE_DURATION: {
    KPIs: 5 * 60 * 1000, // 5 min
    Reports: 30 * 60 * 1000, // 30 min
    MasterData: 60 * 60 * 1000, // 1 hora
  },
};
```

---

## 🧪 Testes

### **Unit Tests (Service Layer)**

```javascript
// __tests__/services/financeiroService.test.js
describe('FinanceiroService', () => {
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    // Injetar mock
    financeiroService.repository = mockRepository;
  });

  describe('createReceita', () => {
    it('should validate and create receita successfully', async () => {
      // Arrange
      const receitaData = {
        unit_id: 'unit-123',
        type: 'service',
        value: 100.5,
        date: '2025-10-18',
      };

      const expectedDbData = {
        ...receitaData,
        gross_amount: 100.5,
        net_amount: 100.5,
        status: 'Pending',
      };

      mockRepository.create.mockResolvedValue({
        data: { id: 'receita-123', ...expectedDbData },
        error: null,
      });

      // Act
      const result = await financeiroService.createReceita(receitaData);

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeInstanceOf(RevenueResponseDTO);
      expect(result.data.id).toBe('receita-123');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining(expectedDbData)
      );
    });

    it('should reject invalid data', async () => {
      // Arrange
      const invalidData = {
        unit_id: 'unit-123',
        type: 'service',
        value: -100, // Valor negativo
        date: '2025-10-18',
      };

      // Act
      const result = await financeiroService.createReceita(invalidData);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toContain('Valor deve ser positivo');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });
});
```

### **Integration Tests**

```javascript
// __tests__/integration/financial-flow.test.js
describe('Financial Flow Integration', () => {
  beforeEach(async () => {
    await cleanupTestData();
    await seedTestData();
  });

  it('should complete full revenue creation and status calculation', async () => {
    // Arrange
    const receitaData = {
      unit_id: TEST_UNIT_ID,
      type: 'service',
      value: 150.0,
      expected_receipt_date: '2025-10-25',
    };

    // Act - Criar receita
    const createResult = await financeiroService.createReceita(receitaData);
    expect(createResult.error).toBeNull();

    const receitaId = createResult.data.id;

    // Verificar status inicial
    expect(createResult.data.status).toBe('Pending');

    // Act - Marcar como recebida
    const updateResult = await financeiroService.updateReceita(receitaId, {
      actual_receipt_date: '2025-10-20',
    });

    // Assert - Status deve mudar para Received
    expect(updateResult.data.status).toBe('Received');

    // Verificar se aparece no fluxo de caixa
    const cashflow = await cashflowService.getCashflowEntries(
      TEST_UNIT_ID,
      '2025-10-01',
      '2025-10-31'
    );

    const entry = cashflow.data.find(
      e => e.transaction_date === '2025-10-20' && e.inflows > 0
    );

    expect(entry).toBeDefined();
    expect(entry.inflows).toBe(150.0);
  });
});
```

---

## 🐛 Troubleshooting

### **Problemas Comuns**

#### **1. Receita não aparece no Dashboard**

```
Possíveis causas:
✓ RLS: Usuário não tem acesso à unidade
✓ Filtro: Data fora do período selecionado
✓ Status: Receita marcada como cancelada
✓ Cache: Dados em cache desatualizados

Solução:
1. Verificar permissões do usuário
2. Ajustar filtros de período
3. Verificar status da receita
4. Limpar cache ou forçar refresh
```

#### **2. Conciliação não encontra correspondências**

```
Possíveis causas:
✓ Tolerância: Valores muito diferentes
✓ Datas: Diferença de datas muito grande
✓ Formato: Dados do extrato malformados
✓ Status: Transações já conciliadas

Solução:
1. Ajustar tolerância de valores
2. Aumentar tolerância de datas
3. Validar formato do arquivo de extrato
4. Verificar transações pendentes
```

#### **3. Performance lenta em relatórios**

```
Possíveis causas:
✓ Volume: Muitos registros sem paginação
✓ Índices: Queries sem índices otimizados
✓ Views: Views complexas sem cache
✓ Frontend: Re-renders desnecessários

Solução:
1. Implementar paginação adequada
2. Adicionar índices compostos
3. Usar views materializadas
4. Otimizar componentes React
```

---

## 🏷️ Sistema de Categorias Hierárquicas

### **Visão Geral**

O sistema implementa categorização hierárquica para receitas e despesas, permitindo organização em dois níveis (categoria principal e subcategorias). Este recurso é essencial para:

- 📊 Relatórios detalhados por categoria
- 🎯 Análise de rentabilidade por tipo de serviço/produto
- 📈 DRE com quebra por categorias customizadas
- 🔍 Rastreamento de custos por centro de custo

### **Arquitetura**

#### **Camada de Dados**

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 2),
  description TEXT,
  category_type VARCHAR(20) NOT NULL CHECK (category_type IN ('Revenue', 'Expense')),
  parent_id UUID REFERENCES categories(id), -- Hierarquia
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de performance
CREATE INDEX idx_categories_unit_type ON categories(unit_id, category_type) WHERE is_active = true;
CREATE INDEX idx_categories_name_search ON categories(name);
CREATE INDEX idx_categories_parent ON categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_categories_active ON categories(unit_id, category_type, is_active);

-- Relacionamentos com transações
ALTER TABLE revenues ADD COLUMN category_id UUID REFERENCES categories(id);
ALTER TABLE expenses ADD COLUMN category_id UUID REFERENCES categories(id);
CREATE INDEX idx_revenues_category ON revenues(category_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
```

#### **Repository Pattern**

```javascript
// src/repositories/categoryRepository.js
export const categoryRepository = {
  /**
   * Buscar todas as categorias com filtros
   */
  async findAll(filters = {}) {
    let query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (filters.unit_id) query = query.eq('unit_id', filters.unit_id);
    if (filters.category_type)
      query = query.eq('category_type', filters.category_type);
    if (filters.parent_id !== undefined) {
      query =
        filters.parent_id === null
          ? query.is('parent_id', null)
          : query.eq('parent_id', filters.parent_id);
    }
    if (filters.is_active !== undefined)
      query = query.eq('is_active', filters.is_active);

    return await query;
  },

  /**
   * Construir árvore hierárquica
   */
  async findTree(unit_id, category_type) {
    const { data: categories, error } = await this.findAll({
      unit_id,
      category_type,
      is_active: true,
    });

    if (error) return { data: null, error };
    return { data: this.buildTree(categories), error: null };
  },

  /**
   * Transformar lista plana em estrutura de árvore
   */
  buildTree(categories) {
    const categoryMap = new Map();
    const roots = [];

    categories.forEach(cat =>
      categoryMap.set(cat.id, { ...cat, children: [] })
    );

    categories.forEach(cat => {
      const node = categoryMap.get(cat.id);
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },
};
```

#### **Service Layer (Regras de Negócio)**

```javascript
// src/services/categoriesService.js
export const categoriesService = {
  /**
   * Criar nova categoria com validações
   */
  async createCategory(categoryData) {
    // VALIDAÇÃO 1: DTO
    const validation = CreateCategoryDTO.validate(categoryData);
    if (!validation.isValid) {
      return { data: null, error: validation.errors.join(', ') };
    }

    // VALIDAÇÃO 2: Parent deve ser do mesmo tipo
    if (validation.data.parent_id) {
      const { data: parent } = await categoryRepository.findById(
        validation.data.parent_id
      );

      if (!parent) {
        return { data: null, error: 'Categoria pai não encontrada' };
      }

      if (parent.category_type !== validation.data.category_type) {
        return {
          data: null,
          error: 'Categoria pai deve ser do mesmo tipo (Receita/Despesa)',
        };
      }

      if (!parent.is_active) {
        return { data: null, error: 'Categoria pai deve estar ativa' };
      }

      if (parent.parent_id) {
        return {
          data: null,
          error: 'Apenas categorias principais podem ser pais',
        };
      }
    }

    // CRIAÇÃO
    return await categoryRepository.create(validation.data);
  },

  /**
   * Excluir categoria (soft delete) com validações
   */
  async deleteCategory(id) {
    // VALIDAÇÃO: Não pode excluir se tem subcategorias ativas
    const { data: subcategories } = await categoryRepository.findAll({
      parent_id: id,
      is_active: true,
    });

    if (subcategories && subcategories.length > 0) {
      return {
        data: null,
        error: 'Não é possível excluir categoria com subcategorias ativas',
      };
    }

    return await categoryRepository.delete(id);
  },
};
```

#### **Custom Hook (React)**

```javascript
// src/hooks/useCategories.js
export const useCategories = (
  unitId,
  category_type,
  includeInactive = false,
  enableCache = true
) => {
  const [state, setState] = useState({
    data: [],
    loading: true,
    error: null,
    stats: { total: 0, active: 0, inactive: 0, revenue: 0, expense: 0 },
  });

  // Cache de 5 minutos
  const CACHE_TTL = 5 * 60 * 1000;
  const cacheKey = `${unitId}-${category_type}`;

  useEffect(() => {
    fetchCategories();
  }, [unitId, category_type, includeInactive]);

  const fetchCategories = async () => {
    // Verificar cache
    if (enableCache) {
      const cached = cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setState(prev => ({ ...prev, ...cached.data, loading: false }));
        return;
      }
    }

    // Buscar do servidor
    setState(prev => ({ ...prev, loading: true, error: null }));

    const { data, error } = await categoriesService.getCategories({
      unit_id: unitId,
      category_type,
      is_active: includeInactive ? undefined : true,
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false, error }));
      return;
    }

    const stats = calculateStats(data);
    const newState = { data, stats, loading: false, error: null };

    setState(newState);
    if (enableCache) {
      cache[cacheKey] = { data: { data, stats }, timestamp: Date.now() };
    }
  };

  return {
    ...state,
    refetch: fetchCategories,
    createCategory: async data => {
      const result = await categoriesService.createCategory(data);
      if (!result.error) await fetchCategories();
      return result;
    },
    updateCategory: async (id, data) => {
      const result = await categoriesService.updateCategory(id, data);
      if (!result.error) await fetchCategories();
      return result;
    },
    deleteCategory: async id => {
      const result = await categoriesService.deleteCategory(id);
      if (!result.error) await fetchCategories();
      return result;
    },
  };
};
```

### **UI Components**

#### **CategoriesPage** (Página Principal)

**Features:**

- ✅ KPIs: Total, Receitas, Despesas
- ✅ Filtros: Busca por nome, tipo (All/Revenue/Expense), mostrar inativos
- ✅ Tabela hierárquica com indentação visual
- ✅ Ações: Criar, Editar, Excluir, Reativar
- ✅ Permissões: Apenas Admin e Gerente

```javascript
// src/pages/CategoriesPage/CategoriesPage.jsx
const CategoriesPage = () => {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();
  const { showToast } = useToast();

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    showInactive: false,
  });

  const {
    data,
    loading,
    error,
    stats,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories(
    selectedUnit?.id,
    filters.type === 'all' ? null : filters.type,
    filters.showInactive
  );

  // Filtrar categorias localmente
  const filteredCategories = useMemo(() => {
    return data.filter(cat =>
      cat.name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [data, filters.search]);

  // Organizar hierarquicamente
  const hierarchicalData = useMemo(() => {
    const main = filteredCategories.filter(c => !c.parent_id);
    const subs = filteredCategories.filter(c => c.parent_id);

    return main.flatMap(parent => [
      parent,
      ...subs.filter(s => s.parent_id === parent.id),
    ]);
  }, [filteredCategories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categorias</h1>
        {canManage && (
          <button onClick={() => setModalOpen(true)}>
            <Plus /> Nova Categoria
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total" value={stats.total} />
        <KPICard title="Receitas" value={stats.revenue} variant="success" />
        <KPICard title="Despesas" value={stats.expense} variant="danger" />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar categoria..."
          value={filters.search}
          onChange={e =>
            setFilters(prev => ({ ...prev, search: e.target.value }))
          }
        />
        <select
          value={filters.type}
          onChange={e =>
            setFilters(prev => ({ ...prev, type: e.target.value }))
          }
        >
          <option value="all">Todos os Tipos</option>
          <option value="Revenue">Receitas</option>
          <option value="Expense">Despesas</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={filters.showInactive}
            onChange={e =>
              setFilters(prev => ({ ...prev, showInactive: e.target.checked }))
            }
          />
          Mostrar inativos
        </label>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {hierarchicalData.map(category => (
            <CategoryRow
              key={category.id}
              category={category}
              isSubcategory={!!category.parent_id}
              onEdit={() => handleEdit(category)}
              onDelete={() => handleDelete(category.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

#### **CategoryModal** (Formulário)

```javascript
// src/molecules/CategoryModals/CategoryModal.jsx
const CategoryModal = ({ isOpen, onClose, category, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_type: 'Revenue',
    parent_id: null,
  });

  const { data: availableParents } = useCategories(
    selectedUnit?.id,
    formData.category_type,
    false // apenas ativos
  );

  // Filtrar apenas categorias principais
  const parentOptions = availableParents.filter(
    c => !c.parent_id && c.id !== category?.id
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          value={formData.name}
          placeholder="Nome da categoria *"
          required
        />

        <select
          name="category_type"
          value={formData.category_type}
          disabled={!!category} // Não pode alterar tipo ao editar
        >
          <option value="Revenue">Receita</option>
          <option value="Expense">Despesa</option>
        </select>

        <select name="parent_id" value={formData.parent_id || ''}>
          <option value="">Categoria Principal</option>
          {parentOptions.map(parent => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </select>

        <textarea
          name="description"
          value={formData.description}
          placeholder="Descrição (opcional)"
        />

        <button type="submit">Salvar</button>
      </form>
    </Modal>
  );
};
```

### **Queries Úteis**

#### **Relatório por Categoria**

```sql
-- DRE com categorias
SELECT
  c.name AS categoria,
  c.category_type AS tipo,
  COUNT(CASE WHEN r.id IS NOT NULL THEN 1 END) AS qtd_receitas,
  COALESCE(SUM(r.value), 0) AS total_receitas,
  COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) AS qtd_despesas,
  COALESCE(SUM(e.value), 0) AS total_despesas
FROM categories c
LEFT JOIN revenues r ON r.category_id = c.id AND r.is_active = true
LEFT JOIN expenses e ON e.category_id = c.id AND e.is_active = true
WHERE c.unit_id = 'uuid-unit' AND c.is_active = true
GROUP BY c.id, c.name, c.category_type
ORDER BY c.category_type, c.name;
```

#### **Hierarquia Completa**

```sql
-- Árvore de categorias com totalizadores
WITH RECURSIVE category_tree AS (
  -- Nível 1: Categorias principais
  SELECT
    id, name, parent_id, category_type,
    0 AS level,
    name AS path
  FROM categories
  WHERE parent_id IS NULL AND unit_id = 'uuid-unit' AND is_active = true

  UNION ALL

  -- Nível 2: Subcategorias
  SELECT
    c.id, c.name, c.parent_id, c.category_type,
    ct.level + 1,
    ct.path || ' > ' || c.name AS path
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
  WHERE c.is_active = true
)
SELECT
  ct.*,
  COUNT(r.id) AS revenue_count,
  COALESCE(SUM(r.value), 0) AS revenue_total,
  COUNT(e.id) AS expense_count,
  COALESCE(SUM(e.value), 0) AS expense_total
FROM category_tree ct
LEFT JOIN revenues r ON r.category_id = ct.id AND r.is_active = true
LEFT JOIN expenses e ON e.category_id = ct.id AND e.is_active = true
GROUP BY ct.id, ct.name, ct.parent_id, ct.category_type, ct.level, ct.path
ORDER BY ct.level, ct.name;
```

### **Casos de Uso**

#### **1. Categorização de Receitas**

**Exemplo:** Barbearia com múltiplos serviços

```
Receitas
├── Serviços
│   ├── Corte de Cabelo
│   ├── Barba
│   └── Penteado
├── Produtos
│   ├── Pomadas
│   ├── Shampoos
│   └── Cremes
└── Comissões
    ├── Comissão Barbeiro
    └── Comissão Gerente
```

#### **2. Categorização de Despesas**

```
Despesas
├── Fixas
│   ├── Aluguel
│   ├── Salários
│   └── Energia Elétrica
├── Variáveis
│   ├── Material de Consumo
│   ├── Marketing
│   └── Manutenção
└── Investimentos
    ├── Equipamentos
    └── Reformas
```

### **Integração com Formulários**

Para usar categorias nos formulários de receitas/despesas:

```javascript
// Em NovaReceitaModal.jsx
const { data: categories } = useCategories(selectedUnit?.id, 'Revenue', false);

<select name="category_id">
  <option value="">Selecione uma categoria</option>
  {categories
    .filter(c => !c.parent_id)
    .map(parent => (
      <optgroup key={parent.id} label={parent.name}>
        <option value={parent.id}>{parent.name}</option>
        {categories
          .filter(c => c.parent_id === parent.id)
          .map(sub => (
            <option key={sub.id} value={sub.id}>
              └─ {sub.name}
            </option>
          ))}
      </optgroup>
    ))}
</select>;
```

### **Benefícios**

✅ **Organização:** Estrutura clara de categorias e subcategorias  
✅ **Flexibilidade:** Cada unidade define suas próprias categorias  
✅ **Relatórios:** DRE e análises detalhadas por categoria  
✅ **Performance:** Índices otimizados para queries rápidas  
✅ **Validações:** Regras de negócio garantem consistência  
✅ **UI/UX:** Interface intuitiva com hierarquia visual

---

## 🚀 Roadmap

### **Próximas Features**

- [ ] **Integração Bancária** (Open Banking)
- [ ] **Previsão de Fluxo** (Machine Learning)
- [ ] **Orçamento Empresarial** (Budget Planning)
- [ ] **Centro de Custos** (Cost Centers)
- [ ] **Análise de Rentabilidade** por serviço/profissional
- [ ] **Dashboards Executivos** (Executive Reporting)

### **Melhorias Técnicas**

- [ ] **Event Sourcing** completo
- [ ] **CQRS** com commands/queries separados
- [ ] **Background Jobs** para processamento assíncrono
- [ ] **Audit Trail** completo
- [ ] **Performance Monitoring** (APM)
- [ ] **A/B Testing** framework

---

**🔗 Links Relacionados:**

- [Database Schema](./DATABASE_SCHEMA.md)
- [API Reference](./API_REFERENCE.md)
- [Testing Guide](./TESTING.md)

---

_Última atualização: 18/10/2025_
