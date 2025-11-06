# 🎯 PLANO COMPLETO DE REFATORAÇÃO - TanStack Table v8

> **Objetivo:** Migrar a tabela do Fluxo de Caixa para TanStack Table v8, mantendo 100% do Design System atual e corrigindo todos os bugs de fins de semana e 31/10.
>
> **Data de Criação:** 5 de novembro de 2025
> **Responsável:** Andrey Viana
> **Estimativa Total:** 3h15min

---

## 📋 VISÃO GERAL

### ✅ O que vamos usar:

- **TanStack Table v8** (MIT License, gratuito, headless)
- **Design System atual** (mantido 100%)
- **Tailwind CSS** (classes utilitárias já existentes)
- **Lucide React** (ícones já instalados)

### ❌ O que NÃO vamos usar:

- ~~MUI DataGrid~~ (pago)
- ~~AG Grid~~ (features pagas)
- ~~Bibliotecas de UI prontas~~ (conflitam com nosso DS)

---

## 🏗️ ARQUITETURA DA SOLUÇÃO

```
FluxoTabRefactored.jsx (ANTES)
├── processDailyData() → dados brutos com bugs
├── Tabela HTML manual → 200+ linhas de código
└── Lógica de limpeza espalhada → 3 camadas conflitantes

FluxoTabRefactored.jsx (DEPOIS)
├── useCashflowTable() → Custom hook TanStack
├── CashflowTable.jsx → Componente puro (Molecule)
│   ├── Column Definitions → Configuração declarativa
│   ├── Computed Columns → Acumulado calculado on-the-fly
│   └── Row Filters → Fins de semana removidos automaticamente
└── processDailyData() → Simplificado (sem limpeza manual)
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### 📦 FASE 1: SETUP E INSTALAÇÃO (10min)

- [ ] **1.1** Instalar TanStack Table

  ```bash
  pnpm add @tanstack/react-table
  ```

- [ ] **1.2** Criar estrutura de pastas
  - [ ] `src/molecules/CashflowTable/`
  - [ ] `src/molecules/CashflowTable/CashflowTable.jsx`
  - [ ] `src/molecules/CashflowTable/columns.js`
  - [ ] `src/molecules/CashflowTable/index.js`
  - [ ] `src/hooks/useCashflowTable.js`

---

### 🔧 FASE 2: CRIAR COLUMN DEFINITIONS (20min)

- [ ] **2.1** Criar arquivo `src/molecules/CashflowTable/columns.js`
  - [ ] Importar dependências (createColumnHelper, date-fns, lucide-react)
  - [ ] Criar `columnHelper`
  - [ ] Definir coluna de Data (com suporte a SALDO_INICIAL e fins de semana)
  - [ ] Definir coluna de Entradas (received_inflows)
  - [ ] Definir coluna de Saídas (paid_outflows + pending_outflows)
  - [ ] Definir coluna de Saldo do Dia (computed)
  - [ ] Definir coluna de Acumulado (computed)
  - [ ] Exportar `createCashflowColumns(formatCurrency, onEditBalance)`

- [ ] **2.2** Aplicar Design System nas colunas
  - [ ] Usar classes `.text-theme-primary` e `.text-theme-secondary`
  - [ ] Usar ícones Lucide React (TrendingUp, TrendingDown, Edit)
  - [ ] Manter badges de fim de semana (yellow-100, yellow-700)
  - [ ] Botão "Editar" com classes utilitárias

---

### 🎣 FASE 3: CRIAR CUSTOM HOOK (30min)

- [ ] **3.1** Criar arquivo `src/hooks/useCashflowTable.js`
  - [ ] Importar dependências (useMemo, TanStack Table, date-fns)
  - [ ] Criar função `useCashflowTable({ data, columns, dateRange, includeWeekends })`

- [ ] **3.2** Implementar FILTRO 1: Remover datas fora do período
  - [ ] Validar `dateRange.startDate` e `dateRange.endDate`
  - [ ] Extrair ano e mês esperados
  - [ ] Filtrar array mantendo apenas SALDO_INICIAL e datas do mês vigente
  - [ ] Log de datas removidas

- [ ] **3.3** Implementar FILTRO 2: Remover fins de semana
  - [ ] Verificar flag `includeWeekends`
  - [ ] Usar `parseISO` + `startOfDay` + `getDay()` para detectar fins de semana
  - [ ] Filtrar array removendo sábados e domingos
  - [ ] Log de fins de semana removidos

- [ ] **3.4** Implementar CÁLCULO DE ACUMULADO (on-the-fly)
  - [ ] Inicializar `accumulated = 0`
  - [ ] Iterar sobre array processado
  - [ ] Para SALDO_INICIAL: usar `row.accumulatedBalance`
  - [ ] Para dias normais: calcular `dailyBalance = inflows - outflows`
  - [ ] Atualizar `accumulated += dailyBalance`
  - [ ] Retornar row com `accumulatedBalance` atualizado

- [ ] **3.5** Criar instância TanStack Table
  - [ ] Usar `useReactTable` com configurações
  - [ ] Habilitar `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`
  - [ ] Configurar sorting inicial por data (ascendente)

- [ ] **3.6** Retornar objeto com `{ table, stats, data }`
  - [ ] `table`: instância TanStack
  - [ ] `stats`: estatísticas úteis (totalRows, weekendRowsRemoved, etc.)
  - [ ] `data`: array processado

---

### 🎨 FASE 4: CRIAR COMPONENTE DA TABELA (40min)

- [ ] **4.1** Criar arquivo `src/molecules/CashflowTable/CashflowTable.jsx`
  - [ ] Importar dependências (React, flexRender, lucide-react)
  - [ ] Criar componente `CashflowTable({ table, loading, emptyMessage })`

- [ ] **4.2** Implementar estado de LOADING
  - [ ] Renderizar spinner com classes `.card-theme`
  - [ ] Usar ícone de loading animado
  - [ ] Texto "Carregando dados..."

- [ ] **4.3** Implementar estado VAZIO
  - [ ] Renderizar card vazio com ícone DollarSign
  - [ ] Mostrar `emptyMessage`

- [ ] **4.4** Implementar HEADER da tabela
  - [ ] Card com `.card-theme`
  - [ ] Seção de header com borda inferior
  - [ ] Ícone DollarSign + título "Fluxo Diário Consolidado"

- [ ] **4.5** Implementar THEAD
  - [ ] Usar `table.getHeaderGroups()`
  - [ ] Aplicar classes do Design System
  - [ ] Alinhamento condicional (Data=left, restante=right)

- [ ] **4.6** Implementar TBODY
  - [ ] Usar `table.getRowModel().rows`
  - [ ] Aplicar `flexRender` para células
  - [ ] Classes condicionais:
    - [ ] SALDO_INICIAL: `bg-primary/5 hover:bg-primary/10`
    - [ ] Fins de semana: `bg-light-surface/50 hover:bg-light-hover`
    - [ ] Dias normais: `hover:bg-light-hover dark:hover:bg-dark-hover`

- [ ] **4.7** Criar arquivo `src/molecules/CashflowTable/index.js`
  - [ ] Exportar `CashflowTable`
  - [ ] Exportar `createCashflowColumns`

---

### 🔄 FASE 5: INTEGRAR NO FluxoTabRefactored (30min)

- [ ] **5.1** Adicionar imports no início do arquivo

  ```javascript
  import { useCashflowTable } from '../../hooks/useCashflowTable';
  import {
    CashflowTable,
    createCashflowColumns,
  } from '../../molecules/CashflowTable';
  ```

- [ ] **5.2** Criar colunas com useMemo

  ```javascript
  const columns = useMemo(
    () => createCashflowColumns(formatCurrency, handleEditBalance),
    []
  );
  ```

- [ ] **5.3** Criar tabela com hook customizado

  ```javascript
  const { table, stats } = useCashflowTable({
    data: cashflowData.daily,
    columns,
    dateRange,
    includeWeekends: false,
  });
  ```

- [ ] **5.4** Substituir tabela HTML manual por componente TanStack
  - [ ] Remover código antigo (~linha 1287-1550)
  - [ ] Adicionar `<CashflowTable table={table} loading={loading} />`

- [ ] **5.5** Adicionar log de estatísticas (opcional)
  ```javascript
  console.log('📊 [FluxoTab] Estatísticas da tabela:', stats);
  ```

---

### 🧪 FASE 6: SIMPLIFICAR processDailyData (20min)

- [ ] **6.1** Remover layer de limpeza de fins de semana
  - [ ] Deletar código da linha ~708 (🚫 LIMPEZA FINAL)
  - [ ] Remover função `cleanedResult`

- [ ] **6.2** Remover filtro final defensivo
  - [ ] Deletar código da linha ~760 (🚨 FILTRO FINAL DEFENSIVO)
  - [ ] Remover função `filteredByMonth`

- [ ] **6.3** Remover cálculo de acumulado manual
  - [ ] Deletar loop de cálculo de `accumulatedBalance` (linha ~655)
  - [ ] Manter apenas `dailyBalance` no retorno

- [ ] **6.4** Simplificar retorno da função

  ```javascript
  return [saldoInicialRow, ...result];
  ```

- [ ] **6.5** Remover console.log de debug
  - [ ] `[CLEANUP-LAYER]`
  - [ ] `[FLUXO-CAIXA-FINAL]`
  - [ ] `[FILTRO-FINAL]`

---

### 📊 FASE 7: TESTES E VALIDAÇÃO (30min)

- [ ] **7.1** Teste Funcional
  - [ ] Verificar que 31/10 **NÃO** aparece
  - [ ] Verificar que fins de semana **NÃO** aparecem
  - [ ] Verificar acumulado está correto
  - [ ] Verificar linha SALDO_INICIAL aparece
  - [ ] Verificar botão "Editar" funciona

- [ ] **7.2** Teste de Filtros de Período
  - [ ] Filtro "Dia" mostra 1 dia
  - [ ] Filtro "Semana" mostra 5 dias úteis (sem fins de semana)
  - [ ] Filtro "Mês" mostra ~21 dias úteis + SALDO_INICIAL

- [ ] **7.3** Teste Visual (Design System)
  - [ ] Light mode funciona
  - [ ] Dark mode funciona
  - [ ] Cores de entradas (verde) corretas
  - [ ] Cores de saídas (vermelho) corretas
  - [ ] Hover effects funcionam
  - [ ] Badges de fim de semana (se incluídos) corretos

- [ ] **7.4** Teste de Performance
  - [ ] Console mostra estatísticas corretas
  - [ ] Sem re-renders desnecessários
  - [ ] Sorting funciona (clicar no header)

- [ ] **7.5** Teste de Exportação
  - [ ] Exportar CSV funciona
  - [ ] Exportar Excel funciona
  - [ ] Exportar PDF funciona

- [ ] **7.6** Teste Responsivo
  - [ ] Desktop (≥1024px) OK
  - [ ] Tablet (768px-1023px) OK
  - [ ] Mobile (<768px) com scroll horizontal

---

### 🧹 FASE 8: LIMPEZA FINAL (15min)

- [ ] **8.1** Remover código antigo comentado
  - [ ] Buscar por `// ❌` ou `// OLD`
  - [ ] Remover tabela HTML manual

- [ ] **8.2** Remover console.log de debug
  - [ ] `🚨 [ANTES-SET-STATE]`
  - [ ] `🔄 [CASHFLOW-STATE-CHANGE]`
  - [ ] `🔍 [RENDER-DATA]`
  - [ ] `🎯 [TABLE-RENDER]`
  - [ ] `[UI-RENDER-INFLOWS]`
  - [ ] `[UI-RENDER-OUTFLOWS]`
  - [ ] `[REVENUE-WEEKEND-DEBUG]`
  - [ ] `[CLEANUP-LAYER]`

- [ ] **8.3** Atualizar documentação
  - [ ] Adicionar comentários JSDoc nos novos componentes
  - [ ] Atualizar `docs/DESIGN_SYSTEM.md` com exemplo de CashflowTable
  - [ ] Atualizar `README.md` se necessário

- [ ] **8.4** Commit final

  ```bash
  git add .
  git commit -m "refactor: migrar Fluxo de Caixa para TanStack Table v8

  - Corrige bugs de fins de semana e 31/10
  - Implementa cálculo de acumulado on-the-fly
  - Reduz código de 1550 para ~800 linhas
  - Mantém 100% do Design System
  "
  ```

---

## 📈 BENEFÍCIOS DA REFATORAÇÃO

| Aspecto                    | Antes                      | Depois                     |
| -------------------------- | -------------------------- | -------------------------- |
| **Linhas de código**       | ~1550                      | ~800                       |
| **Bugs de fins de semana** | 3 camadas com conflitos    | 0 (filtro automático)      |
| **Bug do 31/10**           | Data fora do período       | 0 (validação rigorosa)     |
| **Cálculo de acumulado**   | Manual, propenso a erros   | Computed, sempre correto   |
| **Performance**            | Re-render completo         | Virtualização otimizada    |
| **Manutenibilidade**       | Lógica espalhada           | Declarativa e centralizada |
| **Testabilidade**          | Difícil (lógica no render) | Fácil (hooks isolados)     |

---

## ⏱️ CRONOGRAMA

| Fase                            | Tempo Estimado | Acumulado   | Status      |
| ------------------------------- | -------------- | ----------- | ----------- |
| 1. Setup                        | 10min          | 10min       | ⏳ Pendente |
| 2. Column Definitions           | 20min          | 30min       | ⏳ Pendente |
| 3. Custom Hook                  | 30min          | 1h          | ⏳ Pendente |
| 4. Componente da Tabela         | 40min          | 1h40min     | ⏳ Pendente |
| 5. Integração                   | 30min          | 2h10min     | ⏳ Pendente |
| 6. Simplificar processDailyData | 20min          | 2h30min     | ⏳ Pendente |
| 7. Testes                       | 30min          | 3h          | ⏳ Pendente |
| 8. Limpeza                      | 15min          | **3h15min** | ⏳ Pendente |

---

## 🚨 PROBLEMAS CONHECIDOS (A SEREM CORRIGIDOS)

### Bug #1: 31/10 aparece na tabela

- **Causa:** Filtro de datas não está funcionando corretamente
- **Solução:** Validação rigorosa no hook `useCashflowTable` (FILTRO 1)

### Bug #2: Domingo 02/11 mostra R$ 2.136,56

- **Causa:** Layer de limpeza não recalcula acumulado
- **Solução:** Remover fins de semana no hook antes do cálculo (FILTRO 2)

### Bug #3: Domingo 09/11 mostra R$ 1.397,18 de saída

- **Causa:** Despesas sendo alocadas em fins de semana
- **Solução:** Filtro automático remove fins de semana completamente

---

## 📚 REFERÊNCIAS

- [TanStack Table v8 Docs](https://tanstack.com/table/v8/docs/guide/introduction)
- [Design System do Projeto](./DESIGN_SYSTEM.md)
- [TanStack Table Examples](https://tanstack.com/table/v8/docs/examples/react/basic)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Revisar este plano
2. ⏳ Executar FASE 1 (Setup)
3. ⏳ Executar FASE 2 (Columns)
4. ⏳ Executar FASE 3 (Hook)
5. ⏳ Executar FASE 4 (Componente)
6. ⏳ Executar FASE 5 (Integração)
7. ⏳ Executar FASE 6 (Simplificação)
8. ⏳ Executar FASE 7 (Testes)
9. ⏳ Executar FASE 8 (Limpeza)

---

**Última Atualização:** 5 de novembro de 2025
**Status Geral:** 🟡 Planejamento Completo - Aguardando Execução
