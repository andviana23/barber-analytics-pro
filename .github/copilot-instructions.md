# 🧠 Copilot Instructions — Barber Analytics Pro

## 🎯 Contexto do Projeto

Você está colaborando no desenvolvimento do sistema **Barber Analytics Pro** — um sistema completo de gestão para barbearias premium, desenvolvido por **Andrey Viana**, com arquitetura limpa, modular e escalável.

**Arquitetura:**
- **Frontend:** React 19 + Vite + TailwindCSS
- **Backend:** Express.js (Node.js 20) + Supabase (PostgreSQL + Auth + Realtime)
- **Hosting:** VPS próprio (Ubuntu + Nginx + PM2)
- **Domínio:** app.tratodebarbados.com
- **Cron Jobs:** pg_cron (11 jobs automáticos)

Adota **Clean Architecture**, **Domain-Driven Design (DDD)** e **Atomic Design**.
**Package Manager**: **npm** (gerenciador de pacotes padrão do Node.js).

**Data atual:** 12 de novembro de 2025
**Versão:** 2.0.0 (Migrado para VPS)

---

## 🏗️ Arquitetura Geral

### 📁 Estrutura de Pastas

```
src/
├── atoms/         # Componentes básicos (Button, Input, Card)
├── molecules/     # Composições simples (KPICard, Modal, Chart)
├── organisms/     # Estruturas complexas (Navbar, Sidebar, Dashboard)
├── templates/     # Layouts de página
├── pages/         # Páginas com lógica de negócio
├── services/      # Lógica de negócios e integração Supabase
├── repositories/  # Acesso a dados (CRUD)
├── hooks/         # Custom hooks reativos
├── dtos/          # Data Transfer Objects (validação)
└── utils/         # Funções auxiliares e formatação
```

---

## ⚙️ Padrões e Convenções

### 🔸 Arquitetura

Cada módulo segue: **Repository → Service → DTO → Hook → Page**

- **Repository** acessa o Supabase diretamente
- **Service** contém regras de negócio e validações
- **DTOs** validam e transformam dados
- **Hooks** controlam estado e side effects
- **Pages** conectam componentes e UI

### 🔸 Código e Organização

- Componentes: **PascalCase**
- Funções/variáveis: **camelCase**
- Imports organizados: libs externas → internos → locais
- Funções async sempre retornam `{ data, error }`
- Evitar lógica de negócio em componentes React
- **Soft delete** (`is_active = false`) em vez de exclusão direta
- **RLS** (Row Level Security) ativo em todas as tabelas

### 🔸 Boas práticas

- Usar `React.memo` para componentes de lista
- Hooks com cache e `refetch`
- Manter consistência visual com Tailwind
- Criar componentes reutilizáveis antes de duplicar código

---

## 🎨 Design System - REGRAS CRÍTICAS

### ⚠️ NUNCA use classes hardcoded como:

```jsx
// ❌ ERRADO - Não funciona em dark mode
<div className="bg-white text-gray-900 border-gray-200">
<div className="bg-[#FFFFFF] text-[#1A1F2C]">
```

### ✅ SEMPRE use classes utilitárias do Design System:

```jsx
// ✅ CORRETO - Suporta dark mode automaticamente
<div className="card-theme">
  <h1 className="text-theme-primary">Título</h1>
  <p className="text-theme-secondary">Descrição</p>
  <button className="btn-theme-primary">Ação</button>
  <input className="input-theme" />
</div>
```

### 📋 Classes Utilitárias Disponíveis

| Classe                  | Uso                           |
| ----------------------- | ----------------------------- |
| `.card-theme`           | Cards com suporte a dark mode |
| `.text-theme-primary`   | Texto principal               |
| `.text-theme-secondary` | Texto secundário              |
| `.btn-theme-primary`    | Botão primário                |
| `.btn-theme-secondary`  | Botão secundário              |
| `.input-theme`          | Campos de entrada             |

### 🎯 Ordem de Prioridade

1. **Primeira escolha:** Classes utilitárias (`.card-theme`, `.text-theme-*`)
2. **Segunda escolha:** Tokens do Tailwind (`bg-light-surface dark:bg-dark-surface`)
3. **❌ NUNCA USAR:** Classes hardcoded (`bg-white`, `text-gray-600`)

### 🌞 Light Mode (Premium Edition - 2025)

