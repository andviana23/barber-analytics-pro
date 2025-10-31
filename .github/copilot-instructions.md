# 🧠 Copilot Instructions — Barber Analytics Pro

## 🎯 Contexto do Projeto

Você está colaborando no desenvolvimento do sistema **Barber Analytics Pro** — um sistema completo de gestão para barbearias premium, desenvolvido por **Andrey Viana**, com arquitetura limpa, modular e escalável.

O sistema é **React 19 + Vite + TailwindCSS** no frontend, com **Supabase (PostgreSQL + Auth + Realtime + Edge Functions)** no backend.  
Adota **Clean Architecture**, **Domain-Driven Design (DDD)** e **Atomic Design**.

**Data atual:** 30 de outubro de 2025

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

1. **Seguir snake_case**

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

2. **Incluir constraints:**
   - `CHECK` para validações
   - `DEFAULT` para valores padrão
   - `REFERENCES` para foreign keys

3. **Sempre adicionar timestamps:**

   ```sql
   created_at timestamptz DEFAULT now(),
   updated_at timestamptz DEFAULT now()
   ```

4. **Usar `is_active` para soft delete:**

   ```sql
   is_active boolean DEFAULT true
   ```

5. **Criar RLS policies:**

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
    <div className="card-theme p-6 rounded-xl border hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-light-bg dark:bg-dark-hover">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className="text-sm font-medium text-feedback-light-success dark:text-feedback-dark-success">
            +{trend}%
          </span>
        )}
      </div>
      <p className="text-theme-secondary text-sm font-medium">{title}</p>
      <p className="text-theme-primary text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
```

---

## 📚 Referências Importantes

- **Arquitetura:** `docs/ARQUITETURA.md`
- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Banco de Dados:** `docs/DATABASE_SCHEMA.md`
- **Módulo Financeiro:** `docs/FINANCIAL_MODULE.md`
- **Lista da Vez:** `docs/LISTA_DA_VEZ_MODULE.md`
- **DRE:** `docs/DRE_MODULE.md`
- **RLS Fix:** `docs/FIX_RLS_ADMINISTRADOR_ROLE.md`

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
✅ Respeitar as RLS policies e permissões
✅ Validar dados com DTOs
✅ Retornar `{ data, error }`
✅ Dar feedback ao usuário com toasts

---

✨ **Autor & Contexto**

**Autor:** Andrey Viana  
**Projeto:** Barber Analytics Pro  
**Estilo:** Enterprise, Clean Code, Atomic, Multi-tenant, Supabase-first  
**Meta:** Sistema de gestão de barbearia completo, modular e escalável.

**Última atualização:** 30 de outubro de 2025
