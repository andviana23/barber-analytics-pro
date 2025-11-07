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
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="card-theme max-w-md rounded-2xl border-2 border-red-200 p-12 text-center dark:border-red-800">
            {/* Ícone com gradiente vermelho */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-gradient-to-br from-red-500 to-pink-600 p-6 shadow-2xl">
                <Activity className="text-dark-text-primary h-16 w-16" />
              </div>
            </div>

            {/* Título */}
            <h2 className="text-theme-primary mb-3 text-2xl font-bold">
              🚫 Acesso Restrito
            </h2>

            {/* Mensagem */}
            <p className="text-theme-secondary mb-4">
              Você não tem permissão para acessar o módulo financeiro avançado.
            </p>

            {/* Detalhes */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
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
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          {/* Título com ícone gradiente */}
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg">
              <BarChart3 className="text-dark-text-primary h-8 w-8" />
            </div>
            <div>
              <h1 className="text-theme-primary mb-1 text-3xl font-bold">
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
            <label className="text-theme-secondary mb-2 block text-xs font-bold uppercase tracking-wider">
              Unidade
            </label>
            <div className="relative">
              <select
                value={selectedUnit?.id || ''}
                onChange={e => handleUnitChange(e.target.value)}
                disabled={unitsLoading || !units || units.length === 0}
                className="card-theme text-theme-primary w-full cursor-pointer appearance-none rounded-xl border-2 border-light-border py-3 pl-11 pr-10 font-semibold shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:hover:border-blue-500 dark:focus:ring-blue-400"
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
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Building2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>

              {/* Ícone de seta à direita */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary h-5 w-5"
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
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                <span className="font-medium">
                  Dados filtrados para esta unidade
                </span>
              </div>
            )}
            {!selectedUnit && !unitsLoading && units && units.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="font-medium">
                  Selecione uma unidade para visualizar
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 📑 Navigation Tabs Premium - DESIGN SYSTEM */}
        <div className="card-theme overflow-hidden rounded-xl border-2 border-light-border transition-all duration-300 dark:border-dark-border">
          {/* Tab Headers com Design System */}
          <div className="border-b-2 border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-surface">
            <nav
              className="scrollbar-thin scrollbar-thumb-light-border dark:scrollbar-thumb-dark-border flex overflow-x-auto"
              aria-label="Tabs"
            >
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center gap-3 whitespace-nowrap border-b-4 px-6 py-4 text-sm font-semibold transition-all duration-300 ${isActive ? 'border-primary bg-light-surface text-primary shadow-lg dark:bg-dark-surface' : 'text-theme-secondary hover:text-theme-primary border-transparent hover:border-light-border hover:bg-light-surface/50 dark:hover:border-dark-border dark:hover:bg-dark-hover'} `}
                    title={tab.description}
                  >
                    {/* Ícone com animação */}
                    <div
                      className={`rounded-lg p-2 transition-all duration-300 ${isActive ? 'scale-110 bg-gradient-to-br from-primary to-primary-hover shadow-lg' : 'bg-light-bg group-hover:scale-105 group-hover:bg-primary/10 dark:bg-dark-hover dark:group-hover:bg-primary/20'}`}
                    >
                      <Icon
                        className={`h-4 w-4 transition-colors ${isActive ? 'text-white' : 'text-theme-secondary group-hover:text-primary'}`}
                      />
                    </div>

                    {/* Label */}
                    <span>{tab.label}</span>

                    {/* Indicador ativo (barra superior) */}
                    {isActive && (
                      <div className="absolute left-0 right-0 top-0 h-1 rounded-b-full bg-gradient-to-r from-primary to-primary-hover" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content com padding premium */}
          <div className="bg-light-bg/30 p-6 dark:bg-dark-bg/30">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default FinanceiroAdvancedPage;
