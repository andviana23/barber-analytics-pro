# ❓ Perguntas Frequentes (FAQ)

> **Objetivo**: Respostas rápidas para as dúvidas mais comuns sobre o Barber Analytics Pro.

---

## 📋 Índice

- [Arquitetura e Tecnologia](#-arquitetura-e-tecnologia)
- [Supabase e Banco de Dados](#-supabase-e-banco-de-dados)
- [Desenvolvimento](#-desenvolvimento)
- [Testes](#-testes)
- [Deploy e Produção](#-deploy-e-produção)
- [Segurança](#-segurança)
- [Performance](#-performance)
- [Componentes e UI](#-componentes-e-ui)

---

## 🏗️ Arquitetura e Tecnologia

### Por que React 19?

**Resposta**: React 19 traz melhorias significativas:
- ✅ **Server Components**: Melhor performance
- ✅ **Actions**: Simplifica forms e mutações
- ✅ **useOptimistic**: UI otimista built-in
- ✅ **use() hook**: Simplifica async data fetching
- ✅ **Concurrent features**: Melhor responsividade

Estamos sempre na versão mais recente para aproveitar os últimos recursos.

---

### Por que Vite em vez de Create React App?

**Resposta**: Vite é superior ao CRA em vários aspectos:

| Aspecto | Vite | Create React App |
|---------|------|------------------|
| **Dev server** | ⚡ Instantâneo (ESM) | 🐌 Lento (Webpack) |
| **HMR** | ⚡ <50ms | 🐌 Segundos |
| **Build** | ⚡ Rápido (Rollup) | 🐌 Lento (Webpack) |
| **Tamanho bundle** | 📦 Otimizado | 📦 Maior |
| **Configuração** | ⚙️ Simples | ⚙️ Complexa (eject) |

---

### Por que Supabase e não Firebase?

**Resposta**: Supabase oferece vantagens importantes:

| Feature | Supabase | Firebase |
|---------|----------|----------|
| **Banco de dados** | ✅ PostgreSQL (SQL) | ❌ NoSQL |
| **Open Source** | ✅ Sim | ❌ Não |
| **Self-hosting** | ✅ Possível | ❌ Não |
| **RLS** | ✅ Nativo | ❌ Security Rules |
| **Migrações** | ✅ SQL puro | ❌ Limitado |
| **Preço** | 💰 Mais barato | 💰 Pode ficar caro |

Para uma aplicação financeira, PostgreSQL é essencial para:
- Transações ACID
- Queries complexas
- Integridade referencial
- Views e stored procedures

---

### O projeto segue Clean Architecture?

**Resposta**: Sim, com adaptações para frontend:

```
src/
├── atoms/molecules/organisms/templates/pages/  # 🎨 UI Layer
├── hooks/                                       # 🔌 Application Layer
├── services/                                    # 💼 Use Cases Layer
├── repositories/                                # 🗄️ Infrastructure Layer
└── dtos/                                        # 📋 Domain Layer
```

**Princípios aplicados**:
- ✅ Separação de responsabilidades
- ✅ Inversão de dependências (services → repositories)
- ✅ Independência de framework (lógica não depende de React)
- ✅ Testabilidade (camadas isoladas)

---

### Por que Atomic Design?

**Resposta**: Atomic Design traz organização e reusabilidade:

- **Atoms**: Componentes indivisíveis (Button, Input)
  - Reutilizáveis em todo o sistema
  - Únicos responsáveis por estilo base

- **Molecules**: Combinações simples (FormField = Label + Input)
  - Composições de atoms
  - Lógica simples

- **Organisms**: Seções complexas (Sidebar, DataTable)
  - Lógica de negócio
  - Integração com dados

- **Templates**: Estruturas de layout (ModalTemplate)
  - Reuso de estrutura
  - Slots para conteúdo

- **Pages**: Instâncias específicas (DashboardPage)
  - Roteamento
  - Dados reais

**Benefícios**:
- 📦 Componentes reutilizáveis
- 🧩 Fácil manutenção
- 📚 Documentação clara
- 🎨 Design consistente

---

## 🗄️ Supabase e Banco de Dados

### Como funciona a autenticação?

**Resposta**: Fluxo completo:

```
1. User faz login via supabase.auth.signInWithPassword()
2. Supabase retorna JWT token
3. Token é armazenado automaticamente (localStorage)
4. Requests incluem token no header Authorization: Bearer <jwt>
5. RLS policies verificam auth.uid() para filtrar dados
6. Token expira em 1 hora, refresh automático
```

**Exemplo**:
```javascript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'senha',
});

// Auto-refresh configurado
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// RLS usa auth.uid()
CREATE POLICY "Users view own data"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

---

### O que é RLS (Row-Level Security)?

**Resposta**: RLS é segurança em nível de linha do PostgreSQL:

**Sem RLS** (inseguro):
```javascript
// Qualquer usuário pode ver TUDO
const { data } = await supabase.from('revenues').select('*');
// Retorna dados de TODAS as unidades
```

**Com RLS** (seguro):
```sql
-- Política: usuário só vê dados da sua unidade
CREATE POLICY "Users view own unit data"
ON revenues FOR SELECT
USING (
  unit_id IN (
    SELECT unit_id FROM profiles WHERE id = auth.uid()
  )
);
```

```javascript
// Mesma query, mas RLS filtra automaticamente
const { data } = await supabase.from('revenues').select('*');
// Retorna apenas dados da unidade do usuário
```

**Vantagens**:
- ✅ Segurança no banco de dados (não no código)
- ✅ Impossível bypassar
- ✅ Aplica-se a todos os clients
- ✅ Auditável

---

### Como rodar migrações?

**Resposta**: Duas opções:

**Opção 1: Dashboard (mais fácil)**:
```
1. Acesse app.supabase.com
2. Seu projeto → SQL Editor
3. Abra arquivos de supabase/migrations/
4. Execute um por vez, em ordem
```

**Opção 2: Supabase CLI (avançado)**:
```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link com projeto
supabase link --project-ref xxxxx

# Rodar migrações
supabase db push

# Ver status
supabase db diff
```

---

### Como fazer backup do banco?

**Resposta**:

**Método 1: Dashboard**:
```
Settings → Database → Database Backups
- Daily backups automáticos (7 dias)
- Point-in-time recovery (Pro plan)
```

**Método 2: pg_dump**:
```bash
# Exportar schema + dados
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  > backup.sql

# Apenas schema
pg_dump --schema-only ...

# Apenas dados
pg_dump --data-only ...
```

**Método 3: Supabase CLI**:
```bash
supabase db dump -f backup.sql
```

---

## 💻 Desenvolvimento

### Como criar um novo componente?

**Resposta**: Siga o template:

```bash
# 1. Criar pasta
mkdir src/atoms/MyComponent

# 2. Criar arquivos
touch src/atoms/MyComponent/MyComponent.jsx
touch src/atoms/MyComponent/index.js
```

```javascript
// MyComponent.jsx
/**
 * Descrição do componente
 * @param {Object} props
 */
export default function MyComponent({ prop1, prop2 }) {
  return (
    <div>
      {/* Implementação */}
    </div>
  );
}

// index.js
export { default } from './MyComponent';
```

**Checklist**:
- [ ] JSDoc comment
- [ ] Props destructuring
- [ ] Export via index.js
- [ ] Adicionar em src/atoms/index.js
- [ ] Criar testes (opcional)

Veja [Development Guide](./DEVELOPMENT.md#-criando-componentes) para detalhes.

---

### Como adicionar uma nova página?

**Resposta**: Passo a passo:

```javascript
// 1. Criar página
// src/pages/MyPage/MyPage.jsx
export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
    </div>
  );
}

// src/pages/MyPage/index.js
export { default } from './MyPage';

// 2. Adicionar rota
// src/App.jsx
import MyPage from './pages/MyPage';

<Route path="/my-page" element={<MyPage />} />

// 3. Adicionar link na Sidebar
// src/organisms/Sidebar/Sidebar.jsx
<NavLink to="/my-page">
  <Icon />
  My Page
</NavLink>
```

---

### Como usar hooks customizados?

**Resposta**: Hooks já disponíveis:

```javascript
// Dados financeiros
import { useRevenues } from '../hooks/useRevenues';
import { useDRE } from '../hooks/useDRE';

function MyComponent() {
  const { revenues, isLoading, createRevenue } = useRevenues();
  const { dreData, calculateDRE } = useDRE();

  return <div>{/* ... */}</div>;
}

// Estado global
import { useAuth } from '../context/AuthContext';
import { useUnit } from '../context/UnitContext';

function MyComponent() {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();

  return <div>{/* ... */}</div>;
}
```

**Criar novo hook**:
```javascript
// src/hooks/useMyFeature.js
export function useMyFeature() {
  const [state, setState] = useState();

  // Lógica do hook

  return { state, actions };
}
```

Veja [Development Guide](./DEVELOPMENT.md#-hooks-customizados) para exemplos.

---

### Como fazer chamadas à API?

**Resposta**: Use services e repositories:

```javascript
// ❌ NÃO faça isso
function MyComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    supabase.from('revenues').select('*').then(({ data }) => setData(data));
  }, []);
}

// ✅ Use hooks
function MyComponent() {
  const { revenues, isLoading } = useRevenues();
}

// ✅ Ou TanStack Query direto
function MyComponent() {
  const { data } = useQuery({
    queryKey: ['revenues'],
    queryFn: () => revenueService.getRevenues(),
  });
}
```

---

## 🧪 Testes

### Quais tipos de teste usar?

**Resposta**: Pirâmide de testes:

```
      /\
     /  \  E2E (Playwright)
    /----\
   /      \ Integration (Vitest)
  /--------\
 /          \ Unit (Vitest)
/____________\
```

**Unit Tests** (70%):
- Funções puras
- Utils
- DTOs
- Services (lógica isolada)

**Integration Tests** (20%):
- Hooks com TanStack Query
- Services + Repositories
- Fluxos complexos

**E2E Tests** (10%):
- Fluxos críticos de usuário
- Autenticação
- Transações financeiras

---

### Como rodar testes?

**Resposta**:

```bash
# Unit/Integration (Vitest)
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # Com cobertura
npm run test:ui           # Interface visual

# E2E (Playwright)
npx playwright test              # Todos os testes
npx playwright test --ui         # Interface visual
npx playwright test --debug      # Debug mode
npx playwright test auth.spec.ts # Arquivo específico
```

---

### Como escrever um teste?

**Resposta**: Templates:

```javascript
// Unit test (Vitest)
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatters';

describe('formatCurrency', () => {
  it('should format number as BRL currency', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-500)).toBe('-R$ 500,00');
  });
});

