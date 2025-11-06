# 🎨 Design System

> **Guia visual e semântico do Barber Analytics Pro, fundamentado em Atomic Design e tokens de Tailwind CSS.**
>
> **Criado em:** 2025-10-22  
> **Autor:** Codex (IA)  
> **Atualizado por:** Andrey Viana (Light Premium Edition)

---

## 🎯 Propósito

Garantir consistência visual, acessibilidade e velocidade de desenvolvimento através de uma biblioteca de componentes organizada por camadas de Atomic Design.

---

## 🧭 Princípios

- 🧱 **Atomic Design:** atoms → molecules → organisms → templates → pages.
- 🎯 **Clareza semântica:** nomes e props descritivos.
- ♿ **Acessibilidade:** foco visível, aria labels, contraste AA.
- 📱 **Responsividade:** breakpoints centralizados em Tailwind.

---

## 🎨 Tokens de Design

### 🎯 Paleta de Cores (Sincronizada com tailwind.config.js)

> ✅ **Atualizado em 27/10/2025** - Valores sincronizados com `tailwind.config.js`

| Token                    | Valor (tailwind.config.js) | Uso                                    |
| ------------------------ | -------------------------- | -------------------------------------- |
| `primary.DEFAULT`        | `#1E8CFF`                  | Botões primários, links, destaques     |
| `primary.hover`          | `#0072E0`                  | Estado hover de elementos primários    |
| `primary.light`          | `#E9F3FF`                  | Fundos de botões secundários           |
| `light.bg`               | `#F9FAFB`                  | Fundo geral da aplicação (light mode)  |
| `light.surface`          | `#FFFFFF`                  | Cards, modais, containers (light mode) |
| `light.border`           | `#E2E8F0`                  | Bordas de elementos (light mode)       |
| `dark.bg`                | `#0C0F12`                  | Fundo geral da aplicação (dark mode)   |
| `dark.surface`           | `#161B22`                  | Cards, modais, containers (dark mode)  |
| `dark.border`            | `#242C37`                  | Bordas de elementos (dark mode)        |
| `text-light.primary`     | `#1E293B`                  | Títulos e textos principais (light)    |
| `text-light.secondary`   | `#64748B`                  | Textos secundários e descrições        |
| `text-dark.primary`      | `#F5F7FA`                  | Títulos e textos principais (dark)     |
| `text-dark.secondary`    | `#A5AFBE`                  | Textos secundários (dark)              |
| `feedback-light.success` | `#16A34A`                  | Mensagens de sucesso (light)           |
| `feedback-light.error`   | `#EF4444`                  | Mensagens de erro (light)              |
| `feedback-light.warning` | `#F59E0B`                  | Avisos e alertas (light)               |
| `feedback-dark.success`  | `#3BD671`                  | Mensagens de sucesso (dark)            |
| `feedback-dark.error`    | `#FF7E5F`                  | Mensagens de erro (dark)               |
| `feedback-dark.warning`  | `#F4B400`                  | Avisos e alertas (dark)                |

> 💡 O tema Light foi ajustado para um visual **moderno, sofisticado e de alto contraste controlado**, com base nas tendências UI 2025 (Linear, Notion, Apple).

---

### 🌞 Light Mode (Premium Edition)

- Fundo geral: `#F6F8FA`
- Cards: `#FFFFFF` com `border-[#E4E8EE]` e `shadow-[0_1px_2px_rgba(0,0,0,0.04)]`
- Tipografia: títulos `#1A1F2C`, textos `#667085`, descrições `#98A2B3`
- Botão primário: `bg-[#1E8CFF] hover:bg-[#0072E0] text-white`
- Botão secundário: `bg-[#E9F3FF] text-[#1E8CFF] hover:bg-[#D8ECFF]`
- Campos de input: `bg-[#FFFFFF] border-[#E4E8EE] focus:ring-[#1E8CFF]/40`
- Hover de listas/cards: `bg-[#F1F5F9]`
- Destaques sutis (premium): bordas douradas (`#D4AF37/30`) opcionais

---

### 🌙 Dark Mode

- `darkMode: 'class'` (Tailwind).
- Classes utilitárias em `src/styles/index.css`:
  - `.card-theme`, `.text-theme-primary`, `.text-theme-secondary`
  - `.btn-theme-primary`, `.btn-theme-secondary`

---

## 🛠️ Classes Utilitárias Disponíveis

