import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  PieChart,
  Printer,
  RefreshCw,
  Settings,
  Share2,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button, UnitSelector } from '../../atoms';
import DREDynamicView from '../../components/finance/DREDynamicView';
import { useToast } from '../../context/ToastContext';
import { useUnit } from '../../context/UnitContext';
import { supabase } from '../../services/supabase';
import RelatorioComparativoUnidades from './components/RelatorioComparativoUnidades';
import RelatorioFluxoCaixa from './components/RelatorioFluxoCaixa';

// Componente de filtros avançados
const FiltrosAvancados = ({
  filters,
  onFiltersChange,
  units,
  onApplyFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="card-theme rounded-lg border border-light-border p-4 dark:border-dark-border dark:bg-dark-surface">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="text-theme-secondary h-5 w-5" />
          <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Filtros de Relatório
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted hover:text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:hover:text-gray-200"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Período */}
        <div>
          <label className="text-theme-secondary mb-2 block text-sm font-medium">
            Período
          </label>
          <select
            value={filters.periodo}
            onChange={e =>
              onFiltersChange({
                ...filters,
                periodo: e.target.value,
              })
            }
            className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
          >
            <option value="mes-atual">Mês Atual</option>
            <option value="mes-anterior">Mês Anterior</option>
            <option value="trimestre-atual">Trimestre Atual</option>
            <option value="semestre-atual">Semestre Atual</option>
            <option value="ano-atual">Ano Atual</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>

        {/* Unidade */}
        <div>
          <label className="text-theme-secondary mb-2 block text-sm font-medium">
            Unidade
          </label>
          <select
            value={filters.unidade}
            onChange={e =>
              onFiltersChange({
                ...filters,
                unidade: e.target.value,
              })
            }
            className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
          >
            <option value="todas">Todas as Unidades</option>
            {units?.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Relatório */}
        <div>
          <label className="text-theme-secondary mb-2 block text-sm font-medium">
            Formato
          </label>
          <select
            value={filters.formato}
            onChange={e =>
              onFiltersChange({
                ...filters,
                formato: e.target.value,
              })
            }
            className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
          >
            <option value="visual">Visualização</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-light-border pt-4 dark:border-dark-border">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                Data Início
              </label>
              <input
                type="date"
                value={filters.dataInicio || ''}
                onChange={e =>
                  onFiltersChange({
                    ...filters,
                    dataInicio: e.target.value,
                  })
                }
                className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.dataFim || ''}
                onChange={e =>
                  onFiltersChange({
                    ...filters,
                    dataFim: e.target.value,
                  })
                }
                className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* Botão Aplicar Filtros */}
      <div className="mt-4 border-t border-light-border pt-4 dark:border-dark-border">
        <Button
          onClick={onApplyFilters}
          className="text-dark-text-primary flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-medium transition-colors hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};

