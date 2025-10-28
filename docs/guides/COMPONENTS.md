# 🧩 Components Guide

> Guia completo dos componentes React do Barber Analytics Pro baseado em Atomic Design

**Versão**: 2.0
**Última Atualização**: 27/10/2025
**Padrão**: Atomic Design

---

## 📋 Índice

- [Atomic Design](#-atomic-design)
- [Atoms](#-atoms)
- [Molecules](#-molecules)
- [Organisms](#-organisms)
- [Templates](#-templates)
- [Pages](#-pages)
- [Como Criar Componentes](#-como-criar-componentes)
- [Best Practices](#-best-practices)

---

## ⚛️ Atomic Design

O projeto segue o padrão **Atomic Design** de Brad Frost para organização de componentes.

```
Atoms       →  Componentes básicos (Button, Input, Card)
Molecules   →  Combinações simples (FormField, KPICard)
Organisms   →  Seções complexas (Sidebar, DataTable)
Templates   →  Estruturas de página (Layout, Modal)
Pages       →  Páginas completas (DashboardPage, FinanceiroPage)
```

### Hierarquia Visual

```
Pages
  └─ usa Templates
       └─ usa Organisms
            └─ usa Molecules
                 └─ usa Atoms
```

---

## 🔹 Atoms

Componentes básicos e indivisíveis do sistema.

### Button

**Arquivo**: `src/atoms/Button/Button.jsx`

```javascript
import { Button } from '@/atoms/Button';

// Variantes
<Button variant="primary">Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="danger">Excluir</Button>
<Button variant="ghost">Voltar</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio (default)</Button>
<Button size="lg">Grande</Button>

// Estados
<Button disabled>Desabilitado</Button>
<Button loading>Carregando...</Button>

// Com ícone
<Button leftIcon={<SaveIcon />}>Salvar</Button>
<Button rightIcon={<ArrowRightIcon />}>Avançar</Button>
```

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}
```

---

### Input

**Arquivo**: `src/atoms/Input/Input.jsx`

```javascript
import { Input } from '@/atoms/Input';

// Básico
<Input
  label="Nome"
  placeholder="Digite seu nome"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Com validação
<Input
  label="Email"
  type="email"
  error="Email inválido"
  required
/>

// Com máscara
<Input
  label="CPF"
  mask="999.999.999-99"
/>

// Número
<Input
  label="Valor"
  type="number"
  prefix="R$"
  step="0.01"
/>
```

**Props**:
```typescript
interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  mask?: string;
}
```

---

### Card

**Arquivo**: `src/atoms/Card/Card.jsx`

```javascript
import { Card } from '@/atoms/Card';

// Simples
<Card>
  <p>Conteúdo do card</p>
</Card>

// Com cabeçalho
<Card
  title="Título do Card"
  subtitle="Descrição opcional"
>
  <p>Conteúdo</p>
</Card>

// Com ações
<Card
  title="Card com Ações"
  actions={
    <Button size="sm">Editar</Button>
  }
>
  <p>Conteúdo</p>
</Card>

// Variantes
<Card variant="elevated">Card com sombra</Card>
<Card variant="outlined">Card com borda</Card>
```

---

## 🔸 Molecules

Combinações de atoms que formam componentes funcionais.

### KPICard

**Arquivo**: `src/molecules/KPICard/KPICard.jsx`

```javascript
import { KPICard } from '@/molecules/KPICard';

<KPICard
  title="Faturamento"
  value={45000}
  format="currency"
  icon={<DollarIcon />}
  trend={{
    value: 12.5,
    direction: 'up',
    label: 'vs mês anterior'
  }}
  color="green"
/>

// Outros formatos
<KPICard title="Atendimentos" value={526} format="number" />
<KPICard title="Ticket Médio" value={85.50} format="currency" />
<KPICard title="Margem" value={37.8} format="percentage" />
```

**Props**:
```typescript
interface KPICardProps {
  title: string;
  value: number;
  format: 'currency' | 'number' | 'percentage';
  icon?: React.ReactNode;
  color?: 'green' | 'blue' | 'red' | 'gray';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  loading?: boolean;
}
```

---

### CategoryHierarchicalDropdown

**Arquivo**: `src/molecules/CategoryHierarchicalDropdown/CategoryHierarchicalDropdown.jsx`

```javascript
import { CategoryHierarchicalDropdown } from '@/molecules/CategoryHierarchicalDropdown';

<CategoryHierarchicalDropdown
  label="Categoria"
  value={selectedCategory}
  onChange={setSelectedCategory}
  type="expense" // ou "revenue"
  required
/>
```

Exibe categorias em hierarquia:
```
📁 Despesas Fixas
  ├─ Aluguel
  ├─ Salários
  └─ Impostos
📁 Despesas Variáveis
  ├─ Produtos
  └─ Comissões
```

---

### FormField

**Arquivo**: `src/molecules/FormField/FormField.jsx`

```javascript
import { FormField } from '@/molecules/FormField';

// Field completo com validação React Hook Form
<FormField
  name="description"
  label="Descrição"
  type="text"
  placeholder="Digite a descrição"
  control={control}
  rules={{
    required: 'Campo obrigatório',
    minLength: { value: 3, message: 'Mínimo 3 caracteres' }
  }}
/>

// Select
<FormField
  name="category"
  label="Categoria"
  type="select"
  options={categories}
  control={control}
/>

// Textarea
<FormField
  name="notes"
  label="Observações"
  type="textarea"
  rows={4}
  control={control}
/>
```

---

## 🔶 Organisms

Seções complexas com lógica de negócio.

### Sidebar

**Arquivo**: `src/organisms/Sidebar/Sidebar.jsx`

```javascript
import { Sidebar } from '@/organisms/Sidebar';

// Usado no Layout principal
<Sidebar
  isOpen={isSidebarOpen}
  onClose={() => setSidebarOpen(false)}
  user={currentUser}
  currentPath={pathname}
/>
```

**Funcionalidades**:
- Navegação hierárquica
- Controle de permissões (admin, gerente, barbeiro)
- Responsivo (drawer no mobile)
- Indicador de página ativa
- Logout

**Menu por Perfil**:
```javascript
// Admin vê tudo
- Dashboard
- Financeiro
  - Despesas
  - Receitas
  - Conciliação
  - DRE
- Lista da Vez
- Relatórios
- Cadastros
  - Unidades
  - Profissionais
  - Clientes
  - Categorias
- Configurações
  - Usuários
  - Perfil

// Gerente vê apenas sua unidade
- Dashboard
- Financeiro
- Lista da Vez
- Relatórios
- Profissionais
- Perfil

// Barbeiro vê apenas operacional
- Lista da Vez
- Meus Atendimentos
- Perfil
```

---

### DataTable

**Arquivo**: `src/organisms/DataTable/DataTable.jsx`

```javascript
import { DataTable } from '@/organisms/DataTable';

const columns = [
  {
    header: 'Data',
    accessorKey: 'date',
    cell: ({ value }) => formatDate(value)
  },
  {
    header: 'Descrição',
    accessorKey: 'description'
  },
  {
    header: 'Valor',
    accessorKey: 'amount',
    cell: ({ value }) => formatCurrency(value),
    align: 'right'
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ value }) => <StatusBadge status={value} />
  },
  {
    header: 'Ações',
    accessorKey: 'id',
    cell: ({ row }) => (
      <>
        <Button onClick={() => handleEdit(row)}>Editar</Button>
        <Button onClick={() => handleDelete(row)}>Excluir</Button>
      </>
    )
  }
];

<DataTable
  columns={columns}
  data={expenses}
  loading={isLoading}
  pagination={{
    pageSize: 10,
    total: totalCount
  }}
  onRowClick={(row) => console.log(row)}
  emptyMessage="Nenhuma despesa encontrada"
/>
```

**Features**:
- Ordenação por coluna
- Paginação
- Seleção de linhas
- Loading state
- Empty state
- Responsivo (scroll horizontal no mobile)

---

### ConciliacaoPanel

**Arquivo**: `src/organisms/ConciliacaoPanel/ConciliacaoPanel.jsx`

```javascript
import { ConciliacaoPanel } from '@/organisms/ConciliacaoPanel';

<ConciliacaoPanel
  bankStatementId="statement-123"
  onComplete={() => {
    toast.success('Conciliação concluída!');
    refetchKPIs();
  }}
/>
```

**Fluxo**:
1. Upload de extrato OFX
2. Parsing automático
3. Auto-matching com confiança
4. Revisão manual
5. Confirmação
6. Atualização de receitas

**Features**:
- Drag and drop de arquivos
- Progress indicator
- Match suggestions com score
- Undo/redo
- Batch actions

---

### FluxoSummaryPanel

**Arquivo**: `src/organisms/FluxoSummaryPanel/FluxoSummaryPanel.jsx`

```javascript
import { FluxoSummaryPanel } from '@/organisms/FluxoSummaryPanel';

<FluxoSummaryPanel
  unitId={selectedUnit.id}
  period={{ month: 10, year: 2025 }}
  onFilterChange={handleFilterChange}
/>
```

Exibe:
- Total de entradas
- Total de saídas
- Saldo
- Gráfico de linha temporal
- Filtros (período, categoria, status)

---

## 📄 Templates

Estruturas de layout e modais.

### NovaReceitaAccrualModal

**Arquivo**: `src/templates/NovaReceitaAccrualModal/NovaReceitaAccrualModal.jsx`

```javascript
import { NovaReceitaAccrualModal } from '@/templates/NovaReceitaAccrualModal';

<NovaReceitaAccrualModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={(revenue) => {
    toast.success('Receita criada!');
    refetchRevenues();
  }}
  initialData={{
    unit_id: selectedUnit.id,
    date: today()
  }}
/>
```

**Features**:
- Formulário completo com React Hook Form
- Validação com Zod
- Auto-categorização por IA
- Sugestão de duplicatas
- Cálculo automático de comissões

---

### NovaDespesaModal

Similar ao de receita, mas para despesas:

```javascript
<NovaDespesaModal
  isOpen={isOpen}
  onClose={onClose}
  onSuccess={onSuccess}
  mode="create" // ou "edit"
  despesa={despesaToEdit} // se mode="edit"
/>
```

---

## 📱 Pages

Páginas completas da aplicação.

### DashboardPage

**Arquivo**: `src/pages/DashboardPage/DashboardPage.jsx`

```javascript
// Estrutura
function DashboardPage() {
  const { selectedUnit } = useUnits();
  const { data: kpis } = useFinancialKPIs(selectedUnit.id);
  const { data: ranking } = useRankingProfissionais(selectedUnit.id);

  return (
    <MainContainer title="Dashboard">
      {/* Row de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Faturamento" value={kpis.revenue} ... />
        <KPICard title="Despesas" value={kpis.expenses} ... />
        <KPICard title="Lucro" value={kpis.profit} ... />
        <KPICard title="Margem" value={kpis.margin} ... />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Receita x Despesa">
          <LineChart data={kpis.timeline} />
        </Card>
        <Card title="Ranking de Profissionais">
          <RankingTable data={ranking} />
        </Card>
      </div>
    </MainContainer>
  );
}
```

---

### FinanceiroAdvancedPage

**Arquivo**: `src/pages/FinanceiroAdvancedPage/FinanceiroAdvancedPage.jsx`

Página com tabs:
- Despesas (regime de competência)
- Receitas
- Conciliação Bancária
- Contas Bancárias

```javascript
function FinanceiroAdvancedPage() {
  const [activeTab, setActiveTab] = useState('despesas');

  return (
    <MainContainer title="Financeiro">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="despesas">Despesas</Tab>
        <Tab value="receitas">Receitas</Tab>
        <Tab value="conciliacao">Conciliação</Tab>
        <Tab value="contas">Contas Bancárias</Tab>
      </Tabs>

      {activeTab === 'despesas' && <DespesasTab />}
      {activeTab === 'receitas' && <ReceitasTab />}
      {activeTab === 'conciliacao' && <ConciliacaoTab />}
      {activeTab === 'contas' && <ContasBancariasTab />}
    </MainContainer>
  );
}
```

---

## 🛠️ Como Criar Componentes

### 1. Criar estrutura de pastas

```bash
# Atom
mkdir -p src/atoms/MyAtom
touch src/atoms/MyAtom/MyAtom.jsx
touch src/atoms/MyAtom/index.js

# Molecule
mkdir -p src/molecules/MyMolecule
touch src/molecules/MyMolecule/MyMolecule.jsx
touch src/molecules/MyMolecule/index.js

# Organism
mkdir -p src/organisms/MyOrganism
touch src/organisms/MyOrganism/MyOrganism.jsx
touch src/organisms/MyOrganism/index.js
```

### 2. Implementar componente

```javascript
// src/atoms/Badge/Badge.jsx
import PropTypes from 'prop-types';

/**
 * Badge component for status indicators
 * @component
 */
export function Badge({ variant = 'default', children, ...props }) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'danger']),
  children: PropTypes.node.isRequired
};
```

### 3. Criar barrel export

```javascript
// src/atoms/Badge/index.js
export { Badge } from './Badge';
```

### 4. Adicionar ao index principal

```javascript
// src/atoms/index.js
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Badge } from './Badge'; // novo
```

### 5. Documentar uso

```javascript
// src/atoms/Badge/Badge.stories.jsx (opcional - Storybook)
export default {
  title: 'Atoms/Badge',
  component: Badge
};

export const Default = () => <Badge>Default</Badge>;
export const Success = () => <Badge variant="success">Success</Badge>;
export const Warning = () => <Badge variant="warning">Warning</Badge>;
export const Danger = () => <Badge variant="danger">Danger</Badge>;
```

---

## ✅ Best Practices

### 1. Nomenclatura

```javascript
// ✅ Bom
function KPICard({ title, value }) { }
function UserProfileModal() { }
function useRevenues() { }

// ❌ Ruim
function kpicard() { } // lowercase
function modal() { } // genérico demais
function getRevenues() { } // não é hook
```

### 2. Props Destructuring

```javascript
// ✅ Bom
function Button({ variant, size, children, ...rest }) {
  return <button className={...} {...rest}>{children}</button>;
}

// ❌ Ruim
function Button(props) {
  return <button className={...}>{props.children}</button>;
}
```

### 3. PropTypes ou TypeScript

```javascript
// ✅ Bom
import PropTypes from 'prop-types';

function Card({ title, children }) { }

Card.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

// Ou TypeScript
interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) { }
```

### 4. Composition over Props

```javascript
// ✅ Bom - Composition
<Modal>
  <Modal.Header>Título</Modal.Header>
  <Modal.Body>Conteúdo</Modal.Body>
  <Modal.Footer>
    <Button>Cancelar</Button>
    <Button variant="primary">Salvar</Button>
  </Modal.Footer>
</Modal>

// ❌ Ruim - Props demais
<Modal
  title="Título"
  content="Conteúdo"
  primaryButton="Salvar"
  secondaryButton="Cancelar"
  onPrimary={() => {}}
  onSecondary={() => {}}
/>
```

### 5. Evite Props Drilling

```javascript
// ✅ Bom - Context
function Dashboard() {
  return (
    <UnitProvider>
      <KPISection />
      <ChartsSection />
    </UnitProvider>
  );
}

function KPISection() {
  const { selectedUnit } = useUnit();
  // Usa diretamente do context
}

// ❌ Ruim - Prop drilling
function Dashboard() {
  const [unit, setUnit] = useState(null);
  return (
    <KPISection unit={unit} />
    <ChartsSection unit={unit} />
  );
}
```

### 6. Memoização quando necessário

```javascript
import { memo, useMemo } from 'react';

// Componente pesado que não muda frequentemente
export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return heavyCalculation(data);
  }, [data]);

  return <div>{processedData}</div>;
});
```

### 7. Error Boundaries

```javascript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <h2>Algo deu errado</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Tentar novamente</button>
    </div>
  );
}

function MyPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyComplexComponent />
    </ErrorBoundary>
  );
}
```

### 8. Acessibilidade

```javascript
// ✅ Bom
<button
  aria-label="Fechar modal"
  onClick={onClose}
>
  <XIcon aria-hidden="true" />
</button>

<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && <span id="email-error" role="alert">{error}</span>}

// ❌ Ruim
<div onClick={onClose}>X</div> // não é botão
<input type="email" /> // sem aria
```

---

## 📚 Referências

- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [React Patterns](https://reactpatterns.com)
- [React Best Practices](https://react.dev/learn)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Design System](../DESIGN_SYSTEM.md)
- [Code Conventions](./CODE_CONVENTIONS.md)

---

**Última atualização**: 27/10/2025
**Próxima revisão**: 27/01/2026
