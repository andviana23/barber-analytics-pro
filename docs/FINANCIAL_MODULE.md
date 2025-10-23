# 💰 Módulo Financeiro

> **Sistema financeiro avançado com contabilidade por competência, conciliação bancária e geração de DRE integrada.**
>
> **Criado em:** 2024-10-17  
> **Atualizado em:** 2025-10-22  
> **Autor:** Codex (IA)

---

## 🎯 Visão Geral

O módulo financeiro é o núcleo do Barber Analytics Pro. Ele concentra recursos de **gestão de receitas e despesas**, projeção de **fluxo de caixa**, conciliação bancária e integração direta com o módulo de **DRE**. Todo o fluxo segue princípios de Clean Architecture: UI → Services → DTOs → Repositories → Supabase.

---

## 🔑 Capacidades Principais

- ✅ **Contabilidade por Competência** — controle de `accrual_start_date`, `accrual_end_date` e datas efetivas de recebimento/pagamento.
- ✅ **Gestão de Receitas e Despesas** — DTOs rigorosos (`revenueDTO`, `expenseDTO`) com whitelists/blacklists e cálculos derivados.
- ✅ **Conciliação Bancária** — importação OFX/CSV, match automático via hashes (`hash_unique`) e reconciliação de lançamentos.
- ✅ **Fluxo de Caixa** — projeções e históricos geridos por `cashflowService` e `dashboardService`.
- ✅ **Integração com DRE** — fornece dados para `dreService` gerar demonstrativos.

---

## 🧱 Arquitetura Interna

| Camada         | Arquivos Chave                                                                   | Responsabilidade                                  |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| UI             | `src/pages/FinanceiroAdvancedPage/*`, componentes em `atoms/molecules/organisms` | Formulários, tabelas e dashboards financeiros     |
| Application    | `financeiroService.js`, `cashflowService.js`, `dashboardService.js`              | Orquestração e regras de negócio                  |
| Domain         | `src/dtos/{revenue,expense}DTO.js`                                               | Validação (Zod/classes), whitelists, normalização |
| Infrastructure | `src/repositories/{revenue,expense}Repository.js` • `bankStatementRepository.js` | Persistência e filtros Supabase                   |

---

## 🗄️ Modelagem de Dados

- **Tabela `revenues`**
  - Valores principais: `value`, `gross_amount`, `net_amount`, `fees`.
  - Relacionamentos: `unit_id`, `account_id`, `payment_method_id`, `category_id`, `party_id`, `professional_id`, `user_id`.
  - Datas: `date`, `expected_receipt_date`, `actual_receipt_date`, campos de competência.
  - Metadados: `status`, `source`, `source_hash`, `observations`.

- **Tabela `expenses`**
  - Campos equivalentes a receitas, adicionando `type` (enum) e `expected_payment_date`/`actual_payment_date`.

- **Views e auxiliares**
  - `vw_turn_list_complete`, `vw_turn_history_complete` (integração com Lista da Vez).
  - Funções financeiras em migrations Supabase (ver `docs/DATABASE_SCHEMA.md`).

---

## 🔄 Fluxos Essenciais

### 📥 Criação de Receita (`financeiroService.createReceita`)

1. **Validação** – `CreateRevenueDTO` (whitelist + mensagens Zod).
2. **Regras Negócio** – cálculos derivados (`gross/net`, accrual defaults).
3. **Persistência** – `revenueRepository.create()` com sanitização redundante.
4. **Resposta** – `RevenueResponseDTO` normaliza status/textos para UI.

### 🔁 Conciliação Bancária

1. Upload (OFX/CSV) → `importExpensesFromOFX`, `importRevenueFromStatement`.
2. Parser → `bankFileParser` gera `hash_unique`.
3. Deduplicação → `duplicateDetector`.
4. Reconciliação → `reconciliationService` relaciona statement ↔ receita/despesa.
5. Atualização de status (`Pending`, `Received`, `Paid`, etc.).

