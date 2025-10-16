# 💰 MÓDULO FINANCEIRO - DOCUMENTAÇÃO COMPLETA

> **Sistema Financeiro Avançado com Contabilidade por Competência, Conciliação Bancária e DRE Automatizada**

---

## 🎯 Visão Geral

O **Módulo Financeiro** é o core do BARBER-ANALYTICS-PRO, implementando um sistema completo de gestão financeira com:

- 📊 **Contabilidade por Competência** (Accrual Accounting)
- 🏦 **Conciliação Bancária Automática** 
- 📈 **DRE (Demonstração de Resultado)** automatizada
- 💸 **Fluxo de Caixa** projetado e realizado
- 📅 **Calendário Financeiro** inteligente
- 👥 **Gestão de Terceiros** (Clientes/Fornecedores)

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
    
    return await query.range(
      (page - 1) * limit, 
      page * limit - 1
    );
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
      error 
    };
  }
}
```

### **DTO Pattern (Data Transfer Objects)**
```javascript
// src/dtos/revenueDTO.js
export class CreateRevenueDTO {
  static ALLOWED_FIELDS = [
    'unit_id', 'type', 'source', 'value', 'date',
    'party_id', 'account_id', 'observations',
    'accrual_start_date', 'accrual_end_date',
    'expected_receipt_date', 'gross_amount',
    'fees', 'net_amount'
  ];
  
  static FORBIDDEN_FIELDS = [
    'id', 'created_at', 'updated_at', 'user_id',
    'status', 'actual_receipt_date', // Campos calculados/sistema
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
      data: this.sanitize(data)
    };
  }
}
```

---

## 📊 Estrutura do Banco de Dados

### **Tabelas Principais**

#### **revenues** (Receitas)
```sql
CREATE TABLE revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id),
  professional_id UUID REFERENCES professionals(id),
  type income_type NOT NULL, -- 'service', 'product', 'subscription'
  source TEXT,
  value NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Contabilidade por Competência
  accrual_start_date DATE,
  accrual_end_date DATE,
  expected_receipt_date DATE,
  actual_receipt_date DATE,
  
  -- Valores Bruto/Líquido
  gross_amount NUMERIC(15,2),
  fees NUMERIC(15,2) DEFAULT 0,
  net_amount NUMERIC(15,2),
  
  -- Terceiros e Contas
  party_id UUID REFERENCES parties(id),
  account_id UUID REFERENCES bank_accounts(id),
  
  -- Status Automático
  status transaction_status DEFAULT 'Pending',
  
  -- Metadados
  observations TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

#### **expenses** (Despesas)
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id),
  type expense_type NOT NULL,
  description TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Contabilidade por Competência
  accrual_start_date DATE,
  accrual_end_date DATE,
  expected_payment_date DATE,
  actual_payment_date DATE,
  
  -- Terceiros
  party_id UUID REFERENCES parties(id),
  
  -- Status Automático
  status transaction_status DEFAULT 'Pending',
  
  -- Metadados
  observations TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

### **Views Otimizadas**