- Fundo geral: `#F6F8FA`
- Cards: `#FFFFFF` com `border-[#E4E8EE]`
- Tipografia: títulos `#1A1F2C`, textos `#667085`
- Botão primário: `bg-[#1E8CFF] hover:bg-[#0072E0]`

---

## 💰 Módulo Financeiro

- Baseado em `FINANCIAL_MODULE.md`
- Segue arquitetura: **Repository + Service + DTO**
- Entidades: `revenues`, `expenses`, `parties`, `bank_accounts`, `payment_methods`
- Cálculos automáticos (lucro líquido, margem, fluxo) em views SQL
- Processos de conciliação via `source_hash`
- Deduplicação e validações no `Service Layer`

---

## 🧾 Importação de Extratos Bancários

- Lê arquivos Excel/CSV, normaliza dados e identifica créditos
- Detecta profissional, cliente e forma de pagamento automaticamente
- Deduplicação via `source_hash`
- Revisão manual antes da gravação final
- Serviços principais:
  - `readExcelFile()`, `normalizeData()`, `enrichData()`, `insertApprovedRecords()`

---

## 💈 Lista da Vez

- Gerencia ordem de atendimento por unidade
- Reset automático mensal via **Cron Job (pg_cron)** às 23:00
- Histórico mensal completo
- Funções SQL documentadas em `LISTA_DA_VEZ_MODULE.md`
- Componentes principais:
  - `ListaDaVezPage.jsx`, `useListaDaVez.js`, `listaDaVezService.js`

---

## 🧮 DRE e Relatórios

- Geração de DRE via função `fn_calculate_dre()` (Supabase)
- Visualização de KPIs em `KPICard`, `FinancialDashboard`, `CashflowChart`
- Página de relatórios central: `RelatoriosPage.jsx`

---

## 🔐 Autenticação e Permissões - REGRAS CRÍTICAS

### ⚠️ ROLES - Problema de Inconsistência Resolvido

**Normalização de Roles:**

- A função `get_user_role()` **normaliza automaticamente** `'administrador'` → `'admin'`
- Todas as funções de permissão aceitam ambos: `'admin'` E `'administrador'`

**Roles válidas:**

- `'barbeiro'` (ou `'barber'`)
- `'gerente'` (ou `'manager'`)
- `'admin'` (ou `'administrador'`)
- `'recepcionista'` (ou `'receptionist'`)

### 🛡️ RLS Policies - Regras

- **TODAS as tabelas** têm RLS ativado
- **SELECT:** Usuário vê apenas dados de suas unidades
- **INSERT/UPDATE/DELETE:** Depende do role e vínculo com a unidade

**Exemplo de policy:**

```sql
CREATE POLICY "view_own_unit"
ON revenues
FOR SELECT USING (
  unit_id IN (SELECT unit_id FROM professionals WHERE user_id = auth.uid())
);
```

### ✅ Funções de Permissão Principais

| Função                        | Aceita 'administrador' | Descrição                |
| ----------------------------- | ---------------------- | ------------------------ |
| `fn_can_manage_services`      | ✅ Sim                 | Criar/editar serviços    |
| `fn_can_manage_cash_register` | ✅ Sim                 | Gerenciar caixas         |
| `get_user_role`               | ✅ Normaliza           | Retorna role padronizada |

### ⚠️ Profissional DEVE estar ativo

Para realizar ações, o profissional precisa:

1. Ter registro na tabela `professionals`
2. Estar com `is_active = true`
3. Estar vinculado à `unit_id` correta

---

## 🧩 Checklist de Criação de Features

Ao criar uma nova feature, siga SEMPRE esta ordem:

- [ ] **1. Repository** (`src/repositories/`) - Acesso ao Supabase
- [ ] **2. Service** (`src/services/`) - Regras de negócio
- [ ] **3. DTO** (`src/dtos/`) - Validação de dados
- [ ] **4. Hook** (`src/hooks/`) - Estado e cache (TanStack Query)
- [ ] **5. Componentes** (Atomic Design)
  - [ ] Atoms (se necessário)
  - [ ] Molecules (se necessário)
  - [ ] Organisms (se necessário)
- [ ] **6. Page** (`src/pages/`) - Integração final
- [ ] **7. Testes** (Vitest + Playwright)
- [ ] **8. Documentação** (atualizar `docs/`)

---

## 🧠 Regras para o Copilot Chat

### ✅ Quando escrever código:

