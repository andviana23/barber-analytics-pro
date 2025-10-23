# 🎨 Design System

> **Guia visual e semântico do Barber Analytics Pro, fundamentado em Atomic Design e tokens de Tailwind CSS.**
>
> **Criado em:** 2025-10-22  
> **Autor:** Codex (IA)

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

### 🎯 Paleta (tailwind.config.js)

| Token | Valor |
|-------|-------|
| `primary.DEFAULT` | `#4DA3FF` |
| `primary.hover` | `#1E8CFF` |
| `primary.light` | `#E8F3FF` |
| `light.bg / surface / border` | `#F9FAFB` • `#FFFFFF` • `#E2E8F0` |
| `dark.bg / surface / border` | `#0C0F12` • `#161B22` • `#242C37` |
| `text-light.primary / secondary` | `#1E293B` • `#64748B` |
| `text-dark.primary / secondary` | `#F5F7FA` • `#A5AFBE` |
| Feedback Light | Sucesso `#16A34A` • Erro `#EF4444` • Aviso `#F59E0B` |
| Feedback Dark | Sucesso `#3BD671` • Erro `#FF7E5F` • Aviso `#F4B400` |

### 🌙 Dark Mode

- `darkMode: 'class'` (Tailwind).  
- Classes utilitárias em `src/styles/index.css`:
  - `.card-theme`, `.text-theme-primary`, `.text-theme-secondary`
  - `.btn-theme-primary`, `.btn-theme-secondary`

### ✍️ Tipografia & Espaçamento

- Utilizar utilitários Tailwind (`text-*`, `font-*`, `leading-*`, `tracking-*`).
- Espaçamentos com `p-*`, `m-*`, `gap-*` seguindo escala padrão.

### 📐 Breakpoints

`xs` 375 • `sm` 640 • `md` 768 • `lg` 1024 • `xl` 1280 • `2xl` 1536 • `3xl` 1920 (definidos no `tailwind.config.js`).

---

## 🧩 Catálogo de Componentes

### ⚛️ Atoms (`src/atoms`)
- Button • Card • DateRangePicker • EmptyState • Input • PartySelector • StatusBadge • ThemeToggle • Tooltip • UnitSelector

### 🔗 Molecules (`src/molecules`)
- BankAccountCard • CalendarEventCard • CashflowChartCard • CashflowTimelineChart • CategoryModal(s) • ChartComponent • ClientModals • FinancialCalendarGrid • KPICard • NovaFormaPagamentoModal • ProductModals • RankingProfissionais • ReconciliationMatchCard • SupplierModals

### 🧱 Organisms (`src/organisms`)
- BankAccountModals • CalendarioToolbar • ConciliacaoPanel • DashboardDemo • FluxoSummaryPanel • MainContainer • Navbar • PalettePreview • Sidebar

### 🧩 Templates (`src/templates`)
- EventDetailsModal • ImportStatementModal • ManualReconciliationModal • NovaDespesaAccrualModal • NovaReceitaAccrualModal

---

## 🛠️ Padrões de Implementação

- 📦 Componentes em PascalCase e arquivos/pastas em inglês.  
- 🧾 Documentar props complexas com JSDoc ou TypeScript.  
- 🧑‍🦽 Garantir navegação por teclado (`focus:outline-none focus:ring`).  
- 🖼️ Utilizar HTML semântico (`button`, `nav`, `section`, `table`, `label`).

---

## 💡 Exemplos

```jsx
// Botão primário
<button className="btn-theme-primary px-4 py-2 rounded-md">Salvar</button>

// Card temático
<div className="card-theme p-4 rounded-lg shadow-sm">
  <h3 className="text-theme-primary text-lg font-medium">Título</h3>
  <p className="text-theme-secondary text-sm">Descrição</p>
  <div className="mt-2">
    <button className="btn-theme-secondary px-3 py-1 rounded-md">Ação</button>
  </div>
</div>
```

---

## ✅ Boas Práticas

- [✅] Reutilize atoms/molecules antes de criar novos componentes.  
- [✅] Prefira utilitários Tailwind e classes temáticas existentes.  
- [✅] Evite estilos inline — centralize tokens em Tailwind/CSS.  
- [✅] Teste responsividade (`xs` → `3xl`) e contraste em ambos os temas.