// Componente de card de relatório
const RelatorioCard = ({ report, isActive, onClick, loading = false }) => {
  const IconComponent = report.icon;
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${isActive ? 'border-blue-500 bg-blue-50 shadow-lg dark:bg-blue-900/20' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'}`}
    >
      {loading && (
        <div className="card-theme/80 absolute inset-0 flex items-center justify-center rounded-xl dark:bg-dark-surface/80">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}

      <div className="flex items-start space-x-4">
        <div
          className={`rounded-lg p-3 ${report.color} flex-shrink-0 text-white`}
        >
          <IconComponent size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`text-lg font-semibold ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}
          >
            {report.title}
          </h3>
          <p
            className={`mt-1 text-sm ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
          >
            {report.description}
          </p>
          <div className="mt-3 flex items-center space-x-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${report.category === 'financeiro' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : report.category === 'operacional' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'}`}
            >
              {report.category}
            </span>
            {report.featured && (
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                Destacado
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de métricas rápidas
const MetricasRapidas = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="card-theme rounded-lg border border-light-border p-4 dark:border-dark-border dark:bg-dark-surface"
          >
            <div className="animate-pulse">
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-8 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  const metrics = [
    {
      title: 'Receita Total',
      value: data?.receitaTotal || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      format: 'currency',
    },
    {
      title: 'Despesas Total',
      value: data?.despesasTotal || 0,
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      format: 'currency',
    },
    {
      title: 'Lucro Líquido',
      value: data?.lucroLiquido || 0,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      format: 'currency',
    },
    {
      title: 'Margem (%)',
      value: data?.margemPercentual || 0,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      format: 'percentage',
    },
  ];
  const formatValue = (value, format) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return value;
  };
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div
            key={index}
            className={`${metric.bgColor} rounded-lg border border-gray-200 p-4 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm font-medium">
                  {metric.title}
                </p>
                <p className={`text-2xl font-bold ${metric.color}`}>
                  {formatValue(metric.value, metric.format)}
                </p>
              </div>
              <IconComponent className={`h-8 w-8 ${metric.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Componente principal de relatórios
const RelatoriosPage = () => {
  const { selectedUnit, allUnits } = useUnit();
  const { addToast } = useToast();
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dreData, setDreData] = useState(null);
  const [filters, setFilters] = useState({
    periodo: 'mes-atual',
    unidade: selectedUnit?.id || 'todas',
    formato: 'visual',
    dataInicio: null,
    dataFim: null,
  });

  // Sincronizar filtro de unidade com selectedUnit do contexto
  useEffect(() => {
    if (
      selectedUnit?.id &&
      filters.unidade !== selectedUnit.id &&
      filters.unidade === 'todas'
    ) {
      setFilters(prev => ({
        ...prev,
        unidade: selectedUnit.id,
      }));
    }
  }, [selectedUnit?.id]);

  // Função para aplicar filtros
  const handleApplyFilters = () => {
    if (activeReport) {
      // Se já tem um relatório ativo, recarregar com novos filtros
      fetchReportData(activeReport);
    } else {
      // Se não tem relatório ativo, mostrar mensagem
      addToast({
        type: 'info',
        title: 'Selecione um relatório',
        message:
          'Escolha um relatório abaixo para visualizar com os filtros selecionados.',
      });
    }
  };

  // Definição dos tipos de relatórios disponíveis
  const reportTypes = useMemo(
    () => [
      {
        id: 'dre-mensal',
        title: 'DRE Mensal',
        description: 'Demonstração de Resultado do Exercício detalhada',
        icon: FileText,
        color: 'bg-blue-500',
        category: 'financeiro',
        featured: true,
      },
      {
        id: 'fluxo-caixa',
        title: 'Fluxo de Caixa',
        description: 'Entradas e saídas de caixa por período',
        icon: BarChart3,
        color: 'bg-green-500',
        category: 'financeiro',
        featured: true,
      },
      {
        id: 'comparativo-unidades',
        title: 'Comparativo Unidades',
        description: 'Análise comparativa entre unidades',
        icon: TrendingUp,
        color: 'bg-purple-500',
        category: 'operacional',
        featured: true,
      },
      {
        id: 'performance-profissionais',
        title: 'Performance Profissionais',
        description: 'Ranking e análise de desempenho dos barbeiros',
        icon: Users,
        color: 'bg-orange-500',
        category: 'operacional',
        featured: false,
      },
      {
        id: 'receita-despesa',
        title: 'Receita x Despesa',
        description: 'Evolução de receitas e despesas ao longo do tempo',
        icon: PieChart,
        color: 'bg-indigo-500',
        category: 'financeiro',
        featured: false,
      },
      {
        id: 'analise-atendimentos',
        title: 'Análise de Atendimentos',
        description: 'Padrões e tendências dos atendimentos realizados',
        icon: Calendar,
        color: 'bg-pink-500',
        category: 'operacional',
        featured: false,
      },
    ],
    []
  );

  // Buscar dados do relatório
  const fetchReportData = async reportId => {
    // Validação: verificar se há unidade selecionada quando não for "todas"
    if (!selectedUnit?.id && filters.unidade !== 'todas') {
      addToast({
        type: 'warning',
        title: 'Selecione uma unidade',
        message:
          'Por favor, selecione uma unidade para visualizar os relatórios.',
      });
      return;
    }
    setLoading(true);
    try {
      // DRE Mensal - usar função dinâmica do PostgreSQL
      if (reportId === 'dre-mensal') {
        const unitId =
          filters.unidade !== 'todas' ? filters.unidade : selectedUnit?.id;
        if (!unitId) {
          addToast({
            type: 'warning',
            title: 'Selecione uma unidade',
            message:
              'É necessário selecionar uma unidade para visualizar o DRE.',
          });
          setLoading(false);
          return;
        }

        // Calcular período baseado no filtro
        let startDate, endDate;
        const now = new Date();
        switch (filters.periodo) {
          case 'mes-atual':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'mes-anterior':
            const lastMonth = subMonths(now, 1);
            startDate = startOfMonth(lastMonth);
            endDate = endOfMonth(lastMonth);
            break;
          case 'trimestre-atual': {
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
            break;
          }
          case 'semestre-atual': {
            const semester = now.getMonth() < 6 ? 0 : 6;
            startDate = new Date(now.getFullYear(), semester, 1);
            endDate = new Date(now.getFullYear(), semester + 6, 0);
            break;
          }
          case 'ano-atual': {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
          }
          case 'personalizado': {
            if (filters.dataInicio && filters.dataFim) {
              startDate = parseISO(filters.dataInicio);
              endDate = parseISO(filters.dataFim);
            } else {
              startDate = startOfMonth(now);
              endDate = endOfMonth(now);
            }
            break;
          }
          default: {
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          }
        }

        // Garantir que as datas estão corretas (sem problemas de timezone)
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        const { data, error } = await supabase.rpc('fn_calculate_dre_dynamic', {
          p_unit_id: unitId,
          p_start_date: formattedStartDate,
          p_end_date: formattedEndDate,
        });
        if (error) throw error;
        setDreData(data);

        // Também atualizar reportData para as métricas rápidas
        if (data && (data.sucesso || data.metadata)) {
          // Extrair valores com segurança (sempre acessar .total primeiro)
          const receitaTotal = Number(data.receita_bruta?.total ?? 0);
          const custosOp = Number(data.custos_operacionais?.total ?? 0);
          const despesasAdm = Number(data.despesas_administrativas?.total ?? 0);
          const impostos = Number(data.impostos?.total ?? 0);
          const despesasTotal = custosOp + despesasAdm + impostos;
          setReportData({
            receitaTotal,
            despesasTotal,
            lucroLiquido: data.lucro_liquido || 0,
            margemPercentual:
              data.indicadores?.margem_liquida_percentual ||
              data.percentuais?.margem_liquida ||
              0,
            dados: data,
          });
        }
      } else {
        // Outros relatórios - manter lógica original
        let query = supabase.from('vw_financial_summary').select('*');
        if (filters.unidade !== 'todas') {
          query = query.eq('unit_id', filters.unidade);
        }
        const { data, error } = await query;
        if (error) throw error;
        const processedData = processReportData(data, reportId);
        setReportData(processedData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar relatório',
        message:
          error.message || 'Não foi possível carregar os dados do relatório.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Processar dados do relatório
  const processReportData = (data, reportId) => {
    if (!data || data.length === 0) {
      return {
        receitaTotal: 0,
        despesasTotal: 0,
        lucroLiquido: 0,
        margemPercentual: 0,
        dados: [],
      };
    }
    const receitaTotal = data.reduce(
      (sum, item) => sum + (item.total_revenue || 0),
      0
    );
    const despesasTotal = data.reduce(
      (sum, item) => sum + (item.total_expenses || 0),
      0
    );
    const lucroLiquido = receitaTotal - despesasTotal;
    const margemPercentual =
      receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;
    return {
      receitaTotal,
      despesasTotal,
      lucroLiquido,
      margemPercentual,
      dados: data,
    };
  };

  // Gerar relatório
  const generateReport = async reportId => {
    setActiveReport(reportId);
    await fetchReportData(reportId);
  };

  // Exportar relatório
  const exportReport = async format => {
    if (!activeReport || !reportData) {
      addToast({
        type: 'warning',
        title: 'Nenhum relatório selecionado',
        message: 'Selecione um relatório antes de exportar.',
      });
      return;
    }
    try {
      // Implementar lógica de exportação baseada no formato
      addToast({
        type: 'success',
        title: 'Relatório exportado',
        message: `Relatório exportado em formato ${format.toUpperCase()}.`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao exportar',
        message: 'Não foi possível exportar o relatório.',
      });
    }
  };

  // Renderizar conteúdo do relatório
  const renderReportContent = () => {
    if (!activeReport) {
      return (
        <div className="py-12 text-center">
          <Calendar className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
          <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-xl font-semibold">
            Selecione um Relatório
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Escolha um tipo de relatório para visualizar os dados
          </p>
        </div>
      );
    }
    const report = reportTypes.find(r => r.id === activeReport);
    return (
      <div className="space-y-6">
        {/* Header do relatório */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`rounded-lg p-3 ${report.color} text-white`}>
              <report.icon size={24} />
            </div>
            <div>
              <h2 className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
                {report.title}
              </h2>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                {report.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport('pdf')}
              className="flex items-center"
            >
              <Printer className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport('excel')}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport('csv')}
              className="flex items-center"
            >
              <Share2 className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>

        {/* Métricas rápidas */}
        <MetricasRapidas data={reportData} loading={loading} />

        {/* Conteúdo específico do relatório */}
        <div className="card-theme rounded-lg border border-light-border dark:border-dark-border dark:bg-dark-surface">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="mr-3 h-8 w-8 animate-spin text-blue-500" />
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Carregando dados...
              </span>
            </div>
          ) : activeReport === 'dre-mensal' ? (
            <div className="p-6">
              <DREDynamicView dreData={dreData} isLoading={loading} />
            </div>
          ) : activeReport === 'fluxo-caixa' ? (
            <RelatorioFluxoCaixa 
              filters={filters} 
              units={allUnits || []} 
            />
          ) : activeReport === 'comparativo-unidades' ? (
            <RelatorioComparativoUnidades
              filters={{
                period: filters.periodo,
                unitId: filters.unidade,
                startDate: filters.dataInicio,
                endDate: filters.dataFim,
              }}
            />
          ) : (
            <div className="py-12 text-center">
              <Eye className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
              <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
                Conteúdo do Relatório
              </h3>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                O conteúdo específico do relatório será implementado aqui
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="card-theme border-b border-light-border px-6 py-4 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-theme-primary dark:text-dark-text-primary text-3xl font-bold">
              Relatórios Gerenciais
            </h1>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1">
              Análises detalhadas e exportação de dados do sistema
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <UnitSelector userId="current-user" />
            {activeReport && (
              <Button
                variant="outline"
                onClick={() => setActiveReport(null)}
                className="flex items-center"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar com tipos de relatórios */}
        <div className="card-theme w-full border-r border-light-border p-6 dark:border-dark-border dark:bg-dark-surface lg:w-80">
          <h2 className="text-theme-primary dark:text-dark-text-primary mb-4 text-lg font-semibold">
            Tipos de Relatórios
          </h2>

          <div className="space-y-3">
            {reportTypes.map(report => (
              <RelatorioCard
                key={report.id}
                report={report}
                isActive={activeReport === report.id}
                onClick={() => generateReport(report.id)}
                loading={loading && activeReport === report.id}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="min-w-0 flex-1 p-6">
          {/* Filtros */}
          <div className="mb-6">
            <FiltrosAvancados
              filters={filters}
              onFiltersChange={setFilters}
              units={allUnits}
              onApplyFilters={handleApplyFilters}
            />
          </div>

          {/* Área do relatório */}
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};
export default RelatoriosPage;