1. **Seguir Clean Architecture**
   - Não acessar o Supabase direto do componente React
   - Repository → Service → Hook → Page

2. **Retornar { data, error }**

   ```javascript
   async function getData() {
     try {
       const result = await repository.fetch();
       return { data: result, error: null };
     } catch (error) {
       return { data: null, error };
     }
   }
   ```

3. **Usar DTOs para validar inputs**

   ```javascript
   // Em serviceService.js
   const validatedData = ServiceDTO.validate(inputData);
   if (!validatedData.isValid) {
     return { data: null, error: validatedData.errors };
   }
   ```

4. **Aplicar máscaras e formatações**
   - Usar `formatCurrency()`, `formatDate()`, `formatCPF()`

5. **Feedback ao usuário**

   ```javascript
   toast.success('Operação realizada com sucesso!');
   toast.error('Erro ao processar solicitação');
   ```

6. **Hooks devem incluir:**
   - `loading` state
   - `error` state
   - `refetch` function

### ✅ Quando criar novos módulos:

1. **Nomear seguindo o padrão:**
   - Repository: `nomeRepository.js`
   - Service: `nomeService.js`
   - Hook: `useNome.js`
   - Page: `NomePage.jsx`

2. **Incluir DTOs:**
   - `CreateNomeDTO` (para criação)
   - `UpdateNomeDTO` (para edição)
   - `NomeResponseDTO` (para resposta)

3. **Adicionar RLS policy no banco:**
   ```sql
   CREATE POLICY "policy_name"
   ON table_name
   FOR SELECT USING (
     unit_id IN (SELECT unit_id FROM professionals WHERE user_id = auth.uid())
   );
   ```

### ✅ Quando gerar SQL:

**🚨 REGRA CRÍTICA: MIGRAÇÕES EXCLUSIVAMENTE VIA @pgsql**

**SEMPRE use as ferramentas `@pgsql` para:**

- Criar/alterar tabelas, índices, constraints
- Executar migrações e scripts DDL/DML
- Funções, triggers, policies RLS
- Qualquer modificação no banco de dados

**❌ NUNCA MAIS use:**

- `run_in_terminal` com psql, createdb, dropdb
- Scripts SQL manuais via terminal
- Conexões diretas ao banco fora do @pgsql

**✅ Fluxo padrão:**

1. Conectar: `@pgsql_connect`
2. Executar: `@pgsql_modify` ou `@pgsql_query`
3. Verificar: `@pgsql_db_context`
4. Desconectar: `@pgsql_disconnect`

5. **Seguir snake_case**

   ```sql
   CREATE TABLE barbers_turn_list (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     professional_id uuid REFERENCES professionals(id),
     current_points integer DEFAULT 0,
     is_active boolean DEFAULT true,
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );
   ```

6. **Incluir constraints:**
   - `CHECK` para validações
   - `DEFAULT` para valores padrão
   - `REFERENCES` para foreign keys

7. **Sempre adicionar timestamps:**

   ```sql
   created_at timestamptz DEFAULT now(),
   updated_at timestamptz DEFAULT now()
   ```

8. **Usar `is_active` para soft delete:**

   ```sql
   is_active boolean DEFAULT true
   ```

9. **Criar RLS policies:**

   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "policy_name"
   ON table_name
   FOR SELECT USING (
     unit_id IN (SELECT unit_id FROM professionals WHERE user_id = auth.uid())
   );
   ```

---

## 💡 Estilo de Resposta Esperado do Copilot

1. **Explicar brevemente a decisão arquitetural**

   ```
   "Vou criar um novo serviço seguindo a Clean Architecture.
   A lógica ficará em serviceService.js e o acesso ao banco
   em serviceRepository.js."
   ```

2. **Código limpo, comentado e consistente**

   ```javascript
   // ✅ BOM
   /**
    * Busca todos os serviços ativos de uma unidade
    * @param {string} unitId - ID da unidade
    * @returns {Promise<{data, error}>}
    */
   async function getActiveServices(unitId) {
     // ...
   }
   ```

3. **Mostrar paths reais**

   ```
   "Crie o arquivo em: src/services/serviceService.js"
   "O repository está em: src/repositories/serviceRepository.js"
   ```

4. **Evitar respostas genéricas**

   ```
   ❌ "Você pode criar um serviço para isso"
   ✅ "Crie src/services/commissionService.js com a função
       calculateCommission() que usa commissionRepository"
   ```

5. **Manter o padrão Enterprise + Clean Code**
   - Funções pequenas (máx. 20 linhas)
   - Nomes descritivos
   - Separação de responsabilidades
   - Comentários onde necessário

---

## ⚠️ Erros Comuns a EVITAR

### ❌ 1. Usar classes CSS hardcoded

```jsx
// ❌ ERRADO
<div className="bg-white text-gray-900">
```

### ❌ 2. Lógica de negócio em componentes

```jsx
// ❌ ERRADO
function MyComponent() {
  const handleSave = async () => {
    const { data } = await supabase.from('table').insert(values);
  };
}

