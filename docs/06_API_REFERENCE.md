---
title: 'Barber Analytics Pro - API Reference'
author: 'Andrey Viana'
version: '1.1.0'
last_updated: '08/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 06 - API Reference

Referência completa das **APIs internas** do Barber Analytics Pro: Services, Repositories, Hooks e DTOs.

---

## 📋 Índice

- [Services Layer](#services-layer)
- [Repositories Layer](#repositories-layer)
- [Hooks Layer](#hooks-layer)
- [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
- [Next.js API Routes](#nextjs-api-routes)
- [AI Services](#ai-services)
- [Repositories (IA Financeira)](#repositories-ia-financeira)
- [Hooks (IA Financeira)](#hooks-ia-financeira)
- [Utilities](#utilities)

---

## 🔧 Services Layer

### cashflowService

Serviço responsável por operações de fluxo de caixa.

#### getDemonstrativoFluxoAcumulado

```typescript
async function getDemonstrativoFluxoAcumulado(
  filters: CashflowFilters
): Promise<{ data: CashflowData[] | null; error: string | null }>;
```

**Descrição:** Busca demonstrativo de fluxo de caixa com saldo acumulado.

**Parâmetros:**

- `filters.unitId` (string): ID da unidade
- `filters.startDate` (Date): Data inicial
- `filters.endDate` (Date): Data final
- `filters.regime` ('CAIXA' | 'COMPETENCIA'): Regime contábil

**Retorno:**

```typescript
{
  data: [{
    date: Date,
    entradas: number,
    saidas: number,
    saldo_dia: number,
    saldo_acumulado: number
  }],
  error: null
}
```

**Exemplo:**

```javascript
import { cashflowService } from '@/services/cashflowService';

const result = await cashflowService.getDemonstrativoFluxoAcumulado({
  unitId: 'uuid',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  regime: 'CAIXA',
});

if (result.error) {
  console.error(result.error);
} else {
  console.log(result.data);
}
```

---

### revenueService

Serviço responsável por operações de receitas.

#### createRevenue

```typescript
async function createRevenue(
  input: CreateRevenueInput,
  user: User
): Promise<{ data: Revenue | null; error: string | null }>;
```

**Descrição:** Cria nova receita com validações e permissões.

**Parâmetros:**

```typescript
input: {
  unit_id: string;
  professional_id: string;
  value: number;
  date: Date;
  competence_date?: Date;
  description: string;
  category_id: string;
  payment_method_id: string;
  bank_account_id: string;
  party_id?: string;
}
user: {
  id: string;
  email: string;
  role: string;
}
```

**Validações:**

- DTO valida campos obrigatórios
- Verifica permissão (`canManageFinancial`)
- Calcula taxas automaticamente
- Valor deve ser positivo
- Data não pode ser futura

**Exemplo:**

```javascript
const result = await revenueService.createRevenue(
  {
    unit_id: currentUnit.id,
    professional_id: professional.id,
    value: 150.0,
    date: new Date(),
    description: 'Corte + Barba',
    category_id: 'servicos',
    payment_method_id: 'pix',
    bank_account_id: 'conta-principal',
  },
  currentUser
);
```

#### updateRevenue

```typescript
async function updateRevenue(
  id: string,
  input: UpdateRevenueInput,
  user: User
): Promise<{ data: Revenue | null; error: string | null }>;
```

**Descrição:** Atualiza receita existente.

**Regras:**

- Apenas receitas `PENDING` podem ser editadas
- Mantém `source_hash` se existir

#### deleteRevenue

```typescript
async function deleteRevenue(
  id: string,
  user: User
): Promise<{ data: boolean | null; error: string | null }>;
```

**Descrição:** Soft delete (marca `is_active = false`).

**Regras:**

- Apenas admin pode deletar
- Não deleta se já conciliada

#### calculateFees

```typescript
function calculateFees(revenue: Revenue): {
  grossValue: number;
  feePercentage: number;
  feeAmount: number;
  netValue: number;
};
```

**Descrição:** Calcula taxas da forma de pagamento.

**Exemplo:**

```javascript
const fees = revenueService.calculateFees({
  value: 100,
  payment_method: { fee: 4 }, // 4%
});

// fees = {
//   grossValue: 100,
//   feePercentage: 4,
//   feeAmount: 4,
//   netValue: 96
// }
```

---

### expenseService

Serviço responsável por operações de despesas.

#### createExpense

```typescript
async function createExpense(
  input: CreateExpenseInput,
  user: User
): Promise<{ data: Expense | null; error: string | null }>;
```

**Parâmetros:**

```typescript
input: {
  unit_id: string;
  value: number;
  date: Date;
  competence_date?: Date;
  description: string;
  category_id: string;
  payment_method_id: string;
  bank_account_id: string;
  party_id?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
}
```

**Exemplo:**

```javascript
await expenseService.createExpense(
  {
    unit_id: currentUnit.id,
    value: 2500.0,
    date: new Date(),
    description: 'Aluguel',
    category_id: 'custos-fixos',
    payment_method_id: 'transferencia',
    bank_account_id: 'conta-principal',
    is_recurring: true,
    recurrence_pattern: 'MONTHLY',
  },
  currentUser
);
```

---

### orderService

Serviço responsável por operações de comandas.

#### createOrder

```typescript
async function createOrder(
  input: CreateOrderInput,
  user: User
): Promise<{ data: Order | null; error: string | null }>;
```

**Parâmetros:**

```typescript
input: {
  unit_id: string;
  professional_id: string;
  client_id?: string;
}
```

**Comportamento:**

- Cria comanda com status `OPEN`
- Inicializa array de items vazio
- Define `opened_at` como agora

#### addItemToOrder

```typescript
async function addItemToOrder(
  orderId: string,
  item: OrderItemInput,
  user: User
): Promise<{ data: OrderItem | null; error: string | null }>;
```

**Parâmetros:**

```typescript
item: {
  type: 'SERVICE' | 'PRODUCT';
  reference_id: string;
  quantity: number;
  unit_price: number;
}
```

**Validações:**

- Comanda deve estar `OPEN`
- Quantidade deve ser > 0
- Preço deve ser > 0

#### closeOrder

```typescript
async function closeOrder(
  orderId: string,
  discount: number,
  user: User
): Promise<{ data: Order | null; error: string | null }>;
```

**Comportamento:**

1. Valida comanda tem itens
2. Calcula total com desconto
3. Marca status como `CLOSED`
4. Define `closed_at`
5. Dispara evento `OrderClosed`
6. Cria receita automaticamente

---

### dreService

Serviço responsável por cálculo de DRE.

#### calculate

```typescript
async function calculate(
  unitId: string,
  period: { startDate: Date; endDate: Date }
): Promise<{ data: DREData | null; error: string | null }>;
```

**Retorno:**

```typescript
{
  data: {
    receitaBruta: number,
    deducoes: number,
    receitaLiquida: number,
    custosFixos: number,
    custosVariaveis: number,
    custoTotal: number,
    lucroOperacional: number,
    margemPercentual: number
  }
}
```

**Exemplo:**

```javascript
const dre = await dreService.calculate(currentUnit.id, {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
});

console.log(`Lucro: ${formatCurrency(dre.data.lucroOperacional)}`);
console.log(`Margem: ${dre.data.margemPercentual.toFixed(2)}%`);
```

---

## 💾 Repositories Layer

### revenueRepository

Repository de acesso a dados de receitas.

#### create

```typescript
async function create(
  revenue: RevenueData
): Promise<{ data: Revenue | null; error: Error | null }>;
```

**Exemplo:**

```javascript
const { data, error } = await revenueRepository.create({
  unit_id: 'uuid',
  professional_id: 'uuid',
  value: 100,
  date: new Date(),
  description: 'Serviço',
  category_id: 'servicos',
  payment_method_id: 'pix',
  bank_account_id: 'conta',
});
```

#### findById

```typescript
async function findById(
  id: string
): Promise<{ data: Revenue | null; error: Error | null }>;
```

#### findByPeriod

```typescript
async function findByPeriod(
  unitId: string,
  startDate: Date,
  endDate: Date,
  regime?: 'CAIXA' | 'COMPETENCIA'
): Promise<{ data: Revenue[] | null; error: Error | null }>;
```

**Comportamento:**

- Se `regime = 'CAIXA'`, filtra por `date`
- Se `regime = 'COMPETENCIA'`, filtra por `competence_date`
- Retorna apenas receitas da unidade do usuário (RLS)

#### update

```typescript
async function update(
  id: string,
  changes: Partial<RevenueData>
): Promise<{ data: Revenue | null; error: Error | null }>;
```

#### softDelete

```typescript
async function softDelete(
  id: string
): Promise<{ data: boolean | null; error: Error | null }>;
```

**Comportamento:**

- Marca `is_active = false`
- Não remove fisicamente do banco

#### findBySourceHash

```typescript
async function findBySourceHash(
  hash: string
): Promise<{ data: Revenue | null; error: Error | null }>;
```

**Uso:** Detectar duplicatas em importação de extratos.

---

### demonstrativoFluxoRepository

Repository para demonstrativo de fluxo de caixa.

#### getByPeriod

```typescript
async function getByPeriod(
  filters: CashflowFilters
): Promise<{ data: CashflowData[] | null; error: Error | null }>;
```

**SQL Executado:**

```sql
SELECT * FROM vw_demonstrativo_fluxo
WHERE unit_id = :unitId
  AND date BETWEEN :startDate AND :endDate
ORDER BY date ASC
```

**Nota:** Usa view materializada para performance.

---

### orderRepository

Repository de comandas.

#### create

```typescript
async function create(
  order: OrderData
): Promise<{ data: Order | null; error: Error | null }>;
```

#### findById

```typescript
async function findById(
  id: string,
  includeItems?: boolean
): Promise<{ data: Order | null; error: Error | null }>;
```

**Parâmetros:**

- `includeItems = true`: Inclui array de `order_items` via JOIN

#### findOpenByProfessional

```typescript
async function findOpenByProfessional(
  professionalId: string
): Promise<{ data: Order[] | null; error: Error | null }>;
```

**Uso:** Listar comandas abertas do profissional.

#### close

```typescript
async function close(
  id: string,
  total: number,
  discount: number
): Promise<{ data: Order | null; error: Error | null }>;
```

---

## ⚛️ Hooks Layer

### useDemonstrativoFluxo

Hook para buscar fluxo de caixa com cache.

```typescript
function useDemonstrativoFluxo(filters: CashflowFilters): {
  data: CashflowData[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};
```

**Exemplo:**

```javascript
import { useDemonstrativoFluxo } from '@/hooks/useDemonstrativoFluxo';

function CashflowPage() {
  const [filters, setFilters] = useState({
    unitId: currentUnit.id,
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    regime: 'CAIXA',
  });

  const { data, isLoading, error, refetch } = useDemonstrativoFluxo(filters);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <CashflowTable data={data} />;
}
```

**Configuração de Cache:**

```javascript
{
  queryKey: ['demonstrativo-fluxo', filters],
  queryFn: () => cashflowService.getDemonstrativoFluxoAcumulado(filters),
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
  refetchOnWindowFocus: false
}
```

---

### useRevenues

Hook para listar receitas.

```typescript
function useRevenues(
  unitId: string,
  filters?: RevenueFilters
): {
  data: Revenue[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};
```

**Filtros Opcionais:**

```typescript
filters?: {
  startDate?: Date;
  endDate?: Date;
  professionalId?: string;
  status?: 'PENDING' | 'PAID' | 'CANCELLED';
  categoryId?: string;
}
```

---

### useCreateRevenue

Hook para criar receita.

```typescript
function useCreateRevenue(): {
  mutate: (data: CreateRevenueInput) => void;
  mutateAsync: (data: CreateRevenueInput) => Promise<Revenue>;
  isLoading: boolean;
  error: Error | null;
};
```

**Exemplo:**

```javascript
function CreateRevenueModal() {
  const { mutate, isLoading } = useCreateRevenue();
  const queryClient = useQueryClient();

  const handleSubmit = formData => {
    mutate(formData, {
      onSuccess: () => {
        toast.success('Receita criada!');
        queryClient.invalidateQueries(['revenues']);
      },
      onError: error => {
        toast.error(error.message);
      },
    });
  };

  return <Form onSubmit={handleSubmit} />;
}
```

**Configuração:**

```javascript
{
  mutationFn: (data) => revenueService.createRevenue(data, user),
  onSuccess: () => {
    queryClient.invalidateQueries(['revenues']);
    queryClient.invalidateQueries(['demonstrativo-fluxo']);
  }
}
```

---

### useOrders

Hook para listar comandas.

```typescript
function useOrders(
  professionalId: string,
  status?: 'OPEN' | 'CLOSED'
): {
  data: Order[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};
```

---

### useCreateOrder

Hook para criar comanda.

```typescript
function useCreateOrder(): {
  mutate: (data: CreateOrderInput) => void;
  isLoading: boolean;
  error: Error | null;
};
```

---

### useCloseOrder

Hook para fechar comanda.

```typescript
function useCloseOrder(): {
  mutate: (params: { orderId: string; discount: number }) => void;
  isLoading: boolean;
  error: Error | null;
};
```

**Exemplo:**

```javascript
function OrderCard({ order }) {
  const { mutate: closeOrder, isLoading } = useCloseOrder();

  const handleClose = () => {
    const discount = prompt('Desconto:');
    closeOrder({
      orderId: order.id,
      discount: parseFloat(discount || '0'),
    });
  };

  return (
    <div>
      <h3>Comanda #{order.id}</h3>
      <button onClick={handleClose} disabled={isLoading}>
        Fechar
      </button>
    </div>
  );
}
```

---

## 📋 DTOs (Data Transfer Objects)

### CreateRevenueDTO

```typescript
class CreateRevenueDTO {
  unit_id: string;
  professional_id: string;
  value: number;
  date: Date;
  competence_date?: Date;
  description: string;
  category_id: string;
  payment_method_id: string;
  bank_account_id: string;
  party_id?: string;

  constructor(input: any) {
    this.unit_id = input.unit_id;
    this.professional_id = input.professional_id;
    this.value = parseFloat(input.value);
    this.date = new Date(input.date);
    this.competence_date = input.competence_date
      ? new Date(input.competence_date)
      : this.date;
    this.description = input.description?.trim();
    this.category_id = input.category_id;
    this.payment_method_id = input.payment_method_id;
    this.bank_account_id = input.bank_account_id;
    this.party_id = input.party_id;
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors = [];

    if (!this.unit_id) {
      errors.push('Unidade é obrigatória');
    }

    if (!this.professional_id) {
      errors.push('Profissional é obrigatório');
    }

    if (this.value <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (this.date > new Date()) {
      errors.push('Data não pode ser futura');
    }

    if (!this.description || this.description.length < 3) {
      errors.push('Descrição deve ter no mínimo 3 caracteres');
    }

    if (!this.category_id) {
      errors.push('Categoria é obrigatória');
    }

    if (!this.payment_method_id) {
      errors.push('Forma de pagamento é obrigatória');
    }

    if (!this.bank_account_id) {
      errors.push('Conta bancária é obrigatória');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toObject(): object {
    return {
      unit_id: this.unit_id,
      professional_id: this.professional_id,
      value: this.value,
      date: this.date.toISOString(),
      competence_date: this.competence_date.toISOString(),
      description: this.description,
      category_id: this.category_id,
      payment_method_id: this.payment_method_id,
      bank_account_id: this.bank_account_id,
      party_id: this.party_id,
      status: 'PENDING',
      is_active: true,
    };
  }
}
```

**Uso:**

```javascript
const dto = new CreateRevenueDTO(formData);
const validation = dto.validate();

if (!validation.isValid) {
  return { data: null, error: validation.errors.join(', ') };
}

const revenueData = dto.toObject();
```

---

### UpdateRevenueDTO

```typescript
class UpdateRevenueDTO {
  value?: number;
  date?: Date;
  competence_date?: Date;
  description?: string;
  category_id?: string;
  payment_method_id?: string;
  status?: 'PENDING' | 'PAID' | 'CANCELLED';

  constructor(input: any) {
    if (input.value !== undefined) {
      this.value = parseFloat(input.value);
    }
    if (input.date) {
      this.date = new Date(input.date);
    }
    if (input.competence_date) {
      this.competence_date = new Date(input.competence_date);
    }
    if (input.description) {
      this.description = input.description.trim();
    }
    if (input.category_id) {
      this.category_id = input.category_id;
    }
    if (input.payment_method_id) {
      this.payment_method_id = input.payment_method_id;
    }
    if (input.status) {
      this.status = input.status;
    }
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors = [];

    if (this.value !== undefined && this.value <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (this.date && this.date > new Date()) {
      errors.push('Data não pode ser futura');
    }

    if (this.description && this.description.length < 3) {
      errors.push('Descrição deve ter no mínimo 3 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toObject(): object {
    const obj: any = {};

    if (this.value !== undefined) obj.value = this.value;
    if (this.date) obj.date = this.date.toISOString();
    if (this.competence_date)
      obj.competence_date = this.competence_date.toISOString();
    if (this.description) obj.description = this.description;
    if (this.category_id) obj.category_id = this.category_id;
    if (this.payment_method_id) obj.payment_method_id = this.payment_method_id;
    if (this.status) obj.status = this.status;

    obj.updated_at = new Date().toISOString();

    return obj;
  }
}
```

---

### CashflowFilterDTO

```typescript
class CashflowFilterDTO {
  unitId: string;
  startDate: Date;
  endDate: Date;
  regime: 'CAIXA' | 'COMPETENCIA';

  constructor(input: any) {
    this.unitId = input.unitId;
    this.startDate = new Date(input.startDate);
    this.endDate = new Date(input.endDate);
    this.regime = input.regime || 'CAIXA';
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors = [];

    if (!this.unitId) {
      errors.push('Unidade é obrigatória');
    }

    if (this.startDate > this.endDate) {
      errors.push('Data inicial deve ser anterior à data final');
    }

    const diffDays = Math.ceil(
      (this.endDate - this.startDate) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > 365) {
      errors.push('Período máximo: 1 ano');
    }

    if (!['CAIXA', 'COMPETENCIA'].includes(this.regime)) {
      errors.push('Regime deve ser CAIXA ou COMPETENCIA');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

---

## 🛠️ Utilities

### formatCurrency

```typescript
function formatCurrency(value: number): string;
```

**Exemplo:**

```javascript
formatCurrency(1234.56); // "R$ 1.234,56"
formatCurrency(-500); // "- R$ 500,00"
```

**Implementação:**

```javascript
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
```

---

### formatDate

```typescript
function formatDate(date: Date, format?: string): string;
```

**Formatos:**

- `'dd/MM/yyyy'` (padrão)
- `'yyyy-MM-dd'` (ISO)
- `'dd/MM/yyyy HH:mm'` (com hora)

**Exemplo:**

```javascript
formatDate(new Date(), 'dd/MM/yyyy'); // "07/11/2025"
formatDate(new Date(), 'yyyy-MM-dd'); // "2025-11-07"
formatDate(new Date(), 'dd/MM/yyyy HH:mm'); // "07/11/2025 14:30"
```

---

### formatCPF

```typescript
function formatCPF(cpf: string): string;
```

**Exemplo:**

```javascript
formatCPF('12345678900'); // "123.456.789-00"
```

---

### formatPhone

```typescript
function formatPhone(phone: string): string;
```

**Exemplo:**

```javascript
formatPhone('11987654321'); // "(11) 98765-4321"
formatPhone('1138765432'); // "(11) 3876-5432"
```

---

### calculateAge

```typescript
function calculateAge(birthDate: Date): number;
```

**Exemplo:**

```javascript
const age = calculateAge(new Date('1990-05-15'));
console.log(age); // 35
```

---

### getMonthName

```typescript
function getMonthName(month: number): string;
```

**Exemplo:**

```javascript
getMonthName(0); // "Janeiro"
getMonthName(11); // "Dezembro"
```

---

## 🔗 Navegação

- [← 05 - Infrastructure](./05_INFRASTRUCTURE.md)
- [→ 08 - Testing Strategy](./08_TESTING_STRATEGY.md)
- [📚 Summary](./SUMMARY.md)

---

---

## 🌐 Next.js API Routes

### GET /api/kpis/health

Endpoint para buscar KPIs de saúde financeira.

**Query Parameters:**

- `unitId` (obrigatório): ID da unidade
- `startDate` (opcional): Data inicial (YYYY-MM-DD)
- `endDate` (opcional): Data final (YYYY-MM-DD)
- `granularity` (opcional): `daily` | `weekly` | `monthly` (padrão: `daily`)

**Response:**

```typescript
{
  success: true,
  grossRevenue: number,
  totalExpenses: number,
  marginPercentage: number,
  averageTicket: number,
  trend: 'INCREASING' | 'DECREASING' | 'STABLE',
  alerts: Array<{
    type: string,
    severity: string,
    message: string
  }>,
  period: {
    startDate: string,
    endDate: string,
    granularity: string
  }
}
```

**Autenticação:** Bearer JWT (Supabase Auth)

**Cache:** TTL de 5 minutos

---

### GET /api/alerts/query

Endpoint para buscar e filtrar alertas.

**Query Parameters:**

- `unitId` (obrigatório): ID da unidade
- `status` (opcional): `OPEN` | `RESOLVED` | `IGNORED`
- `severity` (opcional): `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
- `startDate` (opcional): Data inicial (YYYY-MM-DD)
- `endDate` (opcional): Data final (YYYY-MM-DD)
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20, máximo: 100)

**Response:**

```typescript
{
  success: true,
  alerts: Array<{
    id: string,
    unitId: string,
    alertType: string,
    severity: string,
    message: string,
    status: string,
    createdAt: string,
    acknowledgedAt?: string
  }>,
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

**Autenticação:** Bearer JWT (Supabase Auth)

---

### GET /api/reports/weekly

Endpoint para gerar relatório semanal completo com análise IA.

**Query Parameters:**

- `unitId` (obrigatório): ID da unidade
- `weekStartDate` (opcional): Data de início da semana (YYYY-MM-DD, padrão: início da semana atual)

**Response:**

```typescript
{
  success: true,
  report: {
    period: {
      startDate: string,
      endDate: string
    },
    metrics: {
      grossRevenue: number,
      totalExpenses: number,
      marginPercentage: number,
      averageTicket: number,
      transactionsCount: number
    },
    analysis: {
      summary: string,
      insights: string[],
      recommendations: string[]
    }
  }
}
```

**Autenticação:** Bearer JWT (Supabase Auth)

**Cache:** TTL de 24 horas para análise IA

---

### GET /api/forecasts/cashflow

Endpoint para buscar previsões de fluxo de caixa.

**Query Parameters:**

- `unitId` (obrigatório): ID da unidade
- `days` (opcional): Período de previsão em dias (padrão: 30)
- `startDate` (opcional): Data inicial para histórico
- `endDate` (opcional): Data final para histórico

**Response:**

```typescript
{
  success: true,
  historical: Array<{
    date: string,
    balance: number,
    revenue: number,
    expense: number
  }>,
  forecast: Array<{
    forecastDate: string,
    forecastedBalance: number,
    forecastedRevenue: number,
    forecastedExpense: number,
    upperBound?: number,
    lowerBound?: number
  }>
}
```

**Autenticação:** Bearer JWT (Supabase Auth)

---

### POST /api/telegram/webhook

Webhook para receber updates do Telegram Bot.

**Headers:**

- `x-telegram-bot-api-secret-token`: Secret token para validação

**Body:**

```typescript
{
  update_id: number,
  message?: {
    message_id: number,
    from: {
      id: number,
      username?: string,
      first_name: string
    },
    chat: {
      id: number
    },
    text: string,
    date: number
  }
}
```

**Response:**

```typescript
{
  ok: true
}
```

---

### Cron Jobs

#### GET /api/cron/etl-diario

Executa ETL diário para processar métricas.

**Headers:**

- `Authorization: Bearer {CRON_SECRET}`

**Schedule:** `0 3 * * *` (03:00 BRT diariamente)

**Response:**

```typescript
{
  success: true,
  runId: string,
  unitsProcessed: number,
  durationMs: number
}
```

#### GET /api/cron/relatorio-semanal

Gera e envia relatório semanal via Telegram.

**Headers:**

- `Authorization: Bearer {CRON_SECRET}`

**Schedule:** `0 6 * * 1` (Segunda-feira às 06:00 BRT)

#### GET /api/cron/fechamento-mensal

Calcula DRE e gera sumário executivo mensal.

**Headers:**

- `Authorization: Bearer {CRON_SECRET}`

**Schedule:** `0 7 1 * *` (Dia 1 do mês às 07:00 BRT)

#### GET /api/cron/enviar-alertas

Envia alertas pendentes via Telegram.

**Headers:**

- `Authorization: Bearer {CRON_SECRET}`

**Schedule:** `*/15 * * * *` (A cada 15 minutos)

#### GET /api/cron/health-check

Executa health checks do sistema.

**Headers:**

- `Authorization: Bearer {CRON_SECRET}`

**Schedule:** `*/5 * * * *` (A cada 5 minutos)

---

## 🤖 AI Services

### generateAnalysis

Gera análise usando OpenAI com cache e anonimização.

```typescript
async function generateAnalysis(
  unitId: string,
  metrics: WeeklyMetrics | MonthlyMetrics,
  promptType: 'WEEKLY' | 'ALERT' | 'WHAT_IF' | 'MONTHLY_EXECUTIVE',
  options?: {
    scenario?: string,
    alertType?: AlertType,
    alertData?: Record<string, any>
  }
): Promise<AnalysisResult>;
```

**Retorno:**

```typescript
{
  content: string,
  parsed?: any,
  cached: boolean,
  tokensUsed?: number,
  cost?: number
}
```

**Cache:** TTL de 24 horas

**Anonimização:** Dados PII removidos antes de enviar à OpenAI

---

## 📊 Repositories (IA Financeira)

### aiMetricsRepository

```typescript
class AIMetricsRepository {
  async findByPeriod(
    unitId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ data: AIMetricsDaily[] | null; error: string | null }>;

  async create(metrics: CreateAIMetricsInput): Promise<{ data: AIMetricsDaily | null; error: string | null }>;
}
```

### alertsRepository

```typescript
class AlertsRepository {
  async findByUnit(
    unitId: string,
    status?: AlertStatus,
    limit?: number
  ): Promise<{ data: AlertEvent[] | null; error: string | null }>;

  async create(alert: CreateAlertInput): Promise<{ data: AlertEvent | null; error: string | null }>;

  async updateStatus(
    alertId: string,
    status: AlertStatus
  ): Promise<{ data: AlertEvent | null; error: string | null }>;
}
```

### kpiTargetsRepository

```typescript
class KPITargetsRepository {
  async findByUnitAndKPI(
    unitId: string,
    kpiName: string
  ): Promise<{ data: KPITarget | null; error: string | null }>;
}
```

---

## 🎣 Hooks (IA Financeira)

### useHealthKPIs

Hook para buscar KPIs de saúde financeira.

```typescript
function useHealthKPIs(params: {
  unitId: string,
  startDate?: Date | string,
  endDate?: Date | string,
  granularity?: 'daily' | 'weekly' | 'monthly'
}): UseQueryResult<HealthKPIsData>;
```

**Cache:** `staleTime: 5min`, `gcTime: 10min`

**Exemplo:**

```typescript
const { data, isLoading, error } = useHealthKPIs({
  unitId: 'uuid',
  startDate: '2025-11-01',
  endDate: '2025-11-30',
  granularity: 'daily'
});
```

---

## 📖 Referências

1. **TanStack Query v5**. https://tanstack.com/query/latest
2. **React Hooks**. https://react.dev/reference/react/hooks
3. **TypeScript Handbook**. https://www.typescriptlang.org/docs/handbook/
4. **Next.js App Router**. https://nextjs.org/docs/app

---

**Última atualização:** 8 de novembro de 2025
**Versão:** 1.1.0
**Autor:** Andrey Viana
