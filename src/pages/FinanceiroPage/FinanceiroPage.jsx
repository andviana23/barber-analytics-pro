import React, { useState } from 'react';
import { useAuth } from '../../context';
import {
  DollarSign,
  TrendingDown,
  FileText,
  BarChart3,
  Download,
  Filter,
  Calendar,
  CreditCard
} from 'lucide-react';

// Componentes das abas
import ReceitasTab from './components/ReceitasTab';
import DespesasTab from './components/DespesasTab';
import DRETab from './components/DRETab';
import ComparativosTab from './components/ComparativosTab';
import { BankAccountsPage } from '../BankAccountsPage';

const TABS = [
  {
    id: 'receitas',
    label: 'Receitas',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  {
    id: 'despesas',
    label: 'Despesas',
    icon: TrendingDown,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  {
    id: 'dre',
    label: 'DRE',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    id: 'comparativos',
    label: 'Comparativos',
    icon: BarChart3,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  {
    id: 'contas-bancarias',
    label: 'Contas Bancárias',
    icon: CreditCard,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    adminOnly: true
  }
];

export function FinanceiroPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('receitas');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    unidade: null
  });

  const isAdmin = user?.user_metadata?.role === 'admin';

  // Filtrar abas baseado em permissões
  const availableTabs = TABS.filter(tab => !tab.adminOnly || isAdmin);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'receitas':
        return <ReceitasTab filters={filters} />;
      case 'despesas':
        return <DespesasTab filters={filters} />;
      case 'dre':
        return <DRETab filters={filters} />;
      case 'comparativos':
        return <ComparativosTab filters={filters} />;
      case 'contas-bancarias':
        return <BankAccountsPage />;
      default:
        return <ReceitasTab filters={filters} />;
    }
  };

  const activeTabConfig = availableTabs.find(tab => tab.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Módulo Financeiro
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestão completa de receitas, despesas e demonstrativo de resultados
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de período */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={filters.startDate.toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange({ 
                startDate: new Date(e.target.value) 
              })}
              className="text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={filters.endDate.toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange({ 
                endDate: new Date(e.target.value) 
              })}
              className="text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Botão de filtros */}
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          {/* Botão de exportação */}
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                ${isActive 
                  ? `bg-white dark:bg-gray-800 shadow-sm border ${tab.borderColor} ${tab.color}`
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }
              `}
            >
              <Icon className={`h-5 w-5 ${isActive ? tab.color : ''}`} />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da aba ativa */}
      <div className={`${activeTabConfig?.bgColor} rounded-xl border ${activeTabConfig?.borderColor} min-h-[600px]`}>
        {renderTabContent()}
      </div>
    </div>
  );
}

export default FinanceiroPage;