// ✅ CORRETO
function MyComponent() {
  const { mutate: saveData } = useSaveData();
  const handleSave = () => saveData(values);
}
```

### ❌ 3. Não validar dados antes de salvar

```javascript
// ❌ ERRADO
await repository.create(rawData);

// ✅ CORRETO
const validatedData = DTO.validate(rawData);
if (!validatedData.isValid) {
  return { data: null, error: validatedData.errors };
}
await repository.create(validatedData.data);
```

### ❌ 4. Esquecer de adicionar RLS policies

```sql
-- ❌ ERRADO
CREATE TABLE services (...);

-- ✅ CORRETO
CREATE TABLE services (...);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_own_unit" ON services FOR SELECT USING (...);
```

### ❌ 5. Não tratar erros

```javascript
// ❌ ERRADO
const data = await fetch();
return data;

// ✅ CORRETO
try {
  const data = await fetch();
  return { data, error: null };
} catch (error) {
  console.error('Erro:', error);
  return { data: null, error };
}
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Criar novo serviço

```javascript
// src/repositories/serviceRepository.js
export const serviceRepository = {
  async create(serviceData) {
    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();
    return { data, error };
  },
};

// src/services/serviceService.js
import { serviceRepository } from '../repositories/serviceRepository';
import { CreateServiceDTO } from '../dtos/serviceDTO';

export const serviceService = {
  async createService(input, user) {
    // Validar
    const dto = new CreateServiceDTO(input);
    if (!dto.isValid()) {
      return { data: null, error: dto.getErrors() };
    }

    // Verificar permissão
    const canManage = await permissions.canManageServices(user);
    if (!canManage) {
      return { data: null, error: 'Sem permissão' };
    }

    // Criar
    return await serviceRepository.create(dto.toObject());
  },
};

// src/hooks/useServices.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceService } from '../services/serviceService';

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: data => serviceService.createService(data, user),
    onSuccess: () => {
      queryClient.invalidateQueries(['services']);
      toast.success('Serviço criado com sucesso!');
    },
    onError: error => {
      toast.error('Erro ao criar serviço');
    },
  });
}

// src/pages/ServicesPage.jsx
import { useCreateService } from '../hooks/useServices';

function ServicesPage() {
  const { mutate: createService, isLoading } = useCreateService();

  const handleSubmit = formData => {
    createService(formData);
  };

  return (
    <div className="card-theme p-6">
      <h1 className="text-theme-primary text-2xl font-bold">Serviços</h1>
      {/* Form aqui */}
    </div>
  );
}
```

### Exemplo 2: Componente com Design System

```jsx
import React from 'react';
import { TrendingUp } from 'lucide-react';

function KPICard({ title, value, trend }) {
  return (
    <div className="card-theme rounded-xl border p-6 transition-shadow hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-lg bg-light-bg p-2 dark:bg-dark-hover">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <span className="text-sm font-medium text-feedback-light-success dark:text-feedback-dark-success">
            +{trend}%
          </span>
        )}
      </div>
      <p className="text-theme-secondary text-sm font-medium">{title}</p>
      <p className="text-theme-primary mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
```

---

## 📚 Referências Importantes

- **Overview:** `docs/00_OVERVIEW.md`
- **Requirements:** `docs/01_REQUIREMENTS.md`
- **Architecture:** `docs/02_ARCHITECTURE.md`
- **Domain Model:** `docs/03_DOMAIN_MODEL.md`
- **Modules:** `docs/04_MODULES/` (6 arquivos)
- **Infrastructure:** `docs/05_INFRASTRUCTURE.md`
- **API Reference:** `docs/06_API_REFERENCE.md`
- **Data Model:** `docs/07_DATA_MODEL.md`
- **Testing Strategy:** `docs/08_TESTING_STRATEGY.md`
- **Deployment Guide:** `docs/09_DEPLOYMENT_GUIDE.md`
- **Project Management:** `docs/10_PROJECT_MANAGEMENT.md`
- **Contributing:** `docs/11_CONTRIBUTING.md`
- **Changelog:** `docs/12_CHANGELOG.md`
- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Summary:** `docs/SUMMARY.md` (índice navegável)