// Component test
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    screen.getByText('Click').click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

Veja [Testing Guide](../TESTING.md) para detalhes.

---

## 🚀 Deploy e Produção

### Como fazer deploy?

**Resposta**: Deploy automático via Vercel:

```bash
# 1. Conectar repositório no Vercel
# - Acesse vercel.com
# - Import Git Repository
# - Selecione o repo

# 2. Configurar variáveis de ambiente
# Settings → Environment Variables
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# 3. Deploy automático
# - Push para main = deploy em produção
# - Push para feature branch = preview deploy
```

**Builds locais**:
```bash
# Testar build
npm run build

# Testar preview
npm run preview

# Analisar bundle
npx vite-bundle-visualizer
```

---

### Como configurar domínio customizado?

**Resposta**:

```
1. Vercel Dashboard → Settings → Domains
2. Add Domain → example.com
3. Configurar DNS:
   - Type: A
   - Name: @
   - Value: 76.76.21.21

   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com

4. Aguardar propagação (até 48h)
```

---

### Como monitorar erros em produção?

**Resposta**: Integrar Sentry:

```bash
# 1. Instalar
npm install @sentry/react

# 2. Configurar
// src/main.jsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

// 3. Error boundary
<Sentry.ErrorBoundary fallback={<ErrorPage />}>
  <App />
</Sentry.ErrorBoundary>
```