### 📊 DRE & Fluxo de Caixa

- `cashflowService` agrega dados por período (realizado vs. projetado).
- `dreService` consulta funções SQL (via Supabase RPC) para gerar a demonstração.

---

## 🎨 Experiência de Usuário

- **Financeiro Advanced Page** (`src/pages/FinanceiroAdvancedPage/*`):
  - Tabs para Receitas, Despesas, Conciliação, Contas Bancárias.
  - Modais de criação/edição reutilizam atoms/molecules (ex.: `NovaDespesaAccrualModal`).
- **Componentes-chave**: `CashflowChartCard`, `BankAccountCard`, `ReconciliationMatchCard`.

---

## 🧪 Testes e Qualidade

- ✅ Testes unitários iniciais (`financial-basics.spec.ts`).
- 🔄 Recomendações:
  - Mock de Supabase nos services (`revenueRepository`, `reconciliationService`).
  - Testes de importação com fixtures OFX/CSV (pasta `tests/__fixtures__/`).
  - Futuro: cenários Playwright cobrindo cadastro, conciliação e fluxo DRE.

---

## 🛠️ Observabilidade & Logging

- Repositories e services possuem logs detalhados (console) para auditoria.
- Edge Function `monthly-reset` registra execução para reset da Lista da Vez (impacta indicadores financeiros).

---

## � Conciliação Bancária - Modo Avançado

### 📋 Visão Geral

O sistema de conciliação bancária permite importar extratos e realizar match automático com receitas e despesas cadastradas, facilitando o controle financeiro e auditoria.

### 🎯 Funcionalidades

#### 1. **Importação de Extratos**

- Suporta formatos: OFX, CSV, Excel
- Parser automático com detecção de campos
- Normalização de datas e valores
- Geração de `source_hash` para deduplicação

#### 2. **Auto-Match Inteligente**

- **Algoritmo de Matching:**
  - Match por valor e data (±3 dias)
  - Busca em `revenues` e `expenses` não reconciliadas
  - Score de confiança: HIGH (>95%), MEDIUM (80-95%), LOW (<80%)
- **Critérios de Matching:**
  ```javascript
  - Valor exato + data no range
  - Descrição similar (fuzzy match)
  - Party/profissional relacionado
  - Categoria correspondente
  ```

#### 3. **Revisão Manual**

- Interface com 3 componentes:
  - `ConfidenceBadge`: Badge visual do nível de confiança
  - `MatchTable`: Tabela comparativa statement ↔ transaction
  - `AutoMatchStep`: Step wizard para revisão em batch
- **Ações disponíveis:**
  - ✅ Confirmar match (atualiza `reconciled = true`)
  - ❌ Rejeitar match (mantém statement não reconciliado)
  - 🔍 Ver detalhes da transação
  - 📝 Criar receita/despesa manualmente

#### 4. **Audit Trail**

- Todos os matches confirmados/rejeitados são registrados em `access_logs`
- Campos rastreados:
  - `user_id`: Quem executou a ação
  - `action`: confirm_reconciliation / reject_reconciliation
  - `metadata`: statement_id, reference_type, reference_id, confidence_score
  - `timestamp`: Data/hora da ação

### 🗄️ Tabela `reconciliations`