---

## 📦 Comandos e Scripts (npm)

### ⚠️ IMPORTANTE: Usamos NPM como gerenciador de pacotes

**SEMPRE use `npm` nos comandos e scripts:**

```bash
# ✅ CORRETO
npm install
npm run dev
npm run build
npm test
npm run lint
```

### 🔧 Scripts Principais

```bash
# Desenvolvimento
npm run dev                 # Servidor dev (localhost:5173)
npm run build               # Build produção
npm run preview             # Preview build

# Qualidade
npm run lint                # ESLint check
npm run lint:fix            # ESLint fix
npm run format              # Prettier format
npm run format:check        # Prettier check

# Testes
npm test                    # Vitest unit tests
npm run test:e2e            # Playwright E2E
npm run test:all            # Todos os testes

# Design System
npm run audit:design-system    # Audita classes hardcoded
npm run migrate:design-system  # Migra para design system
```

### 🛠️ Quando gerar comandos para o usuário:

```bash
# ✅ Sempre usar npm
"Execute: npm install"
"Execute: npm run dev"
"Execute: npm run lint:fix"
```

---

## ✨ Resultado Esperado

O Copilot deve:

✅ Entender toda a arquitetura do Barber Analytics Pro
✅ Manter consistência nos padrões
✅ Criar código funcional e modular
✅ Integrar automaticamente com os padrões existentes
✅ Seguir Clean Architecture + DDD + Atomic Design
✅ Evitar redundância e manter alta legibilidade
✅ **SEMPRE usar classes utilitárias do Design System**
✅ **NUNCA usar classes CSS hardcoded**
✅ **SEMPRE usar npm como gerenciador de pacotes**
✅ Respeitar as RLS policies e permissões
✅ Validar dados com DTOs
✅ Retornar `{ data, error }`
✅ Dar feedback ao usuário com toasts
✅ **EXECUTAR testes após cada alteração**
✅ **Validar coverage mínimo de 85%**
✅ **Nunca commitar com testes falhando**

## 🗄️ Banco de Dados - REGRAS CRÍTICAS

### 🚨 SEMPRE USE @pgsql PARA OPERAÇÕES NO BANCO

**REGRA ABSOLUTA:** Todas as operações de banco de dados devem usar exclusivamente as ferramentas `@pgsql`.

**✅ SEMPRE FAÇA:**

```bash
# Conectar ao banco
@pgsql_connect

# Consultar dados
@pgsql_query

# Modificar schema (CREATE, ALTER, DROP, INSERT, UPDATE, DELETE)
@pgsql_modify

# Obter contexto do banco
@pgsql_db_context

# Desconectar
@pgsql_disconnect
```

**❌ NUNCA FAÇA:**

```bash
# ❌ ERRADO - Não use terminal para SQL
run_in_terminal("psql -U postgres -d barber_analytics")
run_in_terminal("createdb barber_analytics")
run_in_terminal("psql -f migration.sql")

# ❌ ERRADO - Não sugira comandos SQL diretos ao usuário
"Execute: psql -U postgres"
"Execute: createdb mydb"
"Execute: psql -f schema.sql"
```

### 📋 Fluxo Padrão de Trabalho com Banco

1. **Conectar:** Sempre conecte primeiro com `@pgsql_connect`
2. **Contexto:** Use `@pgsql_db_context` para ver schema atual
3. **Executar:** Use `@pgsql_query` (SELECT) ou `@pgsql_modify` (DDL/DML)
4. **Validar:** Verifique resultado e re-execute contexto se necessário
5. **Desconectar:** Finalize com `@pgsql_disconnect`

### 🎯 Exemplos Práticos

**Criar tabela:**

```typescript
// ✅ CORRETO
await pgsql_connect({ serverName: 'barber-analytics', database: 'postgres' });
await pgsql_modify({
  connectionId: 'pgsql/barber-analytics/postgres',
  statement: `
    CREATE TABLE commissions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      professional_id UUID REFERENCES professionals(id),
      value DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `,
  statementName: 'Create commissions table',
  statementDescription: 'Criar tabela de comissões',
});
```