---

## 🔐 Segurança

### Como proteger rotas?

**Resposta**: Use ProtectedRoute:

```javascript
// src/components/ProtectedRoute/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" />;

  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

// Uso
<Route
  path="/admin"
  element={
    <ProtectedRoute roles={['admin']}>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

---

### Como esconder informações sensíveis?

**Resposta**:

```javascript
// ✅ Bom - usar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// ❌ NUNCA faça isso
const apiKey = 'sk_live_abc123xyz';

// ✅ Logging seguro
import { secureLogger } from './utils/secureLogger';

secureLogger.log('User data:', user);
// Automaticamente oculta campos sensíveis (password, token, etc)

// ✅ Sanitize user input
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput);
```

---

### Como prevenir SQL injection?

**Resposta**: Supabase já previne automaticamente:

```javascript
// ✅ Seguro - prepared statements automáticos
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userInput); // Escaped automaticamente

// ❌ NÃO use raw SQL com input de usuário
const { data } = await supabase.rpc('raw_query', {
  query: `SELECT * FROM users WHERE email = '${userInput}'` // VULNERÁVEL!
});

// ✅ Se precisar de raw SQL, use parametrizado
const { data } = await supabase.rpc('get_user_by_email', {
  user_email: userInput // Parâmetro seguro
});
```

---

## ⚡ Performance

### Como otimizar performance?

**Resposta**: Checklist:

```javascript
// 1. Code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 2. Memoização
const memoizedValue = useMemo(() => expensiveCalc(data), [data]);
const MemoizedComponent = memo(Component);

// 3. Virtualização (listas longas)
import { FixedSizeList } from 'react-window';

// 4. Otimizar queries
const { data } = await supabase
  .from('revenues')
  .select('id, amount, description') // Campos específicos
  .range(0, 49) // Paginação
  .limit(50);