```sql
CREATE TABLE reconciliations (
    id UUID PRIMARY KEY,
    unit_id UUID NOT NULL,
    bank_statement_id UUID NOT NULL,
    reference_type VARCHAR(50), -- 'revenue' | 'expense'
    reference_id UUID,
    confidence_score DECIMAL(5,2), -- 0-100
    status VARCHAR(20), -- 'pending' | 'confirmed' | 'rejected'
    matched_by_user_id UUID,
    matched_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### 🔧 Services e Repositories

#### `reconciliationService.js`

- `autoReconcile(unitId, statements)` — Match automático
- `confirmReconciliation(reconciliationId, userId)` — Confirmar match
- `rejectReconciliation(reconciliationId, userId)` — Rejeitar match
- `getReconciliationSummary(unitId, dateRange)` — Dashboard de conciliação

#### `bankStatementRepository.js`

- `createMany(statements)` — Inserção em batch de extratos
- `getUnreconciled(unitId, dateRange)` — Buscar pendentes
- `updateReconciliationStatus(statementId, status)` — Atualizar status

### 📊 Dashboard de Conciliação

**Métricas exibidas:**

- Total de transações importadas no período
- Quantidade reconciliada vs. pendente
- Valor reconciliado vs. pendente
- Taxa de conciliação automática (%)
- Matches pendentes de revisão (HIGH, MEDIUM, LOW)

**Filtros disponíveis:**

- Período (data início/fim)
- Conta bancária
- Status (reconciled, pending, rejected)
- Nível de confiança

### 🔒 Segurança (RLS Policies)

```sql
-- View reconciliations da própria unidade
CREATE POLICY "Users can view reconciliations from their unit"
    ON reconciliations FOR SELECT
    USING (unit_id IN (SELECT get_user_unit_ids()));

-- Insert reconciliations
CREATE POLICY "Users can insert reconciliations for their unit"
    ON reconciliations FOR INSERT
    WITH CHECK (unit_id IN (SELECT get_user_unit_ids()));

-- Update (confirm/reject)
CREATE POLICY "Users can update reconciliations from their unit"
    ON reconciliations FOR UPDATE
    USING (unit_id IN (SELECT get_user_unit_ids()));
```

### 🧪 Fixtures de Teste

Arquivo: `20251022000003_financial_module_fixtures.sql`

**Dados criados:**

- 3 bank statements (2 reconciled, 1 pending)
- Revenues e expenses relacionadas
- Reconciliations com diferentes níveis de confiança

**Como usar:**

```sql
-- Rodar após migrations principais
psql -U postgres -d barber_analytics -f supabase/migrations/20251022000003_financial_module_fixtures.sql
```

### 📱 UI Components

**Atomic Design Structure:**

```
src/
├── atoms/
│   └── ConfidenceBadge/ — Badge HIGH/MEDIUM/LOW
├── molecules/
│   └── MatchTable/ — Tabela comparativa
├── organisms/
│   └── AutoMatchStep/ — Wizard de revisão
└── templates/
    └── ImportStatementModal/ — Modal completo de importação
```

### 🚀 Fluxo Completo de Conciliação

1. **Importar** → Upload de arquivo OFX/CSV
2. **Parsear** → Normalização e validação de dados
3. **Match** → Auto-match inteligente com score
4. **Revisar** → Interface de revisão em batch
5. **Confirmar** → Atualização de status e audit log
6. **Dashboard** → Visualização de métricas e pendências

---

## 💳 Importação de Despesas OFX (NOVO)

### 🎯 Visão Geral

Fluxo especializado para importar despesas (transações DEBIT) diretamente de arquivos OFX, com categorização hierárquica, auto-detecção de fornecedores e marcação automática como pago.

### 📋 Funcionalidades

- ✅ **Upload OFX** — Aceita apenas arquivos `.ofx` (XML/SGML)
- ✅ **Filtragem DEBIT** — Importa apenas transações de débito (despesas)
- ✅ **Auto-Detecção de Categorias** — Reconhece categorias por palavras-chave
- ✅ **Auto-Detecção de Fornecedores** — Identifica fornecedores conhecidos
- ✅ **Criação Automática de Fornecedores** — Cria novos fornecedores quando necessário
- ✅ **Seleção Manual de Categorias** — Dropdown hierárquico (Categoria Pai → Filho)
- ✅ **Marcação como Pago** — Todas despesas importadas são marcadas como `Paid`
- ✅ **Dedupe Inteligente** — Hash único evita duplicatas

### 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  ConciliacaoTab.jsx (Página Principal)                      │
│  ├─ Botão "Importar Despesas (OFX)"                         │
│  └─ ImportExpensesFromOFXModal                              │
│      ├─ Step 1: Upload OFX + Seleção de Conta               │
│      ├─ Step 2: Seleção Manual de Categorias                │
│      └─ Step 3: Preview + Confirmação                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  ImportExpensesFromOFXService                                │
│  ├─ readOFXFile() → Parse XML/SGML                          │
│  ├─ validateTransactions() → Filtrar DEBIT                  │
│  ├─ normalizeData() → Detectar categoria/fornecedor         │
│  ├─ enrichData() → Auto-criar suppliers                     │
│  ├─ applyUserCategorySelections() → Override manual         │
│  ├─ markAllAsPaid() → Status Paid + datas                   │
│  └─ insertApprovedRecords() → Persistir no banco            │
└─────────────────────────────────────────────────────────────┘
```