> **Localização:** `src/styles/index.css`  
> **Propósito:** Simplificar o desenvolvimento e garantir consistência automática de temas

### 📦 Componentes Base

#### `.card-theme`

Aplica estilos de card com suporte automático a dark mode.

```jsx
// ✅ USAR
<div className="card-theme rounded-lg p-6">Conteúdo do card</div>

// Equivale a:
// bg-light-surface dark:bg-dark-surface
// border border-light-border dark:border-dark-border
```

---

### 📝 Tipografia

#### `.text-theme-primary`

Texto principal com suporte a dark mode.

```jsx
// ✅ USAR
<h1 className="text-theme-primary text-2xl font-bold">Título Principal</h1>

// Equivale a:
// text-text-light-primary dark:text-text-dark-primary
```

#### `.text-theme-secondary`

Texto secundário (descrições, subtítulos).

```jsx
// ✅ USAR
<p className="text-theme-secondary text-sm">Texto secundário ou descrição</p>

// Equivale a:
// text-text-light-secondary dark:text-text-dark-secondary
```

---

### 🔘 Botões

#### `.btn-theme-primary`

Botão primário com cores principais.

```jsx
// ✅ USAR
<button className="btn-theme-primary rounded-lg px-4 py-2">Salvar</button>

// Equivale a:
// bg-primary hover:bg-primary-hover text-white
```

#### `.btn-theme-secondary`

Botão secundário com estilo neutro.

```jsx
// ✅ USAR
<button className="btn-theme-secondary rounded-lg px-4 py-2">Cancelar</button>

// Equivale a:
// bg-light-surface dark:bg-dark-surface
// border border-light-border dark:border-dark-border
// text-text-light-primary dark:text-text-dark-primary
// hover:bg-primary/10 hover:border-primary/20
```

---

### 📥 Inputs e Formulários

#### `.input-theme`

Campo de entrada com tema completo.

```jsx
// ✅ USAR
<input type="text" className="input-theme" placeholder="Digite aqui..." />

// Equivale a:
// w-full px-3 py-2.5 rounded-lg
// bg-light-surface dark:bg-dark-surface
// border border-light-border dark:border-dark-border
// text-text-light-primary dark:text-text-dark-primary
// placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary
// focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
// disabled:opacity-50 disabled:cursor-not-allowed
```

---

## ⚠️ Anti-Patterns: O Que EVITAR

### ❌ Classes Hardcoded (Cores Fixas)

**Problema:** Não funcionam em dark mode e criam inconsistências.

```jsx
// ❌ EVITAR - Classes hardcoded
<div className="bg-white text-gray-900 border-gray-200">
  <p className="text-gray-600">Texto sem suporte a dark mode</p>
</div>

// ✅ USAR - Tokens do Design System
<div className="card-theme">
  <p className="text-theme-secondary">Texto com suporte a dark mode</p>
</div>
```

---

### ❌ Cores Inline ou Valores Hexadecimais

```jsx
// ❌ EVITAR
<div className="bg-[#FFFFFF] text-[#1A1F2C]">
  Conteúdo
</div>

// ✅ USAR
<div className="bg-light-surface dark:bg-dark-surface text-theme-primary">
  Conteúdo
</div>
```

---

### ❌ Duplicação de Classes Dark Mode

```jsx
// ❌ EVITAR - Duplicação manual em cada elemento
<div className="bg-white dark:bg-gray-800">
  <h1 className="text-gray-900 dark:text-white">Título</h1>
  <p className="text-gray-600 dark:text-gray-400">Texto</p>
</div>

// ✅ USAR - Classes utilitárias
<div className="card-theme">
  <h1 className="text-theme-primary">Título</h1>
  <p className="text-theme-secondary">Texto</p>
</div>
```

---

### ❌ Uso de `gray-*` do Tailwind

```jsx
// ❌ EVITAR
<div className="bg-gray-100 text-gray-700 border-gray-300">
  Conteúdo
</div>

// ✅ USAR - Tokens personalizados
<div className="bg-light-bg dark:bg-dark-bg text-theme-primary border-light-border dark:border-dark-border">
  Conteúdo
</div>
```

---

## 📚 Exemplos Práticos de Uso

### Exemplo 1: Card de KPI

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

### Exemplo 2: Formulário Modal

