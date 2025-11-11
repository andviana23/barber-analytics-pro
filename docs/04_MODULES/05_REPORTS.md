---
title: 'Barber Analytics Pro - Reports Module'
author: 'Andrey Viana'
version: '1.0.0'
last_updated: '07/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 04.05 - Reports Module (Módulo de Relatórios)

Documentação técnica completa do **Módulo de Relatórios**, responsável por dashboards, KPIs e análises gerenciais.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Dashboards](#dashboards)
- [Relatórios Disponíveis](#relatórios-disponíveis)
- [Exportação](#exportação)
- [Métricas e KPIs](#métricas-e-kpis)

---

## 🎯 Visão Geral

O **Módulo de Relatórios** fornece:

- ✅ Dashboard financeiro interativo
- ✅ Gráficos de fluxo de caixa
- ✅ KPIs em tempo real
- 🚧 Ranking de profissionais (planejado)
- 🚧 Análise preditiva com IA (planejado)
- 🚧 Exportação PDF/Excel (planejado)

**Status:** Parcialmente implementado (Fase 1-2 concluídas, Fase 5 planejada)

---

## ⚙️ Funcionalidades

### 1. Dashboard Financeiro

**RF-05.01: Visualizar KPIs Financeiros** ✅

Cards de resumo:

- Receita Total
- Despesa Total
- Lucro Líquido
- Margem de Lucro (%)

Gráficos:

- Fluxo de Caixa Acumulado (linha)
- Receitas vs Despesas (barras)
- Receitas por Categoria (pizza)
- Evolução Mensal (área)

### 2. Ranking de Profissionais (Planejado)

**RF-05.02: Ranking de Desempenho** 🚧

Métricas por profissional:

- Total faturado no período
- Número de atendimentos
- Ticket médio
- Comissão total
- Avaliação média (NPS)

---

## 📊 Dashboards

### Dashboard Principal

```javascript
// FinancialDashboard.jsx
import { KPICard } from '@/molecules/KPICard';
import { CashflowChart } from '@/molecules/CashflowChart';
import { RevenueByCategory } from '@/molecules/RevenueByCategory';

export function FinancialDashboard() {
  const { data: summary } = useFinancialSummary();
  const { data: cashflow } = useDemonstrativoFluxo();

  return (
    <div className="grid gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KPICard
          title="Receita Total"
          value={formatCurrency(summary?.total_revenue)}
          trend={summary?.revenue_trend}
          icon={<TrendingUp />}
        />
        <KPICard
          title="Despesa Total"
          value={formatCurrency(summary?.total_expense)}
          trend={summary?.expense_trend}
          icon={<TrendingDown />}
        />
        <KPICard
          title="Lucro Líquido"
          value={formatCurrency(summary?.net_profit)}
          trend={summary?.profit_trend}
          icon={<DollarSign />}
        />
        <KPICard
          title="Margem"
          value={`${summary?.margin}%`}
          trend={summary?.margin_trend}
          icon={<Percent />}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CashflowChart data={cashflow} />
        <RevenueByCategory />
      </div>
    </div>
  );
}
```

### KPICard Component

```javascript
// src/molecules/KPICard.jsx
export function KPICard({ title, value, trend, icon }) {
  const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trend >= 0 ? ArrowUp : ArrowDown;

  return (
    <div className="card-theme p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2">{icon}</div>
        {trend && (
          <div className={`flex items-center ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="ml-1 text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-theme-secondary text-sm">{title}</p>
      <p className="text-theme-primary mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
```

### CashflowChart Component

```javascript
// src/molecules/CashflowChart.jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function CashflowChart({ data }) {
  return (
    <div className="card-theme p-6">
      <h3 className="text-theme-primary mb-4 text-lg font-semibold">
        Fluxo de Caixa Acumulado
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={date => formatDate(date, 'dd/MM')}
          />
          <YAxis tickFormatter={value => formatCurrency(value)} />
          <Tooltip
            formatter={value => formatCurrency(value)}
            labelFormatter={date => formatDate(date, 'dd/MM/yyyy')}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="saldo_acumulado"
            stroke="#1E8CFF"
            strokeWidth={2}
            name="Saldo Acumulado"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 📈 Relatórios Disponíveis

### 1. Demonstrativo de Fluxo de Caixa ✅

**Descrição:** Visualiza entradas, saídas e saldo acumulado por dia.

**Filtros:**

- Período (data inicial e final)
- Unidade
- Regime (Caixa ou Competência)

**Componente:**

```javascript
// DemonstrativoFluxoPage.jsx
export function DemonstrativoFluxoPage() {
  const [filters, setFilters] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    regime: 'CAIXA',
  });

  const { data, isLoading } = useDemonstrativoFluxo(filters);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">
        Demonstrativo de Fluxo de Caixa
      </h1>

      <FilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <CashflowChart data={data} />
          <CashflowTable data={data} />
        </>
      )}
    </div>
  );
}
```

---

### 2. DRE (Demonstrativo de Resultado) ✅

**Descrição:** Receita bruta, deduções, custos e lucro operacional.

**Estrutura:**

```
Receita Bruta: R$ 50.000
(-) Deduções: R$ 2.000 (taxas de pagamento)
(=) Receita Líquida: R$ 48.000

(-) Custos Fixos: R$ 15.000 (aluguel, salários)
(-) Custos Variáveis: R$ 8.000 (produtos, comissões)
(=) Lucro Operacional: R$ 25.000

Margem de Lucro: 50%
```

**Componente:**

```javascript
// DRECard.jsx
export function DRECard({ data }) {
  return (
    <div className="card-theme p-6">
      <h3 className="mb-4 text-xl font-bold">Demonstrativo de Resultado</h3>

      <div className="space-y-3">
        <DRELine label="Receita Bruta" value={data.receita_bruta} bold />
        <DRELine label="(-) Deduções" value={data.deducoes} negative />
        <DRELine
          label="(=) Receita Líquida"
          value={data.receita_liquida}
          bold
          highlight
        />

        <div className="my-4 border-t border-gray-200" />

        <DRELine label="(-) Custos Fixos" value={data.custos_fixos} negative />
        <DRELine
          label="(-) Custos Variáveis"
          value={data.custos_variaveis}
          negative
        />
        <DRELine
          label="(=) Lucro Operacional"
          value={data.lucro_operacional}
          bold
          highlight
        />

        <div className="mt-6 rounded-lg bg-primary/10 p-4">
          <p className="text-theme-secondary text-sm">Margem de Lucro</p>
          <p className="text-3xl font-bold text-primary">
            {data.margem_percentual.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Ranking de Profissionais (Planejado) 🚧

**Descrição:** Top performers do período.

**Métricas:**

```javascript
interface ProfessionalRanking {
  professional_id: string;
  name: string;
  total_revenue: number;
  services_count: number;
  average_ticket: number;
  commission: number;
  nps_score: number;
  rank: number;
}
```

**Componente:**

```javascript
// ProfessionalRanking.jsx
export function ProfessionalRanking({ period }) {
  const { data: ranking } = useProfessionalRanking(period);

  return (
    <div className="card-theme p-6">
      <h3 className="mb-4 text-xl font-bold">Ranking de Profissionais</h3>

      <div className="space-y-4">
        {ranking?.map((prof, index) => (
          <div key={prof.professional_id} className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${index === 0 ? 'bg-yellow-500' : ''} ${index === 1 ? 'bg-gray-400' : ''} ${index === 2 ? 'bg-orange-600' : ''} ${index > 2 ? 'bg-gray-200' : ''} `}
            >
              <span className="font-bold text-white">{index + 1}</span>
            </div>

            <div className="flex-1">
              <p className="font-semibold">{prof.name}</p>
              <p className="text-theme-secondary text-sm">
                {prof.services_count} atendimentos
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-primary">
                {formatCurrency(prof.total_revenue)}
              </p>
              <p className="text-theme-secondary text-sm">
                Ticket: {formatCurrency(prof.average_ticket)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📤 Exportação (Planejado)

### PDF Export

```javascript
// exportService.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function exportCashflowToPDF(data, filters) {
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(18);
  doc.text('Demonstrativo de Fluxo de Caixa', 14, 20);

  doc.setFontSize(11);
  doc.text(
    `Período: ${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}`,
    14,
    30
  );
  doc.text(`Regime: ${filters.regime}`, 14, 36);

  // Tabela
  doc.autoTable({
    startY: 45,
    head: [['Data', 'Entradas', 'Saídas', 'Saldo Dia', 'Saldo Acumulado']],
    body: data.map(row => [
      formatDate(row.date),
      formatCurrency(row.entradas),
      formatCurrency(row.saidas),
      formatCurrency(row.saldo_dia),
      formatCurrency(row.saldo_acumulado),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 140, 255] },
  });

  // Rodapé
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.text(
    `Gerado em ${formatDate(new Date(), 'dd/MM/yyyy HH:mm')} - Barber Analytics Pro`,
    14,
    doc.internal.pageSize.height - 10
  );

  // Download
  doc.save(`fluxo-caixa-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
}
```

### Excel Export

```javascript
import * as XLSX from 'xlsx';

export async function exportCashflowToExcel(data, filters) {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => ({
      Data: formatDate(row.date),
      Entradas: row.entradas,
      Saídas: row.saidas,
      'Saldo Dia': row.saldo_dia,
      'Saldo Acumulado': row.saldo_acumulado,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxo de Caixa');

  // Adicionar metadados
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [
        `Período: ${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}`,
      ],
      [`Regime: ${filters.regime}`],
      [],
    ],
    { origin: -1 }
  );

  XLSX.writeFile(
    workbook,
    `fluxo-caixa-${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`
  );
}
```

---

## 📊 Métricas e KPIs

### KPIs Financeiros

```javascript
// Financial Summary View
CREATE OR REPLACE VIEW vw_financial_summary AS
SELECT
  unit_id,
  DATE_TRUNC('month', date) AS month,

  -- Receitas
  SUM(CASE WHEN type = 'REVENUE' THEN value ELSE 0 END) AS total_revenue,
  COUNT(CASE WHEN type = 'REVENUE' THEN 1 END) AS revenue_count,

  -- Despesas
  SUM(CASE WHEN type = 'EXPENSE' THEN value ELSE 0 END) AS total_expense,
  COUNT(CASE WHEN type = 'EXPENSE' THEN 1 END) AS expense_count,

  -- Lucro
  SUM(CASE WHEN type = 'REVENUE' THEN value ELSE -value END) AS net_profit,

  -- Margem
  CASE
    WHEN SUM(CASE WHEN type = 'REVENUE' THEN value ELSE 0 END) > 0 THEN
      (SUM(CASE WHEN type = 'REVENUE' THEN value ELSE -value END) /
       SUM(CASE WHEN type = 'REVENUE' THEN value ELSE 0 END)) * 100
    ELSE 0
  END AS margin_percentage

FROM (
  SELECT unit_id, date, value, 'REVENUE' AS type FROM revenues WHERE status = 'PAID'
  UNION ALL
  SELECT unit_id, date, value, 'EXPENSE' AS type FROM expenses WHERE status = 'PAID'
) movements
GROUP BY unit_id, DATE_TRUNC('month', date);
```

### KPIs de Desempenho (Planejado)

```javascript
// Professional Performance View
CREATE OR REPLACE VIEW vw_professional_performance AS
SELECT
  p.id AS professional_id,
  p.name,
  p.unit_id,
  DATE_TRUNC('month', r.date) AS month,

  -- Faturamento
  SUM(r.value) AS total_revenue,
  COUNT(r.id) AS services_count,
  AVG(r.value) AS average_ticket,

  -- Comissões
  SUM(pc.commission_amount) AS total_commission,

  -- NPS (placeholder)
  0 AS nps_score

FROM professionals p
LEFT JOIN revenues r ON r.professional_id = p.id AND r.status = 'PAID'
LEFT JOIN professional_commissions pc ON pc.revenue_id = r.id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.unit_id, DATE_TRUNC('month', r.date);
```

---

## 🔗 Navegação

- [← 04.04 - Scheduler Module](./04_SCHEDULER.md)
- [→ 04.06 - Notifications Module](./06_NOTIFICATIONS.md)
- [📚 Documentação](../DOCUMENTACAO_INDEX.md)

---

## 📖 Referências

1. **Recharts**. Charting library built with React and D3. https://recharts.org
2. **jsPDF**. PDF generation library. https://github.com/parallax/jsPDF
3. **SheetJS**. Excel manipulation library. https://sheetjs.com

---

**Última atualização:** 7 de novembro de 2025
**Versão:** 1.0.0
**Autor:** Andrey Viana