### 🧩 Componentes

#### 1. `ImportExpensesFromOFXModal.jsx`
**Template (Organism)** — Modal multi-step para importação de despesas

**Props:**
- `isOpen: boolean` — Controla visibilidade do modal
- `onClose: () => void` — Callback ao fechar
- `onSuccess: (report) => void` — Callback ao finalizar importação
- `availableAccounts: Array` — Lista de contas bancárias
- `defaultAccountId: string` — Conta pré-selecionada
- `unitId: string` — ID da unidade

**Steps:**
1. **Upload OFX** — Seleção de conta e upload de arquivo `.ofx`
2. **Categorização** — Tabela com dropdown hierárquico por despesa
3. **Preview** — Resumo com estatísticas e confirmação final

#### 2. `CategoryHierarchicalDropdown.jsx`
**Molecule** — Dropdown com categorias hierárquicas (pai → filho)

**Props:**
- `categories: Array` — Árvore de categorias `[{id, name, parent_id, children}]`
- `value: string` — ID da categoria selecionada
- `onChange: (categoryId) => void` — Callback ao selecionar
- `placeholder: string` — Texto placeholder
- `required: boolean` — Campo obrigatório
- `disabled: boolean` — Campo desabilitado
- `error: string` — Mensagem de erro
- `label: string` — Label do campo

**Renderização:**
- Categorias pai: **bold**, desabilitadas
- Categorias filho: indentadas com `└─`, selecionáveis

### 🔄 Fluxo End-to-End

```mermaid
sequenceDiagram
    participant U as Usuário
    participant M as ImportExpensesFromOFXModal
    participant S as ImportExpensesFromOFXService
    participant P as PartiesService
    participant R as Repository
    participant DB as Supabase

    U->>M: Clica "Importar Despesas (OFX)"
    M->>U: Abre modal (Step 1)
    U->>M: Seleciona conta + Upload .ofx
    M->>S: readOFXFile(file)
    S->>S: parseOFX() → Extrai transações
    S->>S: validateTransactions() → Filtra DEBIT
    S->>M: {data: Array<Transaction>}
    M->>S: normalizeData(transactions)
    S->>S: Detecta categorias/fornecedores
    S->>M: {normalized: Array}
    M->>U: Exibe Step 2 (Seleção de Categorias)
    U->>M: Ajusta categorias via dropdown
    U->>M: Clica "Gerar Preview"
    M->>S: applyUserCategorySelections()
    M->>S: enrichData() → Auto-criar suppliers
    S->>P: getParties({tipo: 'Fornecedor'})
    P->>S: {data: Array<Supplier>}
    S->>P: createParty() para novos
    P->>S: {data: NewSupplier}
    M->>S: markAllAsPaid()
    S->>M: {enriched: Array}
    M->>U: Exibe Step 3 (Preview)
    U->>M: Confirma importação
    M->>S: insertApprovedRecords()
    S->>R: bulkCreate(expenses + statements)
    R->>DB: INSERT INTO expenses, bank_statements
    DB->>R: {success: true}
    R->>S: {success: X, duplicates: Y}
    S->>M: {report: Object}
    M->>U: Fecha modal + Exibe toast de sucesso
```

