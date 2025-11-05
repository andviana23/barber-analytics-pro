/**
 * RELATÓRIO COMPARATIVO UNIDADES
 *
 * Componente para comparação visual e analítica entre unidades.
 * Refatorado seguindo Clean Architecture e padrões do sistema.
 */

import {
  Building2,
  DollarSign,
  Download,
  FileText,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button, Card } from '../../../atoms';
import KPICard from '../../../atoms/KPICard';
import {
  useComparativoUnidades,
  useExportRelatorio,
} from '../../../hooks/useRelatorios';
import ChartContainer from '../../../molecules/ChartContainer';
import MetricCard from '../../../molecules/MetricCard';
import { exportToPDF } from '../../../utils/exportUtils';

/**
 * Componente principal do relatório comparativo
 */
const RelatorioComparativoUnidades = ({ filters }) => {
  // Hooks
  const {
    data: comparativoData,
    isLoading,
    error,
    refetch,
  } = useComparativoUnidades(filters, {
    enabled: Boolean(filters?.period),
  });

  const { mutate: exportRelatorio, isLoading: isExporting } =
    useExportRelatorio();

  /**
   * Processamento dos dados para diferentes visualizações
   */
  const processedData = useMemo(() => {
    if (!comparativoData?.units) return null;

    const units = comparativoData.units;
    const totals = comparativoData.totals;

    // Dados para gráficos
    const chartData = units.map(unit => ({
      name: unit.name,
      receita: unit.metrics.revenue,
      lucro: unit.metrics.profit,
      atendimentos: unit.metrics.attendances,
      profissionais: unit.metrics.professionals,
    }));

    // Dados para gráfico de pizza
    const pieData = units
      .filter(unit => unit.metrics.revenue > 0)
      .map((unit, index) => ({
        name: unit.name,
        value: unit.metrics.revenue,
        percentage:
          totals.revenue > 0
            ? (unit.metrics.revenue / totals.revenue) * 100
            : 0,
        color: index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : '#F59E0B',
      }));

    // Top performer
    const topPerformer = units.reduce(
      (top, unit) => (unit.metrics.revenue > top.metrics.revenue ? unit : top),
      units[0] || {}
    );

    // Insights automáticos
    const insights = generateInsights(units, totals);

    return {
      units,
      totals,
      chartData,
      pieData,
      topPerformer,
      insights,
    };
  }, [comparativoData]);

  /**
   * Geração de insights automáticos
   */
  const generateInsights = (units, totals) => {
    if (!units || units.length < 2) return [];

    const insights = [];
    const [first, second] = units.sort(
      (a, b) => b.metrics.revenue - a.metrics.revenue
    );

    // Comparação de receita
    if (first && second) {
      const difference =
        ((first.metrics.revenue - second.metrics.revenue) /
          second.metrics.revenue) *
        100;
      insights.push(
        `${first.name} apresenta receita ${difference.toFixed(1)}% superior à ${second.name}`
      );
    }

    // Ticket médio
    const unitsByTicket = units.sort(
      (a, b) => b.metrics.averageTicket - a.metrics.averageTicket
    );
    if (unitsByTicket[0] && unitsByTicket[1]) {
      const ticketDiff =
        unitsByTicket[0].metrics.averageTicket -
        unitsByTicket[1].metrics.averageTicket;
      insights.push(
        `${unitsByTicket[0].name} tem ticket médio R$ ${ticketDiff.toFixed(2)} superior`
      );
    }

    // Crescimento
    const positiveGrowth = units.filter(unit => unit.metrics.growth > 0);
    if (positiveGrowth.length === units.length) {
      insights.push('Todas as unidades apresentam crescimento positivo');
    } else if (positiveGrowth.length > 0) {
      insights.push(
        `${positiveGrowth.length} de ${units.length} unidades em crescimento`
      );
    }

    // Total combinado
    insights.push(
      `Total combinado: R$ ${totals.revenue.toLocaleString('pt-BR')} em receita`
    );

    return insights;
  };

  /**
   * Handlers para exportação
   */
  const handleExportPDF = async () => {
    if (!processedData) return;

    try {
      const result = await exportToPDF(
        'relatorio-comparativo',
        `Comparativo_Unidades_${new Date().toISOString().split('T')[0]}`,
        `Comparativo entre Unidades - ${filters?.period || 'Período selecionado'}`
      );

      if (result.success) {
        console.log('PDF exportado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  };

  const handleExportExcel = () => {
    if (!processedData) return;

    exportRelatorio({
      type: 'comparativo-unidades',
      filters,
    });
  };

  /**
   * Estados de loading e erro
   */
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/2 rounded bg-light-bg dark:bg-dark-bg"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-32 rounded bg-light-bg dark:bg-dark-bg"
              ></div>
            ))}
          </div>
          <div className="h-80 rounded bg-light-bg dark:bg-dark-bg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-feedback-light-error/10 dark:bg-feedback-dark-error/10">
            <TrendingUp className="h-8 w-8 text-feedback-light-error dark:text-feedback-dark-error" />
          </div>
          <h3 className="text-theme-primary mb-2 text-lg font-semibold">
            Erro ao carregar comparativo
          </h3>
          <p className="text-theme-secondary mb-4">
            {error.message ||
              'Falha ao buscar dados do comparativo entre unidades'}
          </p>
          <Button onClick={refetch} variant="primary">
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  if (!processedData || !processedData.units.length) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-light-bg dark:bg-dark-bg">
            <Building2 className="text-theme-secondary h-8 w-8" />
          </div>
          <h3 className="text-theme-primary mb-2 text-lg font-semibold">
            Nenhuma unidade encontrada
          </h3>
          <p className="text-theme-secondary">
            Não há dados disponíveis para o período selecionado
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6" id="relatorio-comparativo">
      {/* Header com título e ações */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-theme-primary text-2xl font-bold">
            Comparativo entre Unidades
          </h2>
          <p className="text-theme-secondary mt-1">
            {comparativoData?.metadata?.period || 'Período selecionado'}
          </p>
        </div>

        <div className="mt-4 flex space-x-2 sm:mt-0">
          <Button
            variant="secondary"
            onClick={handleExportPDF}
            className="flex items-center"
            disabled={isExporting}
          >
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportExcel}
            className="flex items-center"
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* KPIs Resumo */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <KPICard
          title="Receita Total"
          value={processedData.totals.revenue}
          type="currency"
          icon={DollarSign}
          variant="primary"
        />
        <KPICard
          title="Lucro Total"
          value={processedData.totals.profit}
          type="currency"
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="Total Atendimentos"
          value={processedData.totals.attendances}
          type="number"
          icon={Target}
        />
        <KPICard
          title="Total Profissionais"
          value={processedData.totals.professionals}
          type="number"
          icon={Users}
        />
      </div>

      {/* Cards de Comparação Individual */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {processedData.units.map(unit => (
          <MetricCard
            key={unit.id}
            title={unit.name}
            subtitle={`${unit.metrics.professionals} profissionais`}
            variant={
              unit.id === processedData.topPerformer?.id
                ? 'highlighted'
                : 'default'
            }
            metrics={[
              {
                label: 'Receita Total',
                value: unit.metrics.revenue,
                type: 'currency',
                trend: unit.metrics.growth,
              },
              {
                label: 'Lucro Líquido',
                value: unit.metrics.profit,
                type: 'currency',
              },
              {
                label: 'Atendimentos',
                value: unit.metrics.attendances,
                type: 'number',
              },
              {
                label: 'Ticket Médio',
                value: unit.metrics.averageTicket,
                type: 'currency',
              },
              {
                label: 'Profissionais',
                value: unit.metrics.professionals,
                type: 'number',
              },
            ]}
          />
        ))}
      </div>

      {/* Gráficos */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico de Barras Comparativo */}
        <ChartContainer
          title="Comparação de Métricas"
          subtitle="Receita, lucro e atendimentos por unidade"
          height={350}
          onExport={handleExportExcel}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData.chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [
                  name === 'receita' || name === 'lucro'
                    ? `R$ ${value.toLocaleString('pt-BR')}`
                    : value.toLocaleString('pt-BR'),
                  name === 'receita'
                    ? 'Receita'
                    : name === 'lucro'
                      ? 'Lucro'
                      : 'Atendimentos',
                ]}
              />
              <Bar dataKey="receita" fill="#3B82F6" name="receita" />
              <Bar dataKey="lucro" fill="#10B981" name="lucro" />
              <Bar dataKey="atendimentos" fill="#F59E0B" name="atendimentos" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Gráfico de Pizza - Distribuição de Receita */}
        <ChartContainer
          title="Distribuição de Receita"
          subtitle="Participação de cada unidade no faturamento total"
          height={350}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData.pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, percentage }) =>
                  `${name}: ${percentage.toFixed(1)}%`
                }
              >
                {processedData.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={value => [
                  `R$ ${value.toLocaleString('pt-BR')}`,
                  'Receita',
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Análise e Insights */}
      <Card className="p-6">
        <h3 className="text-theme-primary mb-4 text-lg font-semibold">
          Análise e Insights
        </h3>
        <div className="text-theme-secondary space-y-3 text-sm">
          {processedData.insights.map((insight, index) => (
            <p key={index}>
              • <strong>{insight.split(':')[0]}:</strong>{' '}
              {insight.split(':')[1] || insight}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default RelatorioComparativoUnidades;