// 5. Usar staleTime (TanStack Query)
const { data } = useQuery({
  queryKey: ['revenues'],
  queryFn: fetchRevenues,
  staleTime: 30000, // Cache por 30s
});

// 6. Debounce em inputs
const debouncedSearch = useDebouncedValue(searchTerm, 300);
```

---

### Como reduzir bundle size?

**Resposta**:

```bash
# 1. Analisar bundle
npx vite-bundle-visualizer

# 2. Lazy load componentes pesados
import { lazy } from 'react';
const Chart = lazy(() => import('recharts'));

# 3. Tree shaking - import específico
// ❌ Ruim
import _ from 'lodash';

// ✅ Bom
import debounce from 'lodash/debounce';

# 4. Otimizar imagens
# - Usar WebP
# - Lazy loading com <img loading="lazy" />
# - Comprimir com tinypng.com

# 5. Remover console.log em produção
// vite.config.js
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
```

---

## 🎨 Componentes e UI

### Como usar o Design System?

**Resposta**: Sempre reutilize componentes existentes:

```javascript
// ✅ Bom - usar componentes do sistema
import { Button, Input, Card, Modal } from '../atoms';
import { KPICard, FormField } from '../molecules';

function MyFeature() {
  return (
    <Card>
      <FormField
        label="Nome"
        error={errors.name}
      >
        <Input
          value={name}
          onChange={setName}
        />
      </FormField>

      <Button
        variant="primary"
        size="lg"
        onClick={handleSave}
      >
        Salvar
      </Button>
    </Card>
  );
}

// ❌ Ruim - criar componentes do zero
function MyFeature() {
  return (
    <div className="bg-white p-4 rounded">
      <input type="text" />
      <button className="bg-blue-500">Save</button>
    </div>
  );
}
```

Consulte [Design System](../DESIGN_SYSTEM.md) para todos os componentes disponíveis.

---

### Como adicionar novos ícones?

**Resposta**: Use Lucide React:

```javascript
// 1. Importar ícone necessário
import {
  Home,
  DollarSign,
  Users,
  Settings,
  TrendingUp,
} from 'lucide-react';

// 2. Usar
<Home className="w-5 h-5 text-gray-600" />
<DollarSign size={20} color="green" />

// 3. Ver todos os ícones disponíveis
// https://lucide.dev/icons
```

**Não** adicione outras bibliotecas de ícones (react-icons, font-awesome) para manter consistência.

---

### Como implementar dark mode?

**Resposta**: Já está implementado:

```javascript
// useTheme hook
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <button onClick={toggleTheme}>
        Toggle Dark Mode
      </button>
    </div>
  );
}

// Tailwind classes
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
">
  Content
</div>
```

---

## 📚 Recursos Adicionais

### Onde encontrar mais informação?

**Documentação do Projeto**:
- 📖 [README.md](../../README.md) - Overview geral
- 🏛️ [Architecture](../ARQUITETURA.md) - Arquitetura detalhada
- 🗄️ [Database Schema](../DATABASE_SCHEMA.md) - Schema do banco
- 💻 [Development Guide](./DEVELOPMENT.md) - Guia de desenvolvimento
- 📝 [Code Conventions](./CODE_CONVENTIONS.md) - Padrões de código
- 🧪 [Testing Guide](../TESTING.md) - Como testar
- 🎨 [Design System](../DESIGN_SYSTEM.md) - Componentes UI

**Documentação Externa**:
- [React Docs](https://react.dev) - Documentação oficial do React
- [Vite Guide](https://vitejs.dev/guide/) - Guia do Vite
- [Supabase Docs](https://supabase.com/docs) - Documentação do Supabase
- [TanStack Query](https://tanstack.com/query) - React Query docs
- [Tailwind CSS](https://tailwindcss.com/docs) - Tailwind documentation

**Comunidade**:
- 💬 GitHub Discussions
- 🐛 GitHub Issues
- 📧 suporte@barberanalytics.com

---

## 💡 Não Encontrou Sua Dúvida?

### Abra uma Discussion no GitHub

```
1. Vá para github.com/seu-repo/barber-analytics-pro/discussions
2. Clique em "New Discussion"
3. Escolha categoria:
   - Q&A - Perguntas gerais
   - Ideas - Sugestões
   - Show and tell - Compartilhar implementações
4. Descreva sua dúvida claramente
```

### Ou Entre em Contato

- 📧 **Email**: suporte@barberanalytics.com
- 💬 **Discord**: [Link do servidor]
- 🐦 **Twitter**: [@barberanalytics]

---

**Esta FAQ está sempre sendo atualizada. Contribua adicionando suas dúvidas!**

---

**Última atualização**: 2025-10-27
**Versão do guia**: 1.0.0