### 🎨 Princípios de Design Aplicados

#### Usabilidade (Steve Krug, Don Norman)
- **Não me faça pensar** — Fluxo linear com 3 steps numerados
- **Feedback imediato** — Loading states, progress bar, toasts
- **Prevenção de erros** — Validação em cada step
- **Desfazer facilmente** — Botão "Voltar" sempre disponível

#### Atomic Design (Brad Frost)
- **Atoms** — Botões, inputs, badges, ícones
- **Molecules** — `CategoryHierarchicalDropdown`, `StatusBadge`
- **Organisms** — `ImportExpensesFromOFXModal`
- **Templates** — Layout do modal com steps
- **Pages** — `ConciliacaoTab` integra o modal

#### Clean Code (Robert C. Martin)
- **Single Responsibility** — Cada método tem uma única responsabilidade
- **Nomes semânticos** — `applyUserCategorySelections`, `markAllAsPaid`
- **Funções pequenas** — Máximo 20-30 linhas por função
- **Comentários apenas quando necessário** — Código autoexplicativo

### 🛡️ Segurança e Validação

1. **Whitelist/Blacklist** — DTO + Repository validam campos permitidos
2. **Hash Único** — `hash_unique = hash(date|amount|description|accountId)`
3. **Dedupe** — Verifica hashes existentes antes de inserir
4. **RLS Policies** — Garante `user_id` e `unit_id` via Row Level Security
5. **Sanitização** — Remove campos proibidos (`created_at`, `updated_at`, etc.)

### 📊 Detecção Automática de Categorias

O service usa mapa de palavras-chave para categorizar automaticamente:

```javascript
EXPENSE_CATEGORY_KEYWORDS = {
  Aluguel: ['ALUGUEL', 'RENT', 'IMOVEL', 'LOCACAO'],
  Telecomunicações: ['INTERNET', 'CLARO', 'VIVO', 'TIM', 'OI'],
  'Energia Elétrica': ['LUZ', 'ENERGIA', 'CEMIG', 'CPFL'],
  'Água e Saneamento': ['ÁGUA', 'AGUA', 'COPASA', 'SABESP'],
  Tecnologia: ['SISTEMA', 'SAAS', 'SOFTWARE', 'CLOUD'],
  'Folha de Pagamento': ['SALÁRIO', 'SALARIO', 'PAGAMENTO'],
  'Produtos e Insumos': ['PRODUTO', 'FORNECEDOR', 'COMPRA'],
  Marketing: ['MARKETING', 'FACEBOOK', 'GOOGLE', 'ADS'],
  Manutenção: ['MANUTENCAO', 'REPARO', 'CONSERTO'],
  Transporte: ['COMBUSTIVEL', 'GASOLINA', 'UBER', 'TAXI'],
}
```

### 📈 Métricas de Sucesso

- ✅ **Parsing OFX**: 100% de compatibilidade com formato padrão
- ✅ **Filtragem DEBIT**: Apenas despesas são importadas
- ✅ **Auto-detecção**: ≥70% de acurácia nas categorias
- ✅ **Auto-criação de Suppliers**: Sem duplicatas
- ✅ **Dedupe**: 0 duplicatas em reimportação
- ✅ **Status Paid**: 100% marcadas como pagas
- ✅ **Performance**: < 30 segundos para importação de 100 despesas

### 🧪 Exemplo de Uso

