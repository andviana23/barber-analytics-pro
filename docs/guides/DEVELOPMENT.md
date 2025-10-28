# 💻 Guia de Desenvolvimento

> **Objetivo**: Este guia cobre o workflow diário de desenvolvimento, estrutura de código, e melhores práticas para contribuir com o Barber Analytics Pro.

---

## 📋 Índice

- [Workflow Diário](#-workflow-diário)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Criando Componentes](#-criando-componentes)
- [Criando Serviços](#-criando-serviços)
- [Hooks Customizados](#-hooks-customizados)
- [Trabalhando com Estado](#-trabalhando-com-estado)
- [Debug e Ferramentas](#-debug-e-ferramentas)
- [Hot Reload e Performance](#-hot-reload-e-performance)

---

## 🔄 Workflow Diário

### 1. Iniciar o Dia

```bash
# Atualizar a branch main
git checkout main
git pull origin main

# Criar branch para sua feature
git checkout -b feature/nome-da-feature

# Instalar dependências (se houver atualizações)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### 2. Durante o Desenvolvimento

```bash
# Terminal 1: Servidor de desenvolvimento
npm run dev

# Terminal 2: Testes em watch mode
npm run test

# Terminal 3: Linter (se necessário)
npm run lint -- --watch
```

### 3. Antes de Commitar

```bash
# 1. Rodar testes
npm run test:run

# 2. Verificar linting
npm run lint

# 3. Formatar código
npm run format

# 4. Build de produção (verificação)
npm run build

# 5. Commit
git add .
git commit -m "feat: descrição da feature"

# 6. Push
git push origin feature/nome-da-feature
```

### 4. Code Review

Antes de abrir PR:

- ✅ Todos os testes passando
- ✅ Linting sem erros
- ✅ Build sem erros
- ✅ Documentação atualizada
- ✅ Screenshots (se houver mudanças visuais)

---

## 📁 Estrutura de Pastas

### Overview Completo

```
src/
├── atoms/              # 🔹 Componentes atômicos (Button, Input, Card)
├── molecules/          # 🔸 Componentes moleculares (KPICard, FormField)
├── organisms/          # 🔶 Componentes orgânicos (Sidebar, Navbar)
├── templates/          # 📄 Templates de modais e layouts avançados
├── pages/              # 📱 Páginas completas da aplicação
│
├── hooks/              # 🪝 Custom hooks React
├── context/            # 🌐 Context providers (Auth, Theme, Unit)
├── services/           # 💼 Lógica de negócio e orquestração
├── repositories/       # 🗄️ Camada de acesso a dados (Supabase)
├── dtos/               # 📋 Data Transfer Objects e validações
├── utils/              # 🛠️ Funções utilitárias reutilizáveis
└── types/              # 📝 Definições de tipos TypeScript
```

### Onde Colocar Novo Código?

| O que você está criando | Onde colocar | Exemplo |
|-------------------------|--------------|---------|
| Botão, input, ícone | `src/atoms/` | `Button.jsx`, `Input.jsx` |
| Card, form field | `src/molecules/` | `KPICard.jsx`, `FormField.jsx` |
| Sidebar, tabela complexa | `src/organisms/` | `Sidebar.jsx`, `DataTable.jsx` |
| Modal, wizard | `src/templates/` | `CreateUserModal.jsx` |
| Página completa | `src/pages/` | `DashboardPage.jsx` |
| Lógica de dados | `src/hooks/` | `useDashboard.js` |
| Regras de negócio | `src/services/` | `dashboardService.js` |
| Acesso ao banco | `src/repositories/` | `revenueRepository.js` |
| Validação de dados | `src/dtos/` | `revenueDTO.js` |
| Função auxiliar | `src/utils/` | `formatters.js` |

---

## 🎨 Criando Componentes

### Princípios do Atomic Design

O projeto segue **Atomic Design** de Brad Frost:

- **Atoms**: Componentes indivisíveis (Button, Input)
- **Molecules**: Combinações de atoms (FormField = Label + Input)
- **Organisms**: Seções complexas (Sidebar com navegação)
- **Templates**: Estruturas de layout (ModalTemplate)
- **Pages**: Instâncias específicas (DashboardPage)

### Estrutura de um Componente

#### Atoms (Componentes Básicos)

```javascript
// src/atoms/Button/Button.jsx
import { motion } from 'framer-motion';

/**
 * Botão reutilizável com variantes e estados
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo do botão
 * @param {'primary' | 'secondary' | 'danger'} props.variant - Variante visual
 * @param {'sm' | 'md' | 'lg'} props.size - Tamanho do botão
 * @param {boolean} props.disabled - Estado desabilitado
 * @param {Function} props.onClick - Callback de clique
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  ...props
}) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

**index.js** (sempre criar):
```javascript
// src/atoms/Button/index.js
export { default } from './Button';
```

#### Molecules (Componentes Compostos)

```javascript
// src/molecules/KPICard/KPICard.jsx
import Card from '../../atoms/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Card de KPI com valor, título e trend
 */
export default function KPICard({ title, value, trend, icon: Icon }) {
  const isPositive = trend >= 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold mt-2">{value}</h3>
        </div>

        {Icon && (
          <div className="p-3 bg-primary-100 rounded-full">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className={`flex items-center mt-4 text-sm ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </Card>
  );
}
```

#### Organisms (Componentes Complexos)

```javascript
// src/organisms/DashboardKPIs/DashboardKPIs.jsx
import { useDashboard } from '../../hooks/useDashboard';
import KPICard from '../../molecules/KPICard';
import { DollarSign, Users, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * Grid de KPIs do dashboard
 */
export default function DashboardKPIs() {
  const { data: kpis, isLoading } = useDashboard();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KPICard
        title="Receita Total"
        value={formatCurrency(kpis.revenue)}
        trend={kpis.revenueTrend}
        icon={DollarSign}
      />

      <KPICard
        title="Clientes Ativos"
        value={kpis.activeClients}
        trend={kpis.clientsTrend}
        icon={Users}
      />

      <KPICard
        title="Atendimentos"
        value={kpis.appointments}
        trend={kpis.appointmentsTrend}
        icon={ShoppingCart}
      />
    </div>
  );
}
```

### Checklist de Componente

Antes de considerar um componente pronto:

- ✅ Comentário JSDoc no topo
- ✅ PropTypes ou validação com Zod
- ✅ Estados de loading/error tratados
- ✅ Responsivo (mobile-first)
- ✅ Acessível (ARIA labels, keyboard nav)
- ✅ Exportado via index.js
- ✅ Teste unitário criado

---

## 💼 Criando Serviços

### Estrutura de um Service

Services orquestram lógica de negócio e coordenam repositories.

```javascript
// src/services/revenueService.js
import { revenueRepository } from '../repositories/revenueRepository';
import { RevenueDTO } from '../dtos/revenueDTO';
import { calculateStatus } from './statusCalculator';

/**
 * Service de receitas - orquestra regras de negócio
 */
export const revenueService = {
  /**
   * Busca receitas com status calculado
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Array>} Lista de receitas
   */
  async getRevenues(filters = {}) {
    try {
      // 1. Buscar dados no repository
      const revenues = await revenueRepository.findAll(filters);

      // 2. Aplicar regras de negócio
      const enrichedRevenues = revenues.map(revenue => ({
        ...revenue,
        status: calculateStatus(revenue),
        isOverdue: this.isOverdue(revenue),
      }));

      // 3. Validar com DTO
      return enrichedRevenues.map(r => RevenueDTO.fromDatabase(r));
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
      throw new Error('Falha ao carregar receitas');
    }
  },

  /**
   * Cria nova receita
   * @param {Object} data - Dados da receita
   * @returns {Promise<Object>} Receita criada
   */
  async createRevenue(data) {
    try {
      // 1. Validar com DTO
      const validatedData = RevenueDTO.toDatabase(data);

      // 2. Aplicar regras de negócio
      const enrichedData = {
        ...validatedData,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // 3. Persistir
      const revenue = await revenueRepository.create(enrichedData);

      // 4. Retornar DTO
      return RevenueDTO.fromDatabase(revenue);
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      throw error;
    }
  },

  /**
   * Verifica se receita está vencida
   * @private
   */
  isOverdue(revenue) {
    if (revenue.status === 'paid') return false;
    return new Date(revenue.due_date) < new Date();
  },
};
```

### Repository Pattern

Repositories abstraem acesso ao Supabase:

```javascript
// src/repositories/revenueRepository.js
import { supabase } from '../services/supabase';

/**
 * Repository de receitas - acesso a dados
 */
export const revenueRepository = {
  /**
   * Busca todas as receitas
   */
  async findAll(filters = {}) {
    let query = supabase
      .from('revenues')
      .select('*, parties(name), payment_methods(name)');

    // Aplicar filtros
    if (filters.unitId) {
      query = query.eq('unit_id', filters.unitId);
    }

    if (filters.startDate && filters.endDate) {
      query = query
        .gte('transaction_date', filters.startDate)
        .lte('transaction_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  /**
   * Busca receita por ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('revenues')
      .select('*, parties(name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cria nova receita
   */
  async create(data) {
    const { data: revenue, error } = await supabase
      .from('revenues')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return revenue;
  },

  /**
   * Atualiza receita
   */
  async update(id, data) {
    const { data: revenue, error } = await supabase
      .from('revenues')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return revenue;
  },

  /**
   * Deleta receita
   */
  async delete(id) {
    const { error } = await supabase
      .from('revenues')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
```

### Data Transfer Objects (DTOs)

DTOs validam e transformam dados:

```javascript
// src/dtos/revenueDTO.js
import { z } from 'zod';

/**
 * Schema de validação Zod
 */
const revenueSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(3, 'Descrição muito curta'),
  transaction_date: z.string().datetime(),
  due_date: z.string().datetime().optional(),
  party_id: z.string().uuid(),
  payment_method_id: z.string().uuid(),
  unit_id: z.string().uuid(),
});

/**
 * DTO de Receita
 */
export class RevenueDTO {
  /**
   * Converte dados do formulário para banco
   */
  static toDatabase(data) {
    // Validar com Zod
    const validated = revenueSchema.parse(data);

    // Transformar
    return {
      ...validated,
      amount: parseFloat(validated.amount),
      status: 'pending',
    };
  }

  /**
   * Converte dados do banco para UI
   */
  static fromDatabase(data) {
    return {
      ...data,
      amount: parseFloat(data.amount),
      formattedAmount: this.formatCurrency(data.amount),
      partyName: data.parties?.name || 'Desconhecido',
      isOverdue: data.status !== 'paid' && new Date(data.due_date) < new Date(),
    };
  }

  static formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
```

---

## 🪝 Hooks Customizados

### Estrutura de um Hook

```javascript
// src/hooks/useRevenues.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revenueService } from '../services/revenueService';
import { useUnit } from '../context/UnitContext';
import toast from 'react-hot-toast';

/**
 * Hook para gerenciar receitas
 */
export function useRevenues(filters = {}) {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  // Query: buscar receitas
  const {
    data: revenues,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['revenues', selectedUnit?.id, filters],
    queryFn: () => revenueService.getRevenues({
      ...filters,
      unitId: selectedUnit?.id,
    }),
    enabled: !!selectedUnit,
    staleTime: 30000, // 30 segundos
  });

  // Mutation: criar receita
  const createMutation = useMutation({
    mutationFn: revenueService.createRevenue,
    onSuccess: () => {
      queryClient.invalidateQueries(['revenues']);
      toast.success('Receita criada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar receita: ${error.message}`);
    },
  });

  // Mutation: atualizar receita
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => revenueService.updateRevenue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['revenues']);
      toast.success('Receita atualizada!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Mutation: deletar receita
  const deleteMutation = useMutation({
    mutationFn: revenueService.deleteRevenue,
    onSuccess: () => {
      queryClient.invalidateQueries(['revenues']);
      toast.success('Receita removida!');
    },
    onError: (error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  return {
    // Data
    revenues: revenues || [],
    isLoading,
    error,

    // Actions
    refetch,
    createRevenue: createMutation.mutate,
    updateRevenue: updateMutation.mutate,
    deleteRevenue: deleteMutation.mutate,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

### Usando o Hook

```javascript
// Em um componente
function RevenuesPage() {
  const {
    revenues,
    isLoading,
    createRevenue,
    deleteRevenue,
    isCreating,
  } = useRevenues();

  const handleCreate = (data) => {
    createRevenue(data);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <CreateRevenueButton
        onClick={handleCreate}
        isLoading={isCreating}
      />
      <RevenuesList
        revenues={revenues}
        onDelete={deleteRevenue}
      />
    </div>
  );
}
```

---

## 🌐 Trabalhando com Estado

### Context API

```javascript
// src/context/UnitContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const UnitContext = createContext();

export function UnitProvider({ children }) {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    // Carregar unidade do localStorage
    const savedUnit = localStorage.getItem('selectedUnit');
    if (savedUnit) {
      setSelectedUnit(JSON.parse(savedUnit));
    }
  }, []);

  const selectUnit = (unit) => {
    setSelectedUnit(unit);
    localStorage.setItem('selectedUnit', JSON.stringify(unit));
  };

  return (
    <UnitContext.Provider value={{
      selectedUnit,
      units,
      selectUnit,
      setUnits,
    }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnit must be used within UnitProvider');
  }
  return context;
}
```

### TanStack Query (Server State)

```javascript
// Prefetch em um loader
import { queryClient } from './queryClient';

// Em um loader do React Router
export async function dashboardLoader() {
  await queryClient.prefetchQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getKPIs,
  });

  return null;
}
```

---

## 🔍 Debug e Ferramentas

### React DevTools

Instale a extensão:
- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### TanStack Query DevTools

Já configurado no projeto:

```javascript
// src/main.jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Acesse: clique no ícone flutuante no canto inferior da tela.

### Supabase Logs

```javascript
// Habilitar logs detalhados
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  auth: {
    debug: true, // Logs de autenticação
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-my-custom-header': 'barber-analytics',
    },
  },
});
```

### Console Debugging

```javascript
// Adicionar pontos de debug
console.log('🔍 Data:', data);
console.table(revenues); // Visualizar arrays
console.time('fetch'); // Medir performance
// ... código
console.timeEnd('fetch');
```

### VSCode Debugging

Configuração `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug React App",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

---

## ⚡ Hot Reload e Performance

### Otimizando HMR (Hot Module Replacement)

```javascript
// vite.config.js
export default defineConfig({
  server: {
    hmr: {
      overlay: true, // Mostrar erros na tela
    },
    watch: {
      usePolling: true, // Para Windows/WSL
      interval: 100,
    },
  },
});
```

### Code Splitting

```javascript
// Lazy load de páginas
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FinanceiroPage = lazy(() => import('./pages/FinanceiroPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/financeiro" element={<FinanceiroPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoização

```javascript
import { memo, useMemo, useCallback } from 'react';

// Memoizar componente
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  return <div>{/* ... */}</div>;
});

// Memoizar computações
function MyComponent({ items }) {
  const sortedItems = useMemo(
    () => items.sort((a, b) => a.value - b.value),
    [items]
  );

  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return <div>{/* ... */}</div>;
}
```

---

## 📚 Recursos Adicionais

- [Code Conventions](./CODE_CONVENTIONS.md) - Padrões de código
- [Testing Guide](../TESTING.md) - Como escrever testes
- [Design System](../DESIGN_SYSTEM.md) - Componentes disponíveis
- [API Documentation](./API_DOCUMENTATION.md) - Endpoints e contratos

---

**Última atualização**: 2025-10-27
**Versão do guia**: 1.0.0