```jsx
import React from 'react';
import { Modal } from '@/atoms/Modal';

function CreateUserModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Usuário">
      <div className="space-y-4 p-6">
        <div>
          <label className="text-theme-primary mb-1 block text-sm font-medium">
            Nome
          </label>
          <input
            type="text"
            className="input-theme"
            placeholder="Digite o nome..."
          />
        </div>

        <div>
          <label className="text-theme-primary mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            className="input-theme"
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button className="btn-theme-secondary flex-1">Cancelar</button>
          <button className="btn-theme-primary flex-1">Criar Usuário</button>
        </div>
      </div>
    </Modal>
  );
}
```

---

### Exemplo 3: Tabela com Dados

```jsx
function UsersTable({ users }) {
  return (
    <div className="card-theme overflow-hidden rounded-lg">
      <table className="w-full">
        <thead className="bg-light-bg dark:bg-dark-hover">
          <tr>
            <th className="text-theme-primary px-6 py-3 text-left text-sm font-semibold">
              Nome
            </th>
            <th className="text-theme-primary px-6 py-3 text-left text-sm font-semibold">
              Email
            </th>
            <th className="text-theme-primary px-6 py-3 text-left text-sm font-semibold">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-light-border dark:divide-dark-border">
          {users.map(user => (
            <tr
              key={user.id}
              className="transition-colors hover:bg-light-bg dark:hover:bg-dark-hover"
            >
              <td className="text-theme-primary px-6 py-4">{user.name}</td>
              <td className="text-theme-secondary px-6 py-4">{user.email}</td>
              <td className="px-6 py-4">
                <span className="rounded-full bg-feedback-light-success/10 px-2 py-1 text-xs font-medium text-feedback-light-success dark:bg-feedback-dark-success/10 dark:text-feedback-dark-success">
                  Ativo
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🎯 Ordem de Prioridade para Desenvolvimento

Ao criar novos componentes, seguir esta ordem:

1. **Primeira escolha:** Classes utilitárias (`.card-theme`, `.text-theme-*`, `.btn-theme-*`, `.input-theme`)
2. **Segunda escolha:** Tokens do Tailwind (`bg-light-surface dark:bg-dark-surface`)
3. **❌ NUNCA USAR:** Classes hardcoded (`bg-white`, `text-gray-600`, etc.)

---

## 🔗 Referência Cruzada

**Arquivo de configuração:** [`tailwind.config.js`](../../tailwind.config.js)  
**Estilos globais:** [`src/styles/index.css`](../../src/styles/index.css)  
**Documentação Tailwind:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

---

### ✍️ Tipografia & Espaçamento

- Utilizar utilitários Tailwind (`text-*`, `font-*`, `leading-*`, `tracking-*`).
- Espaçamentos com `p-*`, `m-*`, `gap-*` seguindo escala padrão.
- Fonte recomendada: `Inter` ou `Manrope` (peso 400–600).

---

### 📐 Breakpoints

`xs` 375 • `sm` 640 • `md` 768 • `lg` 1024 • `xl` 1280 • `2xl` 1536 • `3xl` 1920

---

## 🧩 Catálogo de Componentes

### ⚛️ Atoms (`src/atoms`)

- Button • Card • DateRangePicker • EmptyState • Input • PartySelector • StatusBadge • ThemeToggle • Tooltip • UnitSelector

### 🔗 Molecules (`src/molecules`)

- BankAccountCard • CalendarEventCard • CashflowChartCard • CashflowTimelineChart • CategoryModal(s) • ChartComponent • ClientModals • **CommissionsTable** • FinancialCalendarGrid • KPICard • NovaFormaPagamentoModal • ProductModals • RankingProfissionais • ReconciliationMatchCard • SupplierModals

#### CommissionsTable

Tabela responsiva para edição de comissões por serviço de profissionais.

**Props:**

- `professionalId` (string): ID do profissional
- `unitId` (string): ID da unidade

**Comportamento:**

- **Desktop (≥768px):** Tabela completa com colunas (Serviço, % Comissão, Status, Ações)
- **Mobile (<768px):** Cards verticais com ícones Clock e DollarSign
- **Edição inline:** Clique no ícone de lápis para editar, salvar ou cancelar
- **Validação:** Percentual entre 0-100, feedback visual com toast

**Uso:**

```jsx
import { CommissionsTable } from '../../molecules/CommissionsTable';

<CommissionsTable
  professionalId={professional.id}
  unitId={professional.unit_id}
/>;
```