```javascript
// 1️⃣ Usuário clica em "Importar Despesas (OFX)"
<button onClick={() => setIsImportExpensesOFXModalOpen(true)}>
  Importar Despesas (OFX)
</button>

// 2️⃣ Modal abre com Step 1
<ImportExpensesFromOFXModal
  isOpen={isImportExpensesOFXModalOpen}
  onClose={() => setIsImportExpensesOFXModalOpen(false)}
  onSuccess={(report) => {
    console.log('✅ Importadas:', report.sucesso);
    refetchMatches();
  }}
  availableAccounts={availableAccounts}
  defaultAccountId={globalFilters.accountId}
  unitId={globalFilters.unitId}
/>

// 3️⃣ Service processa arquivo OFX
const { data, error } = await ImportExpensesFromOFXService.readFile(file);
const validation = ImportExpensesFromOFXService.validateTransactions(data);
const { normalized } = ImportExpensesFromOFXService.normalizeData(
  validation.transactions,
  { unitId, bankAccountId }
);

// 4️⃣ Usuário ajusta categorias no Step 2
<CategoryHierarchicalDropdown
  categories={categoriesTree}
  value={selectedCategoryId}
  onChange={(categoryId) => handleCategoryChange(index, categoryId)}
/>

// 5️⃣ Service marca como Paid e insere
let enriched = await ImportExpensesFromOFXService.enrichData(normalized, referenceData);
enriched = ImportExpensesFromOFXService.markAllAsPaid(enriched);
const results = await ImportExpensesFromOFXService.insertApprovedRecords(enriched, { unitId });

// 6️⃣ Relatório final
const report = ImportExpensesFromOFXService.generateReport(results, enriched, startTime);
// {
//   sucesso: 95,
//   duplicatas: 3,
//   erros: 2,
//   fornecedores_criados: 5,
//   tempo_execucao: "12.3s"
// }
```

### 🔗 Arquivos Relacionados

**Componentes:**
- `src/templates/ImportExpensesFromOFXModal.jsx` — Modal principal (1200+ linhas)
- `src/molecules/CategoryHierarchicalDropdown/CategoryHierarchicalDropdown.jsx` — Dropdown hierárquico

**Services:**
- `src/services/importExpensesFromOFX.js` — Lógica de importação (1100+ linhas)
  - `readOFXFile()` — Parser OFX
  - `validateTransactions()` — Filtra DEBIT
  - `normalizeData()` — Normalização e detecção
  - `enrichData()` — Enriquecimento com suppliers
  - `applyUserCategorySelections()` — Override manual
  - `markAllAsPaid()` — Status Paid
  - `insertApprovedRecords()` — Persistência
- `src/services/partiesService.js` — CRUD de fornecedores

**Hooks:**
- `src/hooks/useCategories.js` — `useCategoryTree()` retorna árvore hierárquica

**Repositórios:**
- `src/repositories/expenseRepository.js` — CRUD de despesas
- `src/repositories/bankStatementRepository.js` — CRUD de extratos

**Páginas:**
- `src/pages/FinanceiroAdvancedPage/ConciliacaoTab.jsx` — Integração do modal

---

## 📌 Próximas Evoluções

1. ✅ **COMPLETO**: Migrations completas do módulo financeiro
2. ✅ **COMPLETO**: RLS Policies documentadas
3. ✅ **COMPLETO**: Fixtures para QA/E2E
4. ✅ **COMPLETO**: Documentação de conciliação
5. 🔄 **TODO**: Implementar testes E2E de fluxo financeiro completo
6. 🔄 **TODO**: Unificar logs em solução estruturada (ex.: Pino + Supabase logs)
7. 🔄 **TODO**: Dashboard avançado de conciliação com gráficos

---

## 📚 Documentação Relacionada

- [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — Schema completo e RLS policies
- [`FINANCIAL_MODULE_CHECKLIST.md`](../FINANCIAL_MODULE_CHECKLIST.md) — Checklist de implementação
- [`RECONCILIATION_IMPLEMENTATION_REPORT.md`](../RECONCILIATION_IMPLEMENTATION_REPORT.md) — Relatório técnico de conciliação
- [`CONTRATOS.md`](CONTRATOS.md) — DTOs e validações