**Consultar dados:**

```typescript
// ✅ CORRETO
await pgsql_query({
  connectionId: 'pgsql/barber-analytics/postgres',
  query: `
    SELECT
      p.name,
      COUNT(r.id) as total_revenues,
      SUM(r.value) as total_value
    FROM professionals p
    LEFT JOIN revenues r ON r.professional_id = p.id
    WHERE p.is_active = true
    GROUP BY p.id, p.name
    ORDER BY total_value DESC;
  `,
  queryName: 'Professional performance',
  queryDescription: 'Buscar performance dos profissionais',
  validationQueries: [],
});
```

**Migration:**

```typescript
// ✅ CORRETO
await pgsql_modify({
  connectionId: 'pgsql/barber-analytics/postgres',
  statement: `
    BEGIN;

    -- Adicionar coluna
    ALTER TABLE revenues
    ADD COLUMN commission_calculated BOOLEAN DEFAULT false;

    -- Criar índice
    CREATE INDEX idx_revenues_commission
    ON revenues(commission_calculated)
    WHERE commission_calculated = false;

    COMMIT;
  `,
  statementName: 'Add commission tracking',
  statementDescription: 'Adicionar tracking de comissões calculadas',
});
```

### ⚠️ Validação de Queries

**SEMPRE inclua `validationQueries`** para verificar valores literais:

```typescript
await pgsql_query({
  connectionId: 'pgsql/barber-analytics/postgres',
  query: `
    SELECT * FROM revenues
    WHERE professional_id = 'abc-123'
    AND date >= '2025-01-01';
  `,
  queryName: 'Get revenues',
  queryDescription: 'Buscar receitas do profissional',
  validationQueries: [
    {
      validateValueQuery: "SELECT 1 FROM professionals WHERE id = 'abc-123'",
      fetchDistinctValuesQuery:
        'SELECT DISTINCT id FROM professionals LIMIT 50',
    },
  ],
});
```

### 🔒 Segurança

- ✅ Sempre use prepared statements via @pgsql (automático)
- ✅ RLS policies aplicadas automaticamente
- ✅ Service role bypass apenas quando necessário
- ❌ Nunca construa queries com string concatenation
- ❌ Nunca execute SQL diretamente via terminal

---

## 🧪 Testes Automatizados - REGRAS CRÍTICAS

### ⚠️ SEMPRE EXECUTAR TESTES APÓS ALTERAÇÕES

**REGRA OBRIGATÓRIA:** Ao criar ou modificar qualquer código, **SEMPRE execute os testes** antes de finalizar.

### 📋 Fluxo de Desenvolvimento com Testes

**1. Após criar/modificar código:**

```bash
# 1️⃣ Validar lint e formato
npm run validate

# 2️⃣ Executar testes unitários
npm run test:run

# 3️⃣ Verificar coverage
npm run test:coverage

# 4️⃣ Se alterar API/Service, rodar integração
npm run test:integration
```

**2. Antes de commit:**

```bash
# Testes completos
npm run test:validate  # Lint + Format + TypeCheck + Tests
```

**3. Antes de PR:**

```bash
# Suite completa
npm run test:all  # Unit + Integration + E2E
```

### 🎯 Quando Executar Cada Tipo de Teste

| Tipo            | Quando Executar                      | Comando                    |
| --------------- | ------------------------------------ | -------------------------- |
| **Unit**        | Após modificar funções/utils/DTOs    | `npm run test:unit`        |
| **Integration** | Após modificar services/repositories | `npm run test:integration` |
| **E2E**         | Após modificar páginas/fluxos        | `npm run test:e2e`         |
| **Load**        | Após otimizações de performance      | `npm run test:load`        |
| **Coverage**    | Ao adicionar novos arquivos          | `npm run test:coverage`    |

### 🛠️ Ferramentas de Teste

**Vitest** - Testes unitários e integração

- Setup: `tests/setup.ts`
- Config: `vite.config.test.ts`
- Coverage: 85% (branches, functions, lines, statements)

**Supertest** - Testes HTTP/API

- Integração com Edge Functions
- Mock de Supabase auth
- Validação de payloads

**k6** - Testes de carga

- Load testing: `tests/load/basic-load.js`
- Stress testing: `tests/load/stress-test.js`
- Instalação: `sudo dnf install k6 -y`

