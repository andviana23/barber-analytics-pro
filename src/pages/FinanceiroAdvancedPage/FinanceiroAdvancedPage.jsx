import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  GitMerge, 
  DollarSign, 
  CreditCard, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';

// Components
import CalendarioTab from './CalendarioTab';
import FluxoTab from './FluxoTab';
import ConciliacaoTab from './ConciliacaoTab';
import ReceitasAccrualTab from './ReceitasAccrualTab';
import DespesasAccrualTab from './DespesasAccrualTab';

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
 * - 5 módulos especializados em tabs
 * - KPIs visuais em tempo real
 * - Filtros globais inteligentes
 * - Design responsivo e acessível
 */
const FinanceiroAdvancedPage = () => {
  const { user } = useAuth();
  const { currentUnit, units } = useUnit();
  
  const [activeTab, setActiveTab] = useState('calendario');
  const [globalFilters, setGlobalFilters] = useState({
    unitId: currentUnit?.id || null,
    startDate: null,
    endDate: null,
    accountId: null
  });

  // Verificar permissões - apenas admin e gerente podem acessar
  const canAccess = useMemo(() => {
    const role = user?.user_metadata?.role;
    return ['admin', 'gerente'].includes(role);
  }, [user]);

  // Configuração das tabs
  const tabs = [
    {
      id: 'calendario',
      label: 'Calendário',
      icon: Calendar,
      description: 'Visualização temporal dos eventos financeiros'
    },
    {
      id: 'fluxo',
      label: 'Fluxo de Caixa',
      icon: TrendingUp,
      description: 'Análise de fluxo de caixa acumulado'
    },
    {
      id: 'conciliacao',
      label: 'Conciliação',
      icon: GitMerge,
      description: 'Conciliação bancária e matching automático'
    },
    {
      id: 'receitas-accrual',
      label: 'Receitas (Competência)',
      icon: DollarSign,
      description: 'Gestão de receitas por competência'
    },
    {
      id: 'despesas-accrual',
      label: 'Despesas (Competência)',
      icon: CreditCard,
      description: 'Gestão de despesas por competência'
    }
  ];

  // Handler para mudança de filtros globais
  const handleGlobalFiltersChange = (newFilters) => {
    setGlobalFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Renderizar conteúdo da tab ativa
  const renderActiveTab = () => {
    const tabProps = {
      globalFilters,
      onFiltersChange: handleGlobalFiltersChange,
      units
    };

    switch (activeTab) {
      case 'calendario':
        return <CalendarioTab {...tabProps} />;
      case 'fluxo':
        return <FluxoTab {...tabProps} />;
      case 'conciliacao':
        return <ConciliacaoTab {...tabProps} />;
      case 'receitas-accrual':
        return <ReceitasAccrualTab {...tabProps} />;
      case 'despesas-accrual':
        return <DespesasAccrualTab {...tabProps} />;
      default:
        return <CalendarioTab {...tabProps} />;
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
              Apenas administradores e gerentes podem acessar esta funcionalidade.
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
              Gestão completa com calendário, fluxo de caixa e conciliação bancária
            </p>
          </div>

          {/* Info da unidade atual */}
          {currentUnit && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Unidade</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentUnit.nome}
                </div>
              </div>
            </div>
          )}
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
                  R$ --
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
                  R$ --
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

          {/* Card 3 - Conciliado */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  % Conciliado
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  --
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                  <GitMerge className="w-3 h-3" />
                  Automático
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <GitMerge className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Card 4 - Pendências */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pendências
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  --
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" />
                  A resolver
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Estilo Padrão do Sistema */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      transition-colors duration-200
                      ${isActive
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
          <div className="p-6">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinanceiroAdvancedPage;