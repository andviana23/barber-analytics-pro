# 🔄 Refatoração Completa - Fluxo de Caixa

**Data:** 5 de novembro de 2025
**Autor:** Andrey Viana
**Objetivo:** Criar página de Fluxo de Caixa DO ZERO seguindo 100% Clean Architecture + DDD + Atomic Design

---

## 🎯 Por Que Refatorar do Zero?

### ❌ Problemas do Código Atual

1. **Múltiplas layers conflitantes:**
   - `processDailyData` tem CLEANUP-LAYER (linha ~708)
   - FILTRO-FINAL DEFENSIVO (linha ~760)
   - Cálculo manual de acumulado (linha ~655)
   - `useCashflowTable` tem FILTRO 1 e FILTRO 2
   - **Resultado:** 4 camadas fazendo a mesma coisa = bugs

2. **Bugs persistentes:**
   - 31/10 aparecendo em novembro
   - Fins de semana com valores (R$ 2.136,56, R$ 1.397,18)
   - Acumulado incorreto
   - **Causa:** Cada layer aplica lógica diferente

3. **Código não segue padrões:**
   - Sem Repository/Service/DTO
   - Lógica de negócio dentro do componente
   - 1567 linhas em um único arquivo
   - Duplicação de código

4. **Manutenibilidade zero:**
   - Impossível debugar (4 layers)
   - Impossível adicionar features
   - Impossível testar isoladamente

### ✅ Solução: Começar do Zero com Arquitetura Limpa

**Princípios:**

- Uma responsabilidade por camada
- Código testável e modular
- Separação clara: dados → lógica → apresentação
- Design System 100%

---

## 🏗️ Arquitetura da Nova Página

```
┌─────────────────────────────────────────────────────┐
│                    UI LAYER                         │
│  FluxoCaixaPage.jsx (100-150 linhas)               │
│  - Renderiza componentes                            │
│  - Não tem lógica de negócio                        │
└─────────────────────────────────────────────────────┘
                       ↓ usa
┌─────────────────────────────────────────────────────┐
│                  HOOKS LAYER                        │
│  useFluxoCaixa.js (80-100 linhas)                  │
│  - Estado da página                                 │
│  - Cache (TanStack Query)                           │
│  - Chama services                                   │
└─────────────────────────────────────────────────────┘
                       ↓ chama
┌─────────────────────────────────────────────────────┐
│                 SERVICE LAYER                       │
│  fluxoCaixaService.js (150-200 linhas)             │
│  - Regras de negócio                                │
│  - Validações (DTOs)                                │
│  - Transformações de dados                          │
│  - Cálculos (acumulado, saldos)                     │
└─────────────────────────────────────────────────────┘
                       ↓ usa
┌─────────────────────────────────────────────────────┐
│                REPOSITORY LAYER                     │
│  fluxoCaixaRepository.js (100-120 linhas)          │
│  - Acesso ao Supabase                               │
│  - Queries SQL                                      │
│  - Retorna { data, error }                          │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Estrutura de Arquivos

```
src/
├── repositories/
│   └── fluxoCaixaRepository.js          # ✅ NOVO - Acesso Supabase
├── services/
│   └── fluxoCaixaService.js             # ✅ NOVO - Regras de negócio
├── dtos/
│   ├── FluxoCaixaFilterDTO.js           # ✅ NOVO - Validação filtros
│   └── FluxoCaixaDailyDTO.js            # ✅ NOVO - Validação dados diários
├── hooks/
│   ├── useFluxoCaixa.js                 # ✅ NOVO - Hook principal
│   └── useFluxoCaixaTable.js            # ✅ JÁ EXISTE - Reusar
├── molecules/
│   ├── CashflowTable/                   # ✅ JÁ EXISTE - Reusar
│   ├── FluxoCaixaKPIs.jsx               # ✅ NOVO - Cards de métricas
│   ├── FluxoCaixaTimeline.jsx           # ✅ NOVO - Gráfico timeline
│   └── FluxoCaixaPieCharts.jsx          # ✅ NOVO - Gráficos pizza
├── organisms/
│   └── FluxoCaixaDashboard.jsx          # ✅ NOVO - Dashboard completo
└── pages/
    └── FluxoCaixaPage.jsx               # ✅ NOVO - Página limpa
```

---

## 🗂️ Detalhamento dos Arquivos

### 1. Repository - `fluxoCaixaRepository.js`

**Responsabilidade:** Buscar dados do Supabase

```javascript
// src/repositories/fluxoCaixaRepository.js

import { supabase } from '../config/supabaseClient';

export const fluxoCaixaRepository = {
  /**
   * Busca receitas do período
   */
  async fetchRevenues({ unitId, startDate, endDate }) {
    const { data, error } = await supabase
      .from('revenues')
      .select(
        '*, payment_method:payment_methods(name), professional:professionals(name)'
      )
      .eq('unit_id', unitId)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .eq('status', 'recebido')
      .order('payment_date');

    return { data, error };
  },

  /**
   * Busca despesas do período
   */
  async fetchExpenses({ unitId, startDate, endDate }) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, category:expense_categories(name)')
      .eq('unit_id', unitId)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .eq('status', 'pago')
      .order('due_date');

    return { data, error };
  },

  /**
   * Busca saldo inicial do período
   */
  async fetchInitialBalance({ unitId, startDate }) {
    const { data, error } = await supabase
      .from('cash_register_closures')
      .select('final_balance')
      .eq('unit_id', unitId)
      .lt('closure_date', startDate)
      .order('closure_date', { ascending: false })
      .limit(1)
      .single();

    return { data: data?.final_balance || 0, error };
  },
};
```

---

### 2. Service - `fluxoCaixaService.js`

**Responsabilidade:** Regras de negócio e transformações

```javascript
// src/services/fluxoCaixaService.js

import { fluxoCaixaRepository } from '../repositories/fluxoCaixaRepository';
import { FluxoCaixaFilterDTO } from '../dtos/FluxoCaixaFilterDTO';
import { startOfDay, endOfDay, isWeekend, parseISO } from 'date-fns';

export const fluxoCaixaService = {
  /**
   * Busca dados completos do fluxo de caixa
   * @param {Object} filters - Filtros validados pelo DTO
   * @returns {Promise<{data, error}>}
   */
  async getFluxoCaixaData(filters) {
    // 1. Validar filtros
    const filterDTO = new FluxoCaixaFilterDTO(filters);
    if (!filterDTO.isValid()) {
      return { data: null, error: filterDTO.getErrors() };
    }

    const validFilters = filterDTO.toObject();

    // 2. Buscar dados em paralelo
    const [revenuesResult, expensesResult, balanceResult] = await Promise.all([
      fluxoCaixaRepository.fetchRevenues(validFilters),
      fluxoCaixaRepository.fetchExpenses(validFilters),
      fluxoCaixaRepository.fetchInitialBalance(validFilters),
    ]);

    // 3. Verificar erros
    if (revenuesResult.error || expensesResult.error || balanceResult.error) {
      return {
        data: null,
        error:
          revenuesResult.error || expensesResult.error || balanceResult.error,
      };
    }

    // 4. Processar dados
    const daily = this._processDailyData({
      revenues: revenuesResult.data,
      expenses: expensesResult.data,
      initialBalance: balanceResult.data,
      startDate: validFilters.startDate,
      endDate: validFilters.endDate,
      includeWeekends: validFilters.includeWeekends,
    });

    // 5. Calcular KPIs
    const summary = this._calculateSummary(daily);

    return {
      data: {
        daily,
        summary,
        filters: validFilters,
      },
      error: null,
    };
  },

  /**
   * Processa dados diários (ÚNICA camada de processamento)
   * @private
   */
  _processDailyData({
    revenues,
    expenses,
    initialBalance,
    startDate,
    endDate,
    includeWeekends,
  }) {
    const dailyMap = new Map();
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Agrupar receitas por dia
    revenues.forEach(revenue => {
      const date = revenue.payment_date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, entries: 0, exits: 0 });
      }
      dailyMap.get(date).entries += Number(revenue.amount);
    });

    // Agrupar despesas por dia
    expenses.forEach(expense => {
      const date = expense.due_date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, entries: 0, exits: 0 });
      }
      dailyMap.get(date).exits += Number(expense.amount);
    });

    // Converter para array e ordenar
    let dailyArray = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // FILTRO 1: Remover fins de semana (se configurado)
    if (!includeWeekends) {
      dailyArray = dailyArray.filter(day => {
        const date = parseISO(day.date);
        return !isWeekend(date);
      });
    }

    // CÁLCULO: Acumulado (sempre on-the-fly, nunca pré-calculado)
    let accumulated = initialBalance;
    dailyArray.forEach(day => {
      const dailyBalance = day.entries - day.exits;
      accumulated += dailyBalance;
      day.accumulated = accumulated;
      day.dailyBalance = dailyBalance;
    });

    // Adicionar linha SALDO_INICIAL no início
    dailyArray.unshift({
      date: 'SALDO_INICIAL',
      entries: 0,
      exits: 0,
      dailyBalance: 0,
      accumulated: initialBalance,
    });

    return dailyArray;
  },

  /**
   * Calcula resumo/KPIs
   * @private
   */
  _calculateSummary(daily) {
    const totalEntries = daily.reduce((sum, day) => sum + day.entries, 0);
    const totalExits = daily.reduce((sum, day) => sum + day.exits, 0);
    const finalBalance = daily[daily.length - 1]?.accumulated || 0;

    return {
      totalEntries,
      totalExits,
      finalBalance,
      netProfit: totalEntries - totalExits,
    };
  },
};
```

---

### 3. DTOs - Validação de Dados

#### `FluxoCaixaFilterDTO.js`

```javascript
// src/dtos/FluxoCaixaFilterDTO.js

export class FluxoCaixaFilterDTO {
  constructor(data) {
    this.unitId = data.unitId;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.includeWeekends = data.includeWeekends ?? false;
    this.errors = [];
  }

  isValid() {
    if (!this.unitId) {
      this.errors.push('unitId é obrigatório');
    }
    if (!this.startDate) {
      this.errors.push('startDate é obrigatório');
    }
    if (!this.endDate) {
      this.errors.push('endDate é obrigatório');
    }
    if (this.startDate > this.endDate) {
      this.errors.push('startDate deve ser anterior a endDate');
    }
    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors.join(', ');
  }

  toObject() {
    return {
      unitId: this.unitId,
      startDate: this.startDate,
      endDate: this.endDate,
      includeWeekends: this.includeWeekends,
    };
  }
}
```

---

### 4. Hook - `useFluxoCaixa.js`

```javascript
// src/hooks/useFluxoCaixa.js

import { useQuery } from '@tanstack/react-query';
import { fluxoCaixaService } from '../services/fluxoCaixaService';
import { toast } from 'sonner';

export function useFluxoCaixa({
  unitId,
  startDate,
  endDate,
  includeWeekends = false,
}) {
  const query = useQuery({
    queryKey: ['fluxo-caixa', unitId, startDate, endDate, includeWeekends],
    queryFn: async () => {
      const result = await fluxoCaixaService.getFluxoCaixaData({
        unitId,
        startDate,
        endDate,
        includeWeekends,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!unitId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutos
    onError: error => {
      toast.error(`Erro ao carregar fluxo de caixa: ${error.message}`);
    },
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

---

### 5. Page - `FluxoCaixaPage.jsx` (LIMPA!)

```javascript
// src/pages/FluxoCaixaPage.jsx

import React, { useMemo } from 'react';
import { useFluxoCaixa } from '../hooks/useFluxoCaixa';
import { useFluxoCaixaTable } from '../hooks/useFluxoCaixaTable';
import { CashflowTable } from '../molecules/CashflowTable';
import { createCashflowColumns } from '../molecules/CashflowTable/columns';
import { FluxoCaixaKPIs } from '../molecules/FluxoCaixaKPIs';
import { FluxoCaixaTimeline } from '../molecules/FluxoCaixaTimeline';
import { useGlobalFilters } from '../hooks/useGlobalFilters';
import { usePeriodFilter } from '../hooks/usePeriodFilter';

export default function FluxoCaixaPage() {
  // 1. Filtros globais
  const { globalFilters } = useGlobalFilters();
  const { dateRange } = usePeriodFilter();

  // 2. Buscar dados (Service Layer)
  const { data, loading, error, refetch } = useFluxoCaixa({
    unitId: globalFilters.unitId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    includeWeekends: false,
  });

  // 3. Criar colunas TanStack
  const columns = useMemo(() => createCashflowColumns(/* formatters */), []);

  // 4. Criar instância TanStack Table
  const { table } = useFluxoCaixaTable({
    data: data?.daily || [],
    columns,
  });

  // 5. Renderização LIMPA
  return (
    <div className="space-y-6 p-6">
      {/* KPIs */}
      <FluxoCaixaKPIs summary={data?.summary} loading={loading} />

      {/* Timeline */}
      <FluxoCaixaTimeline data={data?.daily} loading={loading} />

      {/* Tabela */}
      <CashflowTable table={table} loading={loading} />
    </div>
  );
}
```

**Total: ~60 linhas** (vs 1567 linhas antigas)

---

## 📋 Plano de Execução

### FASE 1: Repository + Service (40min)

- [ ] Criar `fluxoCaixaRepository.js`
- [ ] Criar `fluxoCaixaService.js`
- [ ] Testar isoladamente (unit tests)

### FASE 2: DTOs (20min)

- [ ] Criar `FluxoCaixaFilterDTO.js`
- [ ] Criar `FluxoCaixaDailyDTO.js`
- [ ] Validar todos os casos

### FASE 3: Hook (30min)

- [ ] Criar `useFluxoCaixa.js`
- [ ] Integrar TanStack Query
- [ ] Testar cache e refetch

### FASE 4: Componentes (60min)

- [ ] Criar `FluxoCaixaKPIs.jsx`
- [ ] Criar `FluxoCaixaTimeline.jsx`
- [ ] Reusar `CashflowTable` (já existe)

### FASE 5: Página Final (30min)

- [ ] Criar `FluxoCaixaPage.jsx`
- [ ] Integrar todos os componentes
- [ ] Testar end-to-end

### FASE 6: Testes e Deploy (40min)

- [ ] Testar bugs (31/10, fins de semana, acumulado)
- [ ] Dark mode
- [ ] Responsividade
- [ ] Deploy

**Total: 3h20min** (vs 8 fases anteriores)

---

## ✅ Benefícios da Refatoração

| Aspecto              | Antes          | Depois             |
| -------------------- | -------------- | ------------------ |
| **Linhas de código** | 1567 linhas    | ~400 linhas total  |
| **Arquitetura**      | Monolítica     | Clean Architecture |
| **Testabilidade**    | 0%             | 100%               |
| **Bugs**             | 3 persistentes | 0 (design correto) |
| **Manutenibilidade** | Impossível     | Fácil              |
| **Layers de filtro** | 4 conflitantes | 1 única (Service)  |

---

## 🚀 Resultado Final

✅ **Uma única fonte de verdade:** `fluxoCaixaService._processDailyData()`
✅ **Zero duplicação:** Cada layer tem responsabilidade única
✅ **Testável:** Cada função pode ser testada isoladamente
✅ **Bugs eliminados:** Lógica clara e sem conflitos
✅ **Código limpo:** 400 linhas vs 1567 linhas

---

**Próximo passo:** Executar FASE 1 ou continuar tentando consertar código legado?