**Playwright** - Testes E2E

- Config: `playwright.config.ts`
- Specs: `e2e/*.spec.ts`
- Multi-browser (Chromium, Firefox, WebKit)

### ✅ Checklist de Testes

**Ao criar um novo componente:**

- [ ] Criar teste unitário em `tests/unit/`
- [ ] Testar render básico
- [ ] Testar props obrigatórias
- [ ] Testar eventos (clicks, inputs)
- [ ] Executar `npm run test:run`

**Ao criar um novo service:**

- [ ] Criar teste unitário para cada método
- [ ] Mockar dependências (repositories)
- [ ] Testar casos de sucesso e erro
- [ ] Validar retorno `{ data, error }`
- [ ] Executar `npm run test:unit`

**Ao criar um novo repository:**

- [ ] Criar teste de integração
- [ ] Mockar Supabase client
- [ ] Testar queries (select, insert, update, delete)
- [ ] Validar filtros e joins
- [ ] Executar `npm run test:integration`

**Ao criar uma nova página:**

- [ ] Criar teste E2E em `e2e/`
- [ ] Testar fluxo completo do usuário
- [ ] Validar navegação e forms
- [ ] Verificar estados de loading/error
- [ ] Executar `npm run test:e2e`

### 🚫 Erros Comuns a EVITAR

```bash
# ❌ ERRADO - Não commitar sem testar
git commit -m "feat: new feature"

# ✅ CORRETO - Sempre validar antes
pnpm test:validate
git commit -m "feat: new feature"
```

```bash
# ❌ ERRADO - Não ignorar testes falhando
pnpm test:run
# 3 tests failed
git commit -m "fix: quick fix"

# ✅ CORRETO - Corrigir falhas antes de commit
pnpm test:run
# ✓ All tests passed
git commit -m "fix: correct implementation"
```

### 📊 Coverage Mínimo

**Thresholds obrigatórios:**

- Branches: 85%
- Functions: 85%
- Lines: 85%
- Statements: 85%

**Verificar coverage:**

```bash
pnpm test:coverage
# Abre: coverage/index.html
```

### 🔄 Integração com CI/CD

Os testes são executados automaticamente no GitHub Actions:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: |
    pnpm test:validate
    pnpm test:all
```

### 📖 Documentação de Testes

- **README**: [tests/README.md](../tests/README.md)
- **Strategy**: [docs/08_TESTING_STRATEGY.md](../docs/08_TESTING_STRATEGY.md)
- **Examples**: `tests/unit/`, `tests/integration/`, `tests/load/`

---

---

## 📝 Documentação - REGRAS CRÍTICAS

### ⚠️ NÃO DOCUMENTAR TODOS OS AJUSTES

**REGRA IMPORTANTE:** Evite criar arquivos `.md` desnecessários para pequenos ajustes e correções.

**✅ DOCUMENTAR (criar .md):**
- Novas features significativas
- Mudanças arquiteturais importantes
- Novos módulos ou sistemas
- Integrações com serviços externos
- Alterações na infraestrutura (VPS, banco, etc.)
- Guias de troubleshooting importantes

**❌ NÃO DOCUMENTAR (não criar .md):**
- Bugfixes simples
- Ajustes de CSS/UI
- Correções de typos
- Refatorações menores
- Pequenas melhorias de performance
- Atualizações de dependências

**📋 Alternativas à documentação .md:**
- Comentários no código (`//` ou `/* */`)
- Docstrings em funções (`/** */`)
- Mensagens de commit descritivas
- Pull request descriptions
- CHANGELOG.md (para releases)

**Exemplo:**

```javascript
// ❌ NÃO CRIAR: docs/BUGFIX_BUTTON_COLOR.md
// ✅ USAR: Comentário + commit message
/**
 * Fix: Corrige cor do botão primário em dark mode
 * Aplica classe btn-theme-primary correta
 */
```

---

✨ **Autor & Contexto**

**Autor:** Andrey Viana
**Projeto:** Barber Analytics Pro
**Estilo:** Enterprise, Clean Code, Atomic, Multi-tenant
**Infraestrutura:** VPS próprio (app.tratodebarbados.com) + Supabase
**Meta:** Sistema de gestão de barbearia completo, modular e escalável.

**Última atualização:** 12 de novembro de 2025
**Versão:** 2.0.0 (Migrado para VPS)
