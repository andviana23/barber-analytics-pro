import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  GitMerge,
  DollarSign,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Building2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import financeiroService from '../../services/financeiroService';
import { supabase } from '../../services/supabase';

// Components
import FluxoTabRefactored from './FluxoTabRefactored';
import ConciliacaoTab from './ConciliacaoTab';
import ReceitasAccrualTab from './ReceitasAccrualTab';
import DespesasAccrualTab from './DespesasAccrualTab';
import ContasBancariasTab from './ContasBancariasTab';

// Layout
import { Layout } from '../../components/Layout/Layout';

/**
 * Módulo Financeiro Avançado
 *
 * Refatorado seguindo princípios de UX/UI:
 * - "Don't Make Me Think" (Steve Krug)
 * - Atomic Design (Brad Frost)
 * - Feedback imediato e hierarquia visual clara
 * - Interface intuitiva com modo escuro/claro
 *
 * Features:
 * - 5 módulos especializados em tabs (Fluxo, Conciliação, Receitas, Despesas, Contas)
 * - KPIs visuais em tempo real
 * - Filtros globais inteligentes
 * - Design responsivo e acessível
 */
const FinanceiroAdvancedPage = () => {
  const { user } = useAuth();
  const { selectedUnit: currentUnit, allUnits: units, selectUnit } = useUnit();

  // eslint-disable-next-line no-console
  console.log('🏢 FinanceiroAdvancedPage - Units carregadas:', units);
  // eslint-disable-next-line no-console
  console.log('🏢 FinanceiroAdvancedPage - Current Unit:', currentUnit);

  const [activeTab, setActiveTab] = useState('fluxo');

  // Estado local para unidade selecionada (independente do UnitContext)
  const [selectedUnitId, setSelectedUnitId] = useState(() => {
    // Tentar recuperar do localStorage ou usar currentUnit
    const saved = localStorage.getItem('financeiro_selected_unit');
    return saved || currentUnit?.id || null;
  });

  // Salvar seleção no localStorage e atualizar UnitContext
  const handleUnitChange = useCallback(
    unitId => {
      setSelectedUnitId(unitId);
      localStorage.setItem('financeiro_selected_unit', unitId);

      // Atualizar o UnitContext também
      const unit = Array.isArray(units)
        ? units.find(u => u.id === unitId)
        : null;
      if (unit && selectUnit) {
        selectUnit(unit);
      }

      // eslint-disable-next-line no-console
      console.log('🏢 Unidade selecionada:', unitId, unit);
    },
    [units, selectUnit]
  );

  // Unidade efetivamente selecionada
  const selectedUnit = useMemo(() => {
    // Garantir que units é um array
    const unitsArray = Array.isArray(units) ? units : [];

    if (selectedUnitId && unitsArray.length > 0) {
      return (
        unitsArray.find(u => u.id === selectedUnitId) ||
        currentUnit ||
        unitsArray[0] ||
        null
      );
    }

    return currentUnit || unitsArray[0] || null;
  }, [selectedUnitId, units, currentUnit]);

  // Auto-selecionar primeira unidade se nenhuma estiver selecionada
  useEffect(() => {
    if (!selectedUnitId && units && units.length > 0) {
      const firstUnit = units[0];
      // eslint-disable-next-line no-console
      console.log('🏢 Auto-selecionando primeira unidade:', firstUnit.name);
      handleUnitChange(firstUnit.id);
    }
  }, [units, selectedUnitId, handleUnitChange]);

  const [globalFilters, setGlobalFilters] = useState({
    unitId: selectedUnit?.id || null,
    startDate: null,
    endDate: null,
    accountId: null,
  });

  // Atualizar globalFilters quando unidade mudar
  useEffect(() => {
    if (selectedUnit?.id) {
      setGlobalFilters(prev => ({ ...prev, unitId: selectedUnit.id }));
    }
  }, [selectedUnit?.id]);

  // Estado para KPIs
  const [kpis, setKpis] = useState({
    faturamentoMes: 0,
    saldoAtual: 0,
    despesasPagasMes: 0,
    despesasVencendo: 0,
    loading: true,
  });

  // Verificar permissões - apenas admin e gerente podem acessar
  const canAccess = useMemo(() => {
    const role = user?.user_metadata?.role;
    return ['admin', 'gerente'].includes(role);
  }, [user]);

  // Buscar KPIs
  const fetchKPIs = useCallback(async () => {
    if (!selectedUnit?.id) {
      // eslint-disable-next-line no-console
      console.log('⚠️ KPIs: Sem unidade selecionada');
      return;
    }

    try {
      // eslint-disable-next-line no-console
      console.log(
        '🔄 KPIs: Buscando dados para unidade:',
        selectedUnit.name,
        selectedUnit.id
      );

      setKpis(prev => ({ ...prev, loading: true }));

      // Data atual para filtros
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      // eslint-disable-next-line no-console
      console.log(
        '📅 KPIs: Período:',
        primeiroDiaMes.toISOString().split('T')[0],
        'até',
        ultimoDiaMes.toISOString().split('T')[0]
      );

      // 1. Faturamento do mês (receitas do mês atual)
      const { data: receitasMes } = await financeiroService.getReceitas({
        unit_id: selectedUnit.id,
        start_date: primeiroDiaMes.toISOString().split('T')[0],
        end_date: ultimoDiaMes.toISOString().split('T')[0],
      });

      // eslint-disable-next-line no-console
      console.log('💰 KPIs: Receitas encontradas:', receitasMes);

      const faturamentoMes = (receitasMes || []).reduce(
        (sum, r) => sum + (r.value || 0),
        0
      );

      // 2. Despesas pagas do mês atual
      const { data: despesasMes } = await supabase
        .from('expenses')
        .select('*')
        .eq('unit_id', selectedUnit.id)
        .eq('status', 'Paid')
        .gte('data_competencia', primeiroDiaMes.toISOString().split('T')[0])
        .lte('data_competencia', ultimoDiaMes.toISOString().split('T')[0]);

      const despesasPagasMes = (despesasMes || []).reduce(
        (sum, d) => sum + (d.value || 0),
        0
      );

      // 3. Despesas a vencer no mês atual (pendentes)
      const { data: despesasVencendo } = await supabase
        .from('expenses')
        .select('*')
        .eq('unit_id', selectedUnit.id)
        .eq('status', 'Pending')
        .gte('data_competencia', primeiroDiaMes.toISOString().split('T')[0])
        .lte('data_competencia', ultimoDiaMes.toISOString().split('T')[0]);

      const despesasVencendoCount = despesasVencendo?.length || 0;

      // 4. Saldo Atual (placeholder - requer lógica de saldo bancário)
      const saldoAtual = 0;

      // eslint-disable-next-line no-console
      console.log('📊 KPIs Calculados:', {
        faturamentoMes,
        despesasPagasMes,
        despesasVencendoCount,
        totalReceitas: receitasMes?.length || 0,
        totalDespesasPagas: despesasMes?.length || 0,
      });

      setKpis({
        faturamentoMes,
        saldoAtual,
        despesasPagasMes,
        despesasVencendo: despesasVencendoCount,
        loading: false,
      });

      // eslint-disable-next-line no-console
      console.log('✅ KPIs: Estado atualizado');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ KPIs: Erro ao buscar:', error);
      setKpis(prev => ({ ...prev, loading: false }));
    }
  }, [selectedUnit]);

  // Buscar KPIs quando a unidade mudar
  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  // Configuração das tabs
  const tabs = [
    {
      id: 'fluxo',
      label: 'Fluxo de Caixa',
      icon: TrendingUp,
      description: 'Análise de fluxo de caixa acumulado',
    },
    {
      id: 'conciliacao',
      label: 'Conciliação',
      icon: GitMerge,
      description: 'Conciliação bancária e matching automático',
    },
    {
      id: 'contas-bancarias',
      label: 'Contas Bancárias',
      icon: Building2,
      description: 'Gestão de contas bancárias',
    },
    {
      id: 'receitas-accrual',
      label: 'Receitas (Competência)',
      icon: DollarSign,
      description: 'Gestão de receitas por competência',
    },
    {
      id: 'despesas-accrual',
      label: 'Despesas (Competência)',
      icon: CreditCard,
      description: 'Gestão de despesas por competência',
    },
  ];

  // Handler para mudança de filtros globais
  const handleGlobalFiltersChange = newFilters => {
    setGlobalFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Renderizar conteúdo da tab ativa
  const renderActiveTab = () => {
    const tabProps = {
      globalFilters,
      onFiltersChange: handleGlobalFiltersChange,
      units,
    };

    switch (activeTab) {
      case 'fluxo':
        return <FluxoTabRefactored {...tabProps} />;
      case 'conciliacao':
        return <ConciliacaoTab {...tabProps} />;
      case 'contas-bancarias':
        return <ContasBancariasTab {...tabProps} />;
      case 'receitas-accrual':
        return <ReceitasAccrualTab {...tabProps} />;
      case 'despesas-accrual':
        return <DespesasAccrualTab {...tabProps} />;
      default:
        return <FluxoTabRefactored {...tabProps} />;
    }
  };

  // Verificar acesso
  if (!canAccess) {
    return (
      <Layout activeMenuItem="financial">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar o módulo financeiro avançado.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Apenas administradores e gerentes podem acessar esta
              funcionalidade.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeMenuItem="financial">
      <div className="space-y-6">
        {/* Header com título e descrição - Padrão do Sistema */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Módulo Financeiro Avançado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestão completa com fluxo de caixa, conciliação bancária e contas
            </p>
          </div>

          {/* Seletor Universal de Unidade */}
          <div className="w-full lg:w-auto">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Unidade
            </label>
            <div className="relative">
              <select
                value={selectedUnit?.id || ''}
                onChange={e => handleUnitChange(e.target.value)}
                className="w-full lg:w-64 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 appearance-none cursor-pointer transition-colors"
              >
                <option value="">Selecione uma unidade</option>
                {Array.isArray(units) &&
                  units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
              </select>
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {selectedUnit && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Dados filtrados para esta unidade
              </p>
            )}
          </div>
        </div>

        {/* KPIs Grid - Estilo Padrão das Outras Páginas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 - Faturamento */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Faturamento
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {kpis.loading ? (
                    <span className="animate-pulse">--</span>
                  ) : (
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(kpis.faturamentoMes)
                  )}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  Mês atual
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Card 2 - Saldo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Saldo Atual
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {kpis.loading ? (
                    <span className="animate-pulse">--</span>
                  ) : (
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(kpis.saldoAtual)
                  )}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Em tempo real
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Card 3 - Despesas Pagas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Despesas Pagas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {kpis.loading ? (
                    <span className="animate-pulse">--</span>
                  ) : (
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(kpis.despesasPagasMes)
                  )}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" />
                  Mês atual
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* Card 4 - Despesas a Vencer */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Despesas a Vencer
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {kpis.loading ? (
                    <span className="animate-pulse">--</span>
                  ) : (
                    kpis.despesasVencendo
                  )}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Este mês
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Estilo Padrão do Sistema */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      transition-colors duration-200
                      ${
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                    title={tab.description}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">{renderActiveTab()}</div>
        </div>
      </div>
    </Layout>
  );
};

export default FinanceiroAdvancedPage;
