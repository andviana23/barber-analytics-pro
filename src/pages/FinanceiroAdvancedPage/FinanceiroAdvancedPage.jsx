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
// 🔒 CONCILIAÇÃO DESABILITADA - Manter import comentado para uso futuro
// import ConciliacaoTab from './ConciliacaoTab';
import ReceitasAccrualTab from './ReceitasAccrualTab';
import DespesasAccrualTabRefactored from './DespesasAccrualTabRefactored';
import ContasBancariasTab from './ContasBancariasTab';

// Layout
import { Layout } from '../../components/Layout/Layout';

/**
 * 💰 Módulo Financeiro Avançado - 100% REFATORADO COM DESIGN SYSTEM
 *
 * Refatorado seguindo princípios de UX/UI:
 * - "Don't Make Me Think" (Steve Krug)
 * - Atomic Design (Brad Frost)
 * - Design System completo aplicado
 * - Feedback imediato e hierarquia visual clara
 * - Interface intuitiva com modo escuro/claro
 *
 * Features:
 * - ✅ Design System completo aplicado
 * - ✅ 5 módulos especializados em tabs (Fluxo, Conciliação, Receitas, Despesas, Contas)
 * - ✅ Header ultra moderno com gradientes
 * - ✅ Seletor de unidade estilizado
 * - ✅ Tabs com hover effects e transições
 * - ✅ UI ultra moderna com feedback visual
 * - ✅ Design responsivo e acessível
 * - ✅ Dark mode completo
 */
const FinanceiroAdvancedPage = () => {
  const { user } = useAuth();
  const {
    selectedUnit: currentUnit,
    allUnits: units,
    selectUnit,
    loading: unitsLoading,
  } = useUnit();

  // eslint-disable-next-line no-console
  console.log('🏢 FinanceiroAdvancedPage - Units carregadas:', units);
  // eslint-disable-next-line no-console
  console.log('🏢 FinanceiroAdvancedPage - Current Unit:', currentUnit);
  // eslint-disable-next-line no-console
  console.log('🏢 FinanceiroAdvancedPage - Units Loading:', unitsLoading);
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
      setGlobalFilters(prev => ({
        ...prev,
        unitId: selectedUnit.id,
      }));
    }
  }, [selectedUnit?.id]);

  // Verificar permissões - apenas admin e gerente podem acessar
  const canAccess = useMemo(() => {
    const role = user?.user_metadata?.role;
    return ['admin', 'gerente'].includes(role);
  }, [user]);

  // Configuração das tabs
  const tabs = [
    {
      id: 'fluxo',
      label: 'Fluxo de Caixa',
      icon: TrendingUp,
      description: 'Análise de fluxo de caixa acumulado',
    },
    // 🔒 CONCILIAÇÃO BANCÁRIA DESABILITADA TEMPORARIAMENTE
    // Para reabilitar no futuro, descomente as linhas abaixo:
    // {
    //   id: 'conciliacao',
    //   label: 'Conciliação',
    //   icon: GitMerge,
    //   description: 'Conciliação bancária e matching automático',
    // },
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
    setGlobalFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
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
      // 🔒 CONCILIAÇÃO DESABILITADA - Manter código para uso futuro
      // case 'conciliacao':
      //   return <ConciliacaoTab {...tabProps} />;
      case 'contas-bancarias':
        return <ContasBancariasTab {...tabProps} />;
      case 'receitas-accrual':
        return <ReceitasAccrualTab {...tabProps} />;
      case 'despesas-accrual':
        return <DespesasAccrualTabRefactored {...tabProps} />;
      default:
        return <FluxoTabRefactored {...tabProps} />;
    }
  };

  // Verificar acesso
  if (!canAccess) {
    return (
      <Layout activeMenuItem="financial">
        {/* 🚫 Acesso Negado - DESIGN SYSTEM */}
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="card-theme rounded-2xl p-12 max-w-md text-center border-2 border-red-200 dark:border-red-800">
            {/* Ícone com gradiente vermelho */}
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gradient-danger rounded-full shadow-2xl">
                <Activity className="w-16 h-16 text-dark-text-primary" />
              </div>
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-theme-primary mb-3">
              🚫 Acesso Restrito
            </h2>

            {/* Mensagem */}
            <p className="text-theme-secondary mb-4">
              Você não tem permissão para acessar o módulo financeiro avançado.
            </p>

            {/* Detalhes */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                Apenas administradores e gerentes podem acessar esta
                funcionalidade.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout activeMenuItem="financial">
      <div className="space-y-6">
        {/* 💰 Header Premium - DESIGN SYSTEM */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Título com ícone gradiente */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-lg">
              <BarChart3 className="w-8 h-8 text-dark-text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-theme-primary mb-1">
                Módulo Financeiro Avançado
              </h1>
              <p className="text-theme-secondary">
                Gestão completa com fluxo de caixa, conciliação bancária e
                contas
              </p>
            </div>
          </div>

          {/* Seletor de Unidade Compacto */}
          <div className="w-full lg:w-auto lg:min-w-[280px]">
            <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2">
              Unidade
            </label>
            <div className="relative">
              <select
                value={selectedUnit?.id || ''}
                onChange={e => handleUnitChange(e.target.value)}
                disabled={unitsLoading || !units || units.length === 0}
                className="w-full pl-11 pr-10 py-3 card-theme dark:bg-dark-surface border-2 border-light-border dark:border-dark-border rounded-xl text-theme-primary font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 appearance-none cursor-pointer transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {unitsLoading ? (
                  <option value="">Carregando...</option>
                ) : !units || units.length === 0 ? (
                  <option value="">Sem unidades</option>
                ) : (
                  <>
                    {units.length > 1 && (
                      <option value="">Selecione uma unidade</option>
                    )}
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </>
                )}
              </select>

              {/* Ícone à esquerda */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Building2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>

              {/* Ícone de seta à direita */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Feedback Visual Compacto */}
            {selectedUnit && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600 dark:text-green-400">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">
                  Dados filtrados para esta unidade
                </span>
              </div>
            )}
            {!selectedUnit && !unitsLoading && units && units.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <span className="font-medium">
                  Selecione uma unidade para visualizar
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 📑 Navigation Tabs Premium - DESIGN SYSTEM */}
        <div className="card-theme rounded-xl overflow-hidden border-2 border-transparent hover:border-light-border dark:border-dark-border dark:hover:border-dark-border transition-all duration-300">
          {/* Tab Headers com gradiente */}
          <div className="bg-gradient-light dark:from-gray-800 dark:to-gray-750 border-b-2 border-light-border dark:border-dark-border">
            <nav
              className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
              aria-label="Tabs"
            >
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group flex items-center gap-3 px-6 py-4 border-b-4 font-semibold text-sm whitespace-nowrap
                      transition-all duration-300 relative
                      ${isActive ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 shadow-lg' : 'border-transparent text-theme-secondary hover:text-theme-primary hover:bg-white/50 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500'}
                    `}
                    title={tab.description}
                  >
                    {/* Ícone com animação */}
                    <div
                      className={`p-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-gradient-primary shadow-lg scale-110' : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:scale-105'}`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}
                      />
                    </div>

                    {/* Label */}
                    <span>{tab.label}</span>

                    {/* Indicador ativo (barra superior) */}
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary rounded-b-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content com padding premium */}
          <div className="p-6 bg-light-bg dark:bg-dark-bg">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default FinanceiroAdvancedPage;
