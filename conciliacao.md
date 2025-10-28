# Módulo de Conciliação Bancária - Documentação Completa

**Sistema:** Barber Analytics Pro
**Data de Análise:** 21 de outubro de 2025
**Versão:** 1.0.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Modelo de Dados](#modelo-de-dados)
5. [Camada de Serviços](#camada-de-serviços)
6. [Hooks Personalizados](#hooks-personalizados)
7. [Componentes de Interface](#componentes-de-interface)
8. [Fluxo de Dados](#fluxo-de-dados)
9. [Algoritmo de Matching](#algoritmo-de-matching)
10. [Importação de Extratos](#importação-de-extratos)
11. [Estados e Validações](#estados-e-validações)
12. [Boas Práticas e Padrões](#boas-práticas-e-padrões)

---

## 1. Visão Geral

### 1.1 Propósito

O módulo de conciliação bancária é responsável por automatizar e gerenciar o processo de reconciliação entre:

- **Extratos bancários** (bank_statements) - transações que ocorreram nas contas bancárias
- **Lançamentos internos** (revenues/expenses) - receitas e despesas registradas no sistema

### 1.2 Funcionalidades Principais

- ✅ **Auto-matching**: Algoritmo inteligente para encontrar correspondências automáticas
- ✅ **Conciliação Manual**: Interface para vincular transações manualmente
- ✅ **Importação de Extratos**: Upload e parsing de arquivos CSV/OFX/TXT
- ✅ **Score de Confiança**: Classificação de matches por níveis de confiança
- ✅ **Gestão de Divergências**: Tratamento de diferenças de valor e data
- ✅ **Histórico e Auditoria**: Rastreamento de todas as operações

### 1.3 Tecnologias Utilizadas

- **Frontend**: React 18+ com Hooks
- **Backend**: Supabase (PostgreSQL)
- **State Management**: React Context + Custom Hooks
- **UI Components**: Atomic Design Pattern
- **Validação**: PropTypes
- **Date Handling**: date-fns
- **Icons**: lucide-react

---

## 2. Arquitetura

### 2.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer (Pages)                      │
│                     ConciliacaoTab.jsx                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Organism Layer                             │
│                 ConciliacaoPanel.jsx                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Molecule Layer                             │
│  ReconciliationMatchCard.jsx | ImportStatementModal.jsx     │
│          ManualReconciliationModal.jsx                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Custom Hooks Layer                         │
│  useReconciliationMatches.js | useBankStatements.js         │
│            useBankAccounts.js                                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Service Layer                              │
│       ReconciliationService.js (Class-based)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Data Layer (Supabase)                      │
│  reconciliations | bank_statements | revenues | expenses    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Padrões Arquiteturais Aplicados

#### Clean Architecture

- **Separação de camadas**: UI → Hooks → Services → Data
- **Independência de frameworks**: Lógica de negócio isolada
- **Inversão de dependências**: Interfaces bem definidas

#### Atomic Design

- **Atoms**: StatusBadge, DateRangePicker
- **Molecules**: ReconciliationMatchCard
- **Organisms**: ConciliacaoPanel
- **Templates**: Modals (Import, ManualReconciliation)
- **Pages**: ConciliacaoTab

#### Repository Pattern

- Serviços encapsulam acesso ao banco de dados
- Métodos específicos para cada operação
- Tratamento centralizado de erros

---

## 3. Estrutura de Arquivos

```
src/
├── pages/
│   └── FinanceiroAdvancedPage/
│       └── ConciliacaoTab.jsx              # Página principal
│
├── organisms/
│   └── ConciliacaoPanel/
│       └── ConciliacaoPanel.jsx            # Painel completo
│
├── molecules/
│   └── ReconciliationMatchCard/
│       └── ReconciliationMatchCard.jsx     # Card de match
│
├── templates/
│   ├── ImportStatementModal.jsx            # Modal de importação
│   └── ManualReconciliationModal.jsx       # Modal de conciliação manual
│
├── hooks/
│   └── useReconciliationMatches.js         # Hook de matches
│
├── services/
│   └── reconciliationService.js            # Serviço principal
│
└── atoms/
    ├── StatusBadge/
    └── DateRangePicker/
```

### 3.1 Descrição dos Arquivos

#### **ConciliacaoTab.jsx** (219 linhas)

- Componente de página principal
- Gerencia estado global e filtros
- Orquestra comunicação entre componentes
- Integra modais e painel principal

#### **ConciliacaoPanel.jsx** (1013 linhas)

- Organism complexo para gestão de matches
- Estatísticas e KPIs de conciliação
- Filtros avançados (data, confiança, status)
- Tabs de visualização (Matches, Extrato, Interno)
- Ações em lote

#### **ReconciliationMatchCard.jsx** (671 linhas)

- Molecule para exibir um match individual
- Score de confiança visual
- Comparação lado-a-lado (extrato vs interno)
- Detalhes expandíveis
- Ações de aprovação/rejeição

#### **ImportStatementModal.jsx** (1164 linhas)

- Wizard de 3 etapas para importação
- Upload e validação de arquivos
- Mapeamento inteligente de colunas
- Preview e correção de dados

#### **ManualReconciliationModal.jsx** (1074 linhas)

- Interface para matching manual
- Algoritmo de cálculo de confiança
- Similaridade de Levenshtein
- Seleção dual de transações

#### **useReconciliationMatches.js** (321 linhas)

- Hook customizado para gestão de matches
- Cache com TTL de 30 segundos
- AbortController para cancelamento
- Métodos: confirmMatch, rejectMatch, adjustMatch

#### **reconciliationService.js** (1109 linhas)

- Classe de serviço principal
- 15+ métodos públicos
- Algoritmo de auto-matching
- Integração com Supabase

---

## 4. Modelo de Dados

### 4.1 Tabelas Principais

#### **reconciliations**

Tabela central que vincula extratos bancários com lançamentos internos.

```typescript
interface Reconciliation {
  id: string; // UUID primary key
  statement_id: string; // FK → bank_statements.id
  reference_type: 'Revenue' | 'Expense';
  reference_id: string; // FK → revenues.id | expenses.id
  reconciliation_date: string; // ISO timestamp
  status: 'pending' | 'confirmed' | 'Divergent' | 'rejected';
  difference: number; // Diferença de valor
  notes: string; // Observações
  confirmed_at?: string; // Data de confirmação
  created_at: string;
  updated_at: string;
}
```

#### **bank_statements**

Transações extraídas de extratos bancários.

```typescript
interface BankStatement {
  id: string;
  bank_account_id: string; // FK → bank_accounts.id
  transaction_date: string; // Data da transação
  description: string; // Descrição/histórico
  amount: number; // Valor (+ crédito / - débito)
  type: 'Credit' | 'Debit';
  balance_after?: number; // Saldo após transação
  hash_unique: string; // Hash para detecção de duplicatas
  status: 'pending' | 'reconciled';
  reconciled: boolean;
  created_at: string;
}
```

#### **revenues** (Receitas)

```typescript
interface Revenue {
  id: string;
  unit_id: string;
  description: string;
  value: number;
  date: string;
  actual_receipt_date?: string;
  expected_receipt_date?: string;
  status: string; // 'Conciliado', 'Pendente', etc.
  party_id?: string; // FK → parties.id
  is_active: boolean;
}
```

#### **expenses** (Despesas)

```typescript
interface Expense {
  id: string;
  unit_id: string;
  description: string;
  value: number;
  date: string;
  actual_payment_date?: string;
  expected_payment_date?: string;
  status: string;
  party_id?: string;
  is_active: boolean;
}
```

### 4.2 Views

#### **vw_reconciliation_summary**

View agregada para estatísticas de conciliação.

```sql
SELECT
  account_id,
  period,
  total_statements,
  total_reconciled,
  total_amount,
  reconciled_amount,
  divergent_amount
FROM reconciliations
GROUP BY account_id, period
```

### 4.3 Relacionamentos

```
bank_accounts (1) ─────→ (N) bank_statements
                                    │
                                    │ (1)
                                    ↓
                              reconciliations
                                    ↓ (1)
                        ┌───────────┴───────────┐
                        │                       │
                     revenues              expenses
                        │                       │
                        └───→ parties ←─────────┘
```

---

## 5. Camada de Serviços

### 5.1 ReconciliationService

Classe singleton que encapsula toda a lógica de negócio.

#### **Métodos Principais**

##### 5.1.1 `getReconciliations(filters)`

Busca conciliações com filtros opcionais.

```javascript
const { data, error } = await ReconciliationService.getReconciliations({
  accountId: 'uuid',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  status: 'confirmed',
  referenceType: 'Revenue',
});
```

**Retorno:**

```typescript
{
  data: Reconciliation[] | null,
  error: string | null
}
```

##### 5.1.2 `getMatches(accountId)`

Busca matches existentes para uma conta com dados completos.

```javascript
const { data, error } = await ReconciliationService.getMatches('account-uuid');
```

**Retorno transformado:**

```typescript
{
  id: string,
  statementId: string,
  referenceType: 'Revenue' | 'Expense',
  referenceId: string,
  reconciliationDate: string,
  status: string,
  difference: number,
  bankStatement: {
    id, transactionDate, description, amount, type
  },
  internalTransaction: {
    id, description, value, date, actualDate, expectedDate, status, partyName
  }
}
```

##### 5.1.3 `autoMatch(params)`

Executa algoritmo de auto-matching.

```javascript
const { data, error } = await ReconciliationService.autoMatch({
  accountId: 'uuid',
  options: {
    daysTolerance: 2, // Dias de diferença aceitos
    amountTolerance: 5, // % de tolerância no valor
    minScore: 70, // Score mínimo (0-100)
  },
});
```

**Retorno:**

```typescript
{
  statement_id: string,
  transaction_id: string,
  transaction_type: 'Revenue' | 'Expense',
  score: number,                    // 0-100
  confidence: 'Exato' | 'Alto' | 'Médio' | 'Baixo',
  statement: {...},
  transaction: {...},
  difference: number,
  date_difference: number           // Em dias
}[]
```

##### 5.1.4 `confirmReconciliation(...)`

Confirma uma conciliação (automática ou manual).

```javascript
// Por ID de reconciliação existente
await ReconciliationService.confirmReconciliation(
  reconciliationId,
  statementId,
  referenceType,
  referenceId,
  difference,
  notes
);

// Ou por objeto
await ReconciliationService.confirmReconciliation({
  statementId: 'uuid',
  referenceType: 'Revenue',
  referenceId: 'uuid',
  difference: 0.5,
  notes: 'Diferença de tarifas',
});
```

**Efeitos colaterais:**

- Atualiza `bank_statements.status` para 'reconciled'
- Atualiza status da receita/despesa se aplicável
- Registra timestamp de confirmação

##### 5.1.5 `rejectReconciliation(reconciliationId)`

Remove vínculo de conciliação.

```javascript
await ReconciliationService.rejectReconciliation('reconciliation-uuid');
```

**Efeitos:**

- Delete da tabela `reconciliations`
- Trigger atualiza `bank_statements.status` para 'pending'

##### 5.1.6 `manualLink(params)`

Vinculação manual entre extrato e lançamento.

```javascript
await ReconciliationService.manualLink({
  statementId: 'uuid',
  referenceType: 'Expense',
  referenceId: 'uuid',
  adjustmentAmount: 5.5,
  notes: 'Ajuste por desconto obtido',
});
```

##### 5.1.7 `getReconciliationStats(filters)`

Estatísticas agregadas de conciliação.

```javascript
const { data } = await ReconciliationService.getReconciliationStats({
  accountId: 'uuid',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
});
```

**Retorno:**

```typescript
{
  total_statements: number,
  total_reconciled: number,
  total_pending: number,
  reconciliation_percentage: number,
  total_amount: number,
  reconciled_amount: number,
  pending_amount: number,
  divergent_amount: number,
  accounts_summary: Array<{...}>
}
```

---

## 6. Algoritmo de Matching

### 6.1 Visão Geral

O algoritmo de auto-matching é executado pelo método `calculateMatches()` e utiliza uma abordagem de **scoring ponderado** com prevenção de duplicatas.

### 6.2 Fluxo do Algoritmo

```
1. Para cada extrato não reconciliado:
   ├── Para cada transação interna compatível (tipo):
   │   ├── Calcular score de compatibilidade
   │   ├── Se score >= minScore: adicionar como candidato
   │   └── Ordenar candidatos por score
   ├── Selecionar MELHOR candidato
   ├── Marcar ambos como "usados"
   └── Adicionar ao resultado final
2. Retornar matches únicos ordenados por confiança
```

### 6.3 Cálculo de Score

O score é composto por **3 fatores principais**:

#### **6.3.1 Compatibilidade de Data (40 pontos máx)**

```javascript
const daysDiff =
  Math.abs(statementDate - transactionDate) / (1000 * 60 * 60 * 24);

if (daysDiff <= daysTolerance) {
  score += Math.max(0, 40 - daysDiff * 10);
}
```

- **0 dias**: 40 pontos
- **1 dia**: 30 pontos
- **2 dias**: 20 pontos
- **> daysTolerance**: 0 pontos

#### **6.3.2 Compatibilidade de Valor (40 pontos máx)**

```javascript
const amountPercent =
  (amountDiff / Math.max(statementAmount, transactionAmount)) * 100;

if (amountPercent <= amountTolerance) {
  score += Math.max(0, 40 - amountPercent * 2);
}
```

- **0% diferença**: 40 pontos
- **1% diferença**: 38 pontos
- **5% diferença**: 30 pontos
- **> amountTolerance**: 0 pontos

#### **6.3.3 Similaridade de Descrição (20 pontos máx)**

```javascript
function calculateDescriptionSimilarity(desc1, desc2, partyName) {
  const similarity = /* algoritmo de palavras comuns */;
  const partyBonus = partyName && desc1.includes(partyName) ? 0.3 : 0;

  return Math.min(1, similarity + partyBonus);
}

score += descriptionScore * 20;
```

- **80%+ similar**: 20 pontos
- **60-80% similar**: 15 pontos
- **40-60% similar**: 10 pontos
- **< 40%**: 0 pontos

### 6.4 Níveis de Confiança

```javascript
function getConfidenceLevel(score) {
  if (score >= 95) return 'Exato'; // Verde
  if (score >= 85) return 'Alto'; // Verde claro
  if (score >= 70) return 'Médio'; // Amarelo
  return 'Baixo'; // Vermelho
}
```

### 6.5 Prevenção de Duplicatas

**Problema resolvido (BUG-005):**

- Antes: Múltiplos matches para o mesmo extrato/transação
- Solução: Sets para rastrear itens já correspondidos

```javascript
const usedStatements = new Set();
const usedTransactions = new Set();

// Durante o loop:
if (usedStatements.has(statement.id)) continue;
if (usedTransactions.has(transaction.id)) continue;

// Ao encontrar melhor match:
usedStatements.add(bestMatch.statement_id);
usedTransactions.add(bestMatch.transaction_id);
```

### 6.6 Configurações Padrão

```javascript
const defaultOptions = {
  daysTolerance: 2, // ±2 dias
  amountTolerance: 5, // ±5%
  minScore: 70, // 70/100
};
```

---

## 7. Hooks Personalizados

### 7.1 useReconciliationMatches

Hook principal para gerenciar matches de conciliação.

#### **Assinatura**

```javascript
const {
  matches,
  loading,
  error,
  refetch,
  runAutoMatch,
  confirmMatch,
  rejectMatch,
  adjustMatch,
} = useReconciliationMatches(accountId, options);
```

#### **Parâmetros**

```typescript
accountId: string                   // ID da conta bancária
options?: {
  tolerance?: number,               // Padrão: 0.05 (5%)
  windowDays?: number,              // Padrão: 2
  confidenceThreshold?: number      // Padrão: 0.5
}
```

#### **Retorno**

```typescript
{
  matches: ReconciliationMatch[],   // Lista de matches
  loading: boolean,                 // Estado de carregamento
  error: string | null,             // Mensagem de erro
  refetch: () => void,              // Recarregar dados
  runAutoMatch: () => Promise<{     // Executar auto-match
    success: boolean,
    data?: Match[],
    error?: string
  }>,
  confirmMatch: (matchId, adjustmentData?) => Promise<{
    success: boolean
  }>,
  rejectMatch: (matchId, reason?) => Promise<{
    success: boolean
  }>,
  adjustMatch: (statementId, type, txnId, adjustmentData) => Promise<{
    success: boolean
  }>
}
```

#### **Recursos**

##### Cache Inteligente

```javascript
const cacheRef = useRef(new Map());
const TTL = 30000; // 30 segundos

// Verificação de cache
if (cachedData && Date.now() - cachedData.timestamp < TTL) {
  return cachedData.data;
}
```

##### Abort Controller

```javascript
const abortControllerRef = useRef(null);

// Cancelar requisição anterior
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}
```

##### Toast Notifications

```javascript
const toast = useToast();

toast.addToast({
  type: 'success',
  title: 'Match confirmado',
  message: 'Conciliação confirmada com sucesso',
});
```

---

## 8. Componentes de Interface

### 8.1 ConciliacaoTab

**Responsabilidades:**

- Orquestração de componentes filhos
- Gerenciamento de estado global
- Filtros globais (unidade, conta, período)
- Controle de modais

**Props:**

```typescript
interface ConciliacaoTabProps {
  globalFilters: {
    unitId: string;
    accountId: string;
    startDate?: string;
    endDate?: string;
  };
}
```

**Estados internos:**

```javascript
const [isImportModalOpen, setIsImportModalOpen] = useState(false);
const [isManualModalOpen, setIsManualModalOpen] = useState(false);
```

**Fluxo de dados:**

```
ConciliacaoTab
  ├→ useReconciliationMatches(accountId)
  ├→ useBankStatements(accountId)
  ├→ useBankAccounts(unitId)
  └→ ConciliacaoPanel
      ├→ ReconciliationMatchCard (N)
      ├→ ImportStatementModal
      └→ ManualReconciliationModal
```

### 8.2 ConciliacaoPanel

**Responsabilidades:**

- Exibição de estatísticas
- Filtros avançados
- Ações em lote
- Tabs de visualização

**Props (22 props!):**

```typescript
interface ConciliacaoPanelProps {
  // Dados
  bankTransactions: BankTransaction[];
  internalTransactions: InternalTransaction[];
  reconciliationMatches: Match[];
  selectedAccount: Account;

  // Callbacks
  onImportStatement: () => void;
  onExportResults: () => void;
  onRunAutoMatch: () => void;
  onApproveMatch: (match) => void;
  onRejectMatch: (match) => void;
  onCreateManualMatch: (match?) => void;
  onDeleteMatch: (match) => void;
  onRefreshData: () => void;

  // Filtros
  dateRange?: { startDate; endDate };
  onDateRangeChange?: (range) => void;
  matchStatusFilter?: string;
  onMatchStatusFilterChange?: (status) => void;
  confidenceFilter?: number;
  onConfidenceFilterChange?: (value) => void;

  // Estados
  loading?: boolean;
  autoMatchRunning?: boolean;

  // Config
  viewMode?: 'matches' | 'bank' | 'internal';
  showFilters?: boolean;
  compactMode?: boolean;
}
```

**Estatísticas calculadas:**

```javascript
const reconciliationStats = useMemo(
  () => ({
    totalBankTransactions,
    totalInternalTransactions,
    totalMatches,
    approvedMatches,
    pendingMatches,
    rejectedMatches,
    autoMatches,
    manualMatches,
    matchedBankAmount,
    unmatchedBankAmount,
    reconciliationRate: (approvedMatches / totalBankTransactions) * 100,
  }),
  [bankTransactions, internalTransactions, reconciliationMatches]
);
```

**Filtros aplicados:**

1. Status (matched, unmatched, pending, approved, rejected)
2. Confiança mínima (0-100)
3. Busca textual (descrição, referência)
4. Range de valores (min-max)
5. Período (startDate-endDate)

**Ordenação:**

- Por confiança (desc/asc)
- Por valor (desc/asc)
- Por data (desc/asc)

### 8.3 ReconciliationMatchCard

**Responsabilidades:**

- Exibir um match individual
- Comparação visual (extrato vs interno)
- Score de confiança com barra de progresso
- Detalhes expandíveis
- Ações (confirmar, rejeitar, ajustar)

**Props:**

```typescript
interface ReconciliationMatchCardProps {
  match: Match;
  onConfirm?: (match) => void;
  onReject?: (match) => void;
  onAdjust?: (match) => void;
  onViewDetails?: (match) => void;
  showActions?: boolean;
  compact?: boolean;
}
```

**Estrutura visual:**

```
┌─────────────────────────────────────────────────┐
│ Match #abc12345              [Status] [Expand]  │
│ Criado em 21/10/2025 10:30                      │
├─────────────────────────────────────────────────┤
│ Confiança: 95% - Alto                           │
│ ████████████████████████████████░░░░░ 95%       │
├─────────────────────────────────────────────────┤
│ ┌─ Transação Interna ──┐ ┌─ Extrato Bancário ─┐│
│ │ R$ 150,00            │ │ R$ 150,00          ││
│ │ 13/10/2025           │ │ 13/10/2025         ││
│ │ Corte Premium        │ │ PIX João Silva     ││
│ │ 👤 João Silva        │ │                    ││
│ └──────────────────────┘ └────────────────────┘│
├─────────────────────────────────────────────────┤
│ ⚠️ Diferenças Identificadas (se houver)         │
│ • Valor: +R$ 0,50 | • Data: +2 dias            │
├─────────────────────────────────────────────────┤
│ [Detalhes] [Ajustar] [Rejeitar] [✓ Confirmar] │
└─────────────────────────────────────────────────┘
```

**Classificação de confiança:**

```javascript
const getConfidenceLevel = score => {
  if (score >= 90) return { level: 'high', label: 'Alto', color: 'green' };
  if (score >= 70) return { level: 'medium', label: 'Médio', color: 'yellow' };
  if (score >= 50) return { level: 'low', label: 'Baixo', color: 'orange' };
  return { level: 'very-low', label: 'Muito Baixo', color: 'red' };
};
```

### 8.4 ImportStatementModal

Wizard de 3 etapas para importação de extratos.

**Etapa 1: Upload do Arquivo**

- Seleção de conta bancária
- Configurações (delimitador, encoding, formato de data)
- Upload com drag & drop
- Validação de formato e tamanho

**Etapa 2: Mapeamento de Colunas**

- Auto-mapeamento inteligente
- Campos obrigatórios: data, valor, descrição
- Campos opcionais: tipo, categoria, documento, saldo
- Preview de amostra (5 linhas)

**Etapa 3: Preview e Confirmação**

- Tabela com todas as transações processadas
- Validação de cada linha
- Indicação de erros
- Resumo (total, válidas, com erros)

**Props:**

```typescript
interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data) => Promise<Result>;
  onSuccess?: (result) => void;
  loading?: boolean;
  availableAccounts: Account[];
  defaultAccountId?: string;
}
```

**Validações:**

- Tamanho máximo: 10MB
- Formatos: CSV, TXT, OFX, QIF
- Data obrigatória no formato dd/MM/yyyy
- Valor numérico válido
- Descrição não vazia

**Mapeamento inteligente:**

```javascript
const autoMapColumns = headers => {
  headers.forEach(header => {
    const lower = header.toLowerCase();

    if (lower.includes('data') || lower.includes('date')) mapping.data = header;
    if (lower.includes('valor') || lower.includes('amount'))
      mapping.valor = header;
    if (lower.includes('desc') || lower.includes('histórico'))
      mapping.descricao = header;
    // ...
  });
};
```

### 8.5 ManualReconciliationModal

Interface para criação manual de matches.

**Recursos:**

- Tabs: Matches Sugeridos | Match Manual | Não Reconciliadas
- Algoritmo de confiança próprio
- Cálculo de similaridade (Levenshtein)
- Seleção dual de transações
- Preview do match antes de criar

**Props:**

```typescript
interface ManualReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReconcile: (matchId, adjustments?) => Promise<void>;
  onReject: (matchId, reason?) => Promise<void>;
  onCreateMatch: (matchData) => Promise<void>;
  bankTransactions: BankTransaction[];
  internalTransactions: InternalTransaction[];
  existingMatches: Match[];
  loading?: boolean;
}
```

**Cálculo de confiança manual:**

```javascript
const calculateMatchConfidence = (bankTxn, internalTxn) => {
  let confidence = 0;
  const factors = [];

  // Valor exato (40%)
  if (Math.abs(bankTxn.valor - internalTxn.valor) === 0) {
    confidence += 40;
    factors.push({ factor: 'Valor exato', points: 40 });
  }

  // Data próxima (25%)
  const daysDiff = Math.abs(bankDate - internalDate) / (1000 * 60 * 60 * 24);
  if (daysDiff === 0) {
    confidence += 25;
    factors.push({ factor: 'Mesma data', points: 25 });
  }

  // Descrição similar (20%)
  const similarity = calculateStringSimilarity(desc1, desc2);
  if (similarity > 0.8) {
    confidence += 20;
    factors.push({ factor: 'Descrição muito similar', points: 20 });
  }

  // Documento idêntico (10%)
  if (bankTxn.documento === internalTxn.documento) {
    confidence += 10;
  }

  // Tipo compatível (5%)
  if (bankTxn.tipo === internalTxn.tipo) {
    confidence += 5;
  }

  return { confidence, factors, breakdown };
};
```

**Similaridade de Levenshtein:**

```javascript
const levenshteinDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  // Algoritmo clássico de distância de edição
  // ...

  return matrix[str2.length][str1.length];
};

const calculateStringSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};
```

---

## 9. Fluxo de Dados

### 9.1 Fluxo de Auto-Matching

```
1. Usuário clica em "Executar Auto-Match"
   ↓
2. ConciliacaoTab.handleRunAutoMatch()
   ↓
3. useReconciliationMatches.runAutoMatch()
   ↓
4. ReconciliationService.autoMatch({ accountId, options })
   ↓
5. Buscar extratos não reconciliados (bank_statements)
   ↓
6. Buscar receitas/despesas não conciliadas da mesma unidade
   ↓
7. calculateMatches(statements, transactions, options)
   ├─ Para cada extrato:
   │  ├─ Encontrar candidatos compatíveis
   │  ├─ Calcular score de cada candidato
   │  ├─ Selecionar melhor match (score >= minScore)
   │  └─ Marcar como usados
   ↓
8. Retornar matches ordenados por confiança
   ↓
9. Hook atualiza estado local
   ↓
10. Cache é limpo para forçar reload
    ↓
11. Toast de sucesso
    ↓
12. UI renderiza matches encontrados
```

### 9.2 Fluxo de Confirmação de Match

```
1. Usuário clica em "Confirmar" no ReconciliationMatchCard
   ↓
2. ConciliacaoTab.handleConfirmMatch(matchId, adjustmentData)
   ↓
3. useReconciliationMatches.confirmMatch(matchId, adjustmentData)
   ↓
4. ReconciliationService.confirmReconciliation(params)
   ↓
5. Se reconciliationId existe:
   │  ├─ Buscar reconciliação existente
   │  ├─ Validar status (não pode estar confirmed)
   │  └─ UPDATE reconciliations SET status='confirmed', confirmed_at=NOW()
   │
   Senão (criação nova):
   │  ├─ Validar extrato existe e não está reconciliado
   │  ├─ Validar referência (revenue/expense) existe
   │  ├─ INSERT INTO reconciliations (...)
   │  └─ UPDATE bank_statements SET status='reconciled'
   ↓
6. Trigger automaticamente atualiza receita/despesa.status
   ↓
7. Hook remove match confirmado do estado local
   ↓
8. Cache é limpo
   ↓
9. Toast de sucesso
   ↓
10. refetchStatements() para atualizar lista de extratos
```

### 9.3 Fluxo de Importação de Extrato

```
1. Usuário clica em "Importar Extrato"
   ↓
2. ConciliacaoTab abre ImportStatementModal
   ↓
3. ETAPA 1: Upload
   ├─ Usuário seleciona conta bancária
   ├─ Configura opções (delimiter, encoding, etc.)
   └─ Faz upload do arquivo
   ↓
4. handleFileUpload(file)
   ├─ validateFile(file) - tamanho, formato
   ├─ readFileContent(file) - FileReader
   ├─ parseCSVContent(content) - parsing com delimiter
   ├─ autoMapColumns(headers) - mapeamento inteligente
   └─ setCurrentStep(2)
   ↓
5. ETAPA 2: Mapeamento
   ├─ Usuário revisa mapeamento automático
   ├─ Ajusta colunas obrigatórias se necessário
   └─ Visualiza amostra de dados
   ↓
6. handleProceedToPreview()
   ├─ validateMapping() - campos obrigatórios
   ├─ generatePreview() - processar e validar cada linha
   └─ setCurrentStep(3)
   ↓
7. ETAPA 3: Preview e Confirmação
   ├─ Usuário revisa transações
   ├─ Vê resumo (total, válidas, erros)
   └─ Clica em "Importar X Transações"
   ↓
8. handleExecuteImport()
   ├─ Validar conta selecionada
   ├─ Preparar payload com dados processados
   └─ onImport(importData)
   ↓
9. ConciliacaoTab.handleImport(payload)
   ↓
10. useBankStatements.importStatements(payload)
    ↓
11. Service: BankStatementsService.importFromFile()
    ├─ Para cada transação válida:
    │  ├─ Gerar hash_unique para detecção de duplicatas
    │  ├─ Verificar duplicata (hash)
    │  └─ INSERT ou UPDATE conforme configuração
    ↓
12. Retornar resultado { success, imported, skipped, errors }
    ↓
13. onSuccess(result)
    ├─ refetchMatches()
    ├─ refetchStatements()
    └─ resetModal() + onClose()
    ↓
14. Toast com resumo da importação
```

### 9.4 Fluxo de Conciliação Manual

```
1. Usuário clica em "Vincular Manual"
   ↓
2. ConciliacaoTab abre ManualReconciliationModal
   ↓
3. Modal gera matches automáticos para sugestões
   ├─ generateAutoMatches()
   ├─ Para cada extrato não reconciliado:
   │  ├─ Comparar com transações internas
   │  ├─ calculateMatchConfidence() - algoritmo próprio
   │  └─ Filtrar por confiança > 30%
   ↓
4. TAB "Matches Sugeridos"
   ├─ Usuário revisa matches gerados
   ├─ Aplica filtros (busca, data, confiança, status)
   └─ Ações: Aceitar, Rejeitar, Ajustar
   ↓
5. TAB "Match Manual"
   ├─ Lado esquerdo: Lista de extratos não reconciliados
   ├─ Lado direito: Lista de transações internas não reconciliadas
   ├─ Usuário seleciona um de cada lado
   ├─ Preview mostra confiança calculada e diferenças
   └─ Clica em "Criar Match Manual"
   ↓
6. handleCreateManualMatch()
   ├─ Validar seleções
   ├─ Calcular confiança
   ├─ Preparar objeto de match
   └─ onCreateMatch(manualMatch)
   ↓
7. ReconciliationService.manualLink(params)
   ├─ Buscar dados do extrato e referência
   ├─ Calcular diferença de valor
   └─ Chamar confirmReconciliation()
   ↓
8. Inserir registro em reconciliations
   ↓
9. Atualizar status do extrato
   ↓
10. Modal fecha e dados são atualizados
```

---

## 10. Estados e Validações

### 10.1 Estados de Reconciliação

```typescript
type ReconciliationStatus =
  | 'pending' // Aguardando confirmação
  | 'confirmed' // Confirmada pelo usuário
  | 'Divergent' // Com diferenças significativas
  | 'rejected'; // Rejeitada manualmente
```

**Transições de estado:**

```
pending ──[confirmar]──> confirmed
   │
   ├──[rejeitar]──> rejected ──[deletar]──> (removido)
   │
   └──[detectar diferença > 0.01]──> Divergent ──[confirmar]──> confirmed
```

### 10.2 Estados de Extrato

```typescript
type BankStatementStatus =
  | 'pending' // Não reconciliado
  | 'reconciled'; // Reconciliado
```

**Atualização automática:**

- `confirmReconciliation()` → status = 'reconciled'
- `rejectReconciliation()` → status = 'pending' (via trigger)

### 10.3 Validações

#### Validações de Auto-Matching

```javascript
// Antes de iniciar
if (!accountId) return { error: 'Account ID obrigatório' };
if (tolerance < 0) return { error: 'Tolerância inválida' };
if (tolerance > 100) return { error: 'Tolerância máxima: R$ 100' };

// Durante o matching
if (!typeMatch) continue; // Receita deve corresponder a Crédito
if (score < minScore) continue; // Score abaixo do mínimo
```

#### Validações de Confirmação

```javascript
// Parâmetros obrigatórios
if (!statementId || !referenceType || !referenceId) {
  return { error: 'Parâmetros obrigatórios faltando' };
}

// Reference type válido
if (!['Revenue', 'Expense'].includes(referenceType)) {
  return { error: 'Reference Type deve ser Revenue ou Expense' };
}

// Extrato existe e não está reconciliado
if (!statement || statement.reconciled) {
  return { error: 'Extrato já reconciliado ou não encontrado' };
}

// Referência existe
if (!reference) {
  return { error: `${referenceType} não encontrada` };
}
```

#### Validações de Importação

```javascript
// Arquivo
if (!file) return ['Nenhum arquivo selecionado'];
if (file.size > 10 * 1024 * 1024) return ['Arquivo muito grande'];

// Extensão
const ext = file.name.split('.').pop();
if (!['csv', 'txt', 'ofx', 'qif'].includes(ext)) {
  return ['Formato não suportado'];
}

// Mapeamento
if (!columnMapping.data) return ['Campo Data é obrigatório'];
if (!columnMapping.valor) return ['Campo Valor é obrigatório'];
if (!columnMapping.descricao) return ['Campo Descrição é obrigatório'];

// Cada linha
if (!row.data.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
  errors.push('Data inválida');
}
if (isNaN(row.valor)) {
  errors.push('Valor inválido');
}
if (!row.descricao.trim()) {
  errors.push('Descrição obrigatória');
}
```

---

## 11. Boas Práticas e Padrões

### 11.1 Padrões de Código

#### Single Responsibility Principle (SRP)

```javascript
// ✅ BOM - Uma responsabilidade por função
function calculateScore(statement, transaction) { ... }
function getConfidenceLevel(score) { ... }
function formatCurrency(value) { ... }

// ❌ RUIM - Múltiplas responsabilidades
function processMatch(statement, transaction) {
  const score = /* cálculo complexo */;
  const level = /* classificação */;
  const formatted = /* formatação */;
  const saved = /* salvar no BD */;
}
```

#### Don't Repeat Yourself (DRY)

```javascript
// ✅ BOM - Reutilização via serviço
ReconciliationService.confirmReconciliation(params);

// ❌ RUIM - Duplicar lógica em componentes
async function confirmInComponent() {
  const { data } = await supabase.from('reconciliations')...
  await supabase.from('bank_statements').update()...
}
```

#### Naming Conventions

```javascript
// Componentes: PascalCase
(ConciliacaoPanel, ReconciliationMatchCard);

// Hooks: camelCase com prefixo 'use'
(useReconciliationMatches, useBankStatements);

// Serviços: PascalCase (classes)
(ReconciliationService, BankStatementsService);

// Funções: camelCase descritivo
(calculateMatchScore, getConfidenceLevel, formatCurrency);

// Constantes: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_TOLERANCE = 0.05;
```

### 11.2 Performance

#### Memoização

```javascript
// useMemo para cálculos pesados
const reconciliationStats = useMemo(() => {
  return calculateStats(bankTransactions, reconciliationMatches);
}, [bankTransactions, reconciliationMatches]);

// useCallback para funções passadas como props
const handleConfirmMatch = useCallback(
  async (matchId) => { ... },
  [dependencies]
);
```

#### Cache com TTL

```javascript
const cacheRef = useRef(new Map());
const TTL = 30000; // 30 segundos

const getCacheKey = (accountId, options) =>
  `reconciliation_matches_${accountId}_${JSON.stringify(options)}`;

// Armazenar
cacheRef.current.set(cacheKey, {
  data: matches,
  timestamp: Date.now(),
});

// Recuperar
const cached = cacheRef.current.get(cacheKey);
if (cached && Date.now() - cached.timestamp < TTL) {
  return cached.data;
}
```

#### Abort Controller

```javascript
const abortControllerRef = useRef(null);

// Cancelar requisição anterior
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}

abortControllerRef.current = new AbortController();

// Usar no fetch
await fetch(url, { signal: abortControllerRef.current.signal });
```

### 11.3 Tratamento de Erros

#### Padrão de Retorno

```javascript
// ✅ Consistente em todos os serviços
return {
  success: boolean,
  data: T | null,
  error: string | null,
};

// Uso
const { success, data, error } = await service.method();
if (error) {
  toast.addToast({ type: 'error', message: error });
  return;
}
// Continuar com data
```

#### Try-Catch

```javascript
try {
  const result = await riskyOperation();
  return { success: true, data: result, error: null };
} catch (err) {
  return {
    success: false,
    data: null,
    error: err.message || 'Erro desconhecido',
  };
}
```

#### Validação Preventiva

```javascript
// Validar antes de executar
if (!accountId) {
  return { success: false, error: 'Account ID é obrigatório' };
}

if (tolerance < 0 || tolerance > 100) {
  return { success: false, error: 'Tolerância inválida' };
}

// Continuar apenas se válido
```

### 11.4 Acessibilidade

```jsx
// ARIA labels
<button
  aria-label="Confirmar conciliação"
  onClick={handleConfirm}
>
  <Check className="w-4 h-4" />
</button>

// Roles adequados
<div role="alert" className="error-message">
  {errorMessage}
</div>

// Keyboard navigation
<div
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
>
  {content}
</div>
```

### 11.5 TypeScript/PropTypes

```javascript
// Sempre validar props
ReconciliationMatchCard.propTypes = {
  match: PropTypes.shape({
    id: PropTypes.string.isRequired,
    confidence_score: PropTypes.number,
    status: PropTypes.string,
    // ...
  }).isRequired,
  onConfirm: PropTypes.func,
  onReject: PropTypes.func,
  showActions: PropTypes.bool,
  compact: PropTypes.bool,
};

// Default props quando aplicável
ReconciliationMatchCard.defaultProps = {
  showActions: true,
  compact: false,
};
```

---

## 12. Melhorias Futuras

### 12.1 Curto Prazo

**1. Testes Automatizados**

```javascript
// Unit tests para algoritmo de matching
describe('calculateMatchScore', () => {
  it('should return 100 for exact matches', () => {
    const score = ReconciliationService.calculateMatchScore(...);
    expect(score).toBe(100);
  });
});

// Integration tests para fluxo completo
describe('Reconciliation Flow', () => {
  it('should auto-match and confirm reconciliation', async () => {
    const { data: matches } = await autoMatch({ accountId });
    const result = await confirmReconciliation(matches[0].id);
    expect(result.success).toBe(true);
  });
});
```

**2. Logs e Observabilidade**

```javascript
// Adicionar logging estruturado
logger.info('Auto-match initiated', {
  accountId,
  options,
  userId,
});

logger.error('Reconciliation failed', {
  error,
  statementId,
  referenceId,
});
```

**3. Otimização de Queries**

```javascript
// Índices no banco
CREATE INDEX idx_bank_statements_account_reconciled
  ON bank_statements(bank_account_id, reconciled);

CREATE INDEX idx_reconciliations_statement
  ON reconciliations(statement_id, status);

// Pagination para grandes volumes
const { data } = await supabase
  .from('bank_statements')
  .select('*')
  .range(offset, offset + limit);
```

### 12.2 Médio Prazo

**1. Machine Learning para Matching**

- Treinar modelo com histórico de conciliações
- Aprender padrões específicos de cada empresa
- Melhorar score de confiança ao longo do tempo

**2. Regras Customizáveis**

```javascript
// Interface para criar regras personalizadas
const customRule = {
  name: 'Pagamentos recorrentes',
  condition: (statement, transaction) => {
    return (
      statement.description.includes('RECORRENTE') && transaction.isRecurring
    );
  },
  scoreBonus: 15,
};
```

**3. Exportação de Relatórios**

- PDF com resumo de conciliações do período
- Excel com detalhes de todas as transações
- Dashboard analítico com gráficos

### 12.3 Longo Prazo

**1. Integração com APIs Bancárias**

- Open Banking para importação automática
- Sincronização em tempo real
- Eliminação de uploads manuais

**2. Conciliação Multi-Moeda**

- Suporte a transações internacionais
- Conversão automática de câmbio
- Tratamento de diferenças cambiais

**3. Inteligência Artificial**

- Detecção automática de fraudes
- Previsão de fluxo de caixa
- Sugestões inteligentes de categorização

---

## 13. Troubleshooting

### 13.1 Problemas Comuns

#### "Nenhum match encontrado"

**Causas:**

- Tolerância muito restritiva (minScore muito alto)
- Diferença de datas fora do window
- Tipos incompatíveis (receita vs débito)
- Transações já reconciliadas

**Soluções:**

```javascript
// Reduzir minScore
const matches = await autoMatch({
  accountId,
  options: {
    minScore: 50, // Ao invés de 70
  },
});

// Aumentar tolerância de dias
options.daysTolerance = 5; // Ao invés de 2

// Verificar se há transações não reconciliadas
const unreconciled = statements.filter(s => !s.reconciled);
```

#### "Match duplicado"

**Causa:**

- Bug no algoritmo de prevenção de duplicatas

**Solução implementada (BUG-005):**

```javascript
// Uso de Sets para rastrear itens usados
const usedStatements = new Set();
const usedTransactions = new Set();

// Verificar antes de processar
if (usedStatements.has(statement.id)) continue;
if (usedTransactions.has(transaction.id)) continue;
```

#### "Erro ao importar extrato"

**Causas:**

- Encoding incorreto
- Delimitador errado
- Formato de data incompatível
- Arquivo corrompido

**Soluções:**

```javascript
// Testar diferentes encodings
importSettings.encoding = 'ISO-8859-1'; // Ao invés de UTF-8

// Verificar delimitador correto
importSettings.delimiter = ';'; // Ao invés de ','

// Ajustar formato de data
importSettings.dateFormat = 'yyyy-MM-dd'; // Ao invés de dd/MM/yyyy

// Validar arquivo
const errors = validateFile(file);
console.log('Erros de validação:', errors);
```

### 13.2 Debug

#### Habilitar logs detalhados

```javascript
// No reconciliationService.js
const DEBUG = true;

if (DEBUG) {
  console.log('Auto-match params:', { accountId, options });
  console.log('Statements found:', statements.length);
  console.log('Transactions found:', transactions.length);
  console.log('Matches calculated:', matches.length);
}
```

#### Inspecionar cache

```javascript
// No useReconciliationMatches.js
useEffect(() => {
  console.log('Cache status:', {
    size: cacheRef.current.size,
    keys: Array.from(cacheRef.current.keys()),
  });
}, [accountId]);
```

#### Rastrear renderizações

```javascript
// Adicionar no componente
useEffect(() => {
  console.log('Component rendered:', {
    matches: matches.length,
    loading,
    error,
  });
});
```

---

## 14. Referências

### 14.1 Documentação Técnica

- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Atomic Design - Brad Frost](https://bradfrost.com/blog/post/atomic-web-design/)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [Supabase Documentation](https://supabase.com/docs)

### 14.2 Padrões do Projeto

- [CLAUDE.md](./CLAUDE.md) - Diretrizes do agente de IA
- [PRD](./docs/PRD.md) - Product Requirements Document
- [Plano de Execução](./docs/execution-plan.md)

### 14.3 Bibliotecas Utilizadas

```json
{
  "react": "^18.x",
  "date-fns": "^2.x",
  "lucide-react": "^0.x",
  "prop-types": "^15.x",
  "@supabase/supabase-js": "^2.x"
}
```

---

## 15. Conclusão

O módulo de conciliação bancária do Barber Analytics Pro é uma solução completa e robusta para automatizar o processo de reconciliação financeira. Com arquitetura limpa, componentes reutilizáveis e algoritmo inteligente de matching, o sistema oferece:

✅ **Alta confiabilidade** através de validações e tratamento de erros
✅ **Performance otimizada** com cache e memoização
✅ **UX intuitiva** seguindo princípios de Atomic Design
✅ **Manutenibilidade** com código limpo e bem documentado
✅ **Escalabilidade** preparado para crescimento futuro

**Estado atual:** Funcional e em produção
**Cobertura de testes:** Pendente
**Documentação:** ✅ Completa

---

**Última atualização:** 21 de outubro de 2025
**Autor da documentação:** Claude AI + Equipe de Desenvolvimento
**Versão do documento:** 1.0.0