#### **vw_monthly_dre** (DRE Mensal)
```sql
CREATE VIEW vw_monthly_dre AS
WITH revenues AS (
  SELECT 
    date_trunc('month', revenue_dt) AS month,
    SUM(amount) AS total_revenues
  FROM vw_revenues_detailed
  GROUP BY date_trunc('month', revenue_dt)
),
expenses AS (
  SELECT 
    date_trunc('month', expense_dt) AS month,
    SUM(amount) AS total_expenses
  FROM vw_expenses_detailed
  GROUP BY date_trunc('month', expense_dt)
)
SELECT 
  COALESCE(r.month, e.month) AS month,
  COALESCE(r.total_revenues, 0) AS total_revenues,
  COALESCE(e.total_expenses, 0) AS total_expenses,
  COALESCE(r.total_revenues, 0) - COALESCE(e.total_expenses, 0) AS net_profit,
  CASE 
    WHEN COALESCE(r.total_revenues, 0) > 0 
    THEN (COALESCE(r.total_revenues, 0) - COALESCE(e.total_expenses, 0)) / COALESCE(r.total_revenues, 0)
    ELSE NULL 
  END AS profit_margin
FROM revenues r
FULL JOIN expenses e ON r.month = e.month
ORDER BY month DESC;
```

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
```

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
      p_group_by: groupBy
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
    const dateField = refType === 'Revenue' 
      ? 'actual_receipt_date' 
      : 'actual_payment_date';
    
    const updateData = {
      status: status,
      [dateField]: status === 'Received' || status === 'Paid' 
        ? new Date().toISOString().split('T')[0] 
        : null
    };
    
    return await supabase
      .from(table)
      .update(updateData)
      .eq('id', id);
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
        const amountMatch = Math.abs(statement.amount - transaction.amount) <= tolerance;
        const dateMatch = Math.abs(
          new Date(statement.transaction_date) - new Date(transaction.expected_date)
        ) <= (dateTolerance * 24 * 60 * 60 * 1000);
        
        return amountMatch && dateMatch;
      });
      
      if (match) {
        matches.push({
          statement_id: statement.id,
          reference_type: match.type, // 'Revenue' or 'Expense'
          reference_id: match.id,
          match_confidence: this.calculateConfidence(statement, match)
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
      const isValid = data.tipo === 'pessoa_fisica' 
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
    
    return await supabase
      .from('parties')
      .insert(data)
      .select()
      .single();
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
  type = "text", 
  value, 
  onChange, 
  placeholder,
  error,
  mask,
  ...props 
}) => {
  const handleChange = (e) => {
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
  color = "blue",
  loading = false 
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
        <span className="kpi-card__value">
          {formatCurrency(value)}
        </span>
        
        {trend && (
          <div className={`kpi-card__trend kpi-card__trend--${trend.direction}`}>
            <Icon name={trend.direction === 'up' ? 'trending-up' : 'trending-down'} />
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
              { id: 'reports', label: 'Relatórios', icon: 'file-text' }
            ]}
          />
        </nav>
      </header>
      
      <main className="financial-content">
        {children}
      </main>
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
    total: 0
  });
  
  const fetchReceitas = useCallback(async (page = 1) => {
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
        total: result.count
      }));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);
  
  // Auto-fetch quando filtros mudam
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchReceitas(1);
    }
  }, [fetchReceitas, options.autoFetch]);
  
  const createReceita = useCallback(async (data) => {
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
      setData(prev => prev.map(item => 
        item.id === id ? result.data : item
      ));
    }
    return result;
  }, []);
  
  const deleteReceita = useCallback(async (id) => {
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
    hasError: !!error
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
        end_date: endDate
      });
      
      // Buscar dados do período anterior para comparação
      const { startDate: prevStart, endDate: prevEnd } = 
        calculatePeriodDates(period, -1);
      
      const previousKPIs = await financeiroService.getKPIs({
        unit_id: unitId,
        start_date: prevStart,
        end_date: prevEnd
      });
      
      // Calcular trends
      const trends = calculateTrends(currentKPIs, previousKPIs);
      
      return {
        ...currentKPIs,
        trends
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
      value: change
    };
  };
  
  return {
    revenuesTrend: calculateTrend(current.totalRevenues, previous.totalRevenues),
    expensesTrend: calculateTrend(current.totalExpenses, previous.totalExpenses),
    profitTrend: calculateTrend(current.netProfit, previous.netProfit),
    marginTrend: calculateTrend(current.profitMargin, previous.profitMargin)
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
    'Receive': '#10B981', // green
    'Pay': '#EF4444',     // red
    'Overdue': '#F59E0B'  // amber
  },
  
  // Formatação
  CURRENCY_FORMAT: {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  },
  
  // Cache
  CACHE_DURATION: {
    KPIs: 5 * 60 * 1000,      // 5 min
    Reports: 30 * 60 * 1000,   // 30 min
    MasterData: 60 * 60 * 1000 // 1 hora
  }
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
      softDelete: jest.fn()
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
        value: 100.50,
        date: '2025-10-18'
      };
      
      const expectedDbData = {
        ...receitaData,
        gross_amount: 100.50,
        net_amount: 100.50,
        status: 'Pending'
      };
      
      mockRepository.create.mockResolvedValue({
        data: { id: 'receita-123', ...expectedDbData },
        error: null
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
        date: '2025-10-18'
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
      value: 150.00,
      expected_receipt_date: '2025-10-25'
    };
    
    // Act - Criar receita
    const createResult = await financeiroService.createReceita(receitaData);
    expect(createResult.error).toBeNull();
    
    const receitaId = createResult.data.id;
    
    // Verificar status inicial
    expect(createResult.data.status).toBe('Pending');
    
    // Act - Marcar como recebida
    const updateResult = await financeiroService.updateReceita(receitaId, {
      actual_receipt_date: '2025-10-20'
    });
    
    // Assert - Status deve mudar para Received
    expect(updateResult.data.status).toBe('Received');
    
    // Verificar se aparece no fluxo de caixa
    const cashflow = await cashflowService.getCashflowEntries(
      TEST_UNIT_ID,
      '2025-10-01',
      '2025-10-31'
    );
    
    const entry = cashflow.data.find(e => 
      e.transaction_date === '2025-10-20' && e.inflows > 0
    );
    
    expect(entry).toBeDefined();
    expect(entry.inflows).toBe(150.00);
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

*Última atualização: 18/10/2025*