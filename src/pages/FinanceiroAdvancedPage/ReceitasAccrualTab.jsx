import React, { useState } from 'react';
import { DollarSign, Plus } from 'lucide-react';

// Components
import { NovaReceitaAccrualModal } from '../../templates/NovaReceitaAccrualModal';

/**
 * Tab de Receitas por Competência
 * 
 * Features:
 * - Toggle entre modo Caixa e Competência
 * - NovaReceitaAccrualModal para criar receitas com competência
 * - Lista e filtros de receitas por competência
 */
const ReceitasAccrualTab = ({ globalFilters }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accrualMode, setAccrualMode] = useState(true); // true = Competência, false = Caixa

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    // TODO: Refresh da lista de receitas
  };

  return (
    <div className="space-y-6">
      {/* Header com toggle - Dark Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Receitas
              </h3>
            </div>

            {/* Toggle Caixa/Competência - Dark Mode */}
            <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setAccrualMode(false)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  !accrualMode
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Caixa
              </button>
              <button
                onClick={() => setAccrualMode(true)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  accrualMode
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Competência
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </button>
          </div>
        </div>

        {/* Descrição do modo - Dark Mode */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {accrualMode ? (
              <>
                <strong>Modo Competência:</strong> As receitas são registradas no período em que foram 
                geradas (competência), independentemente da data de recebimento.
              </>
            ) : (
              <>
                <strong>Modo Caixa:</strong> As receitas são registradas apenas quando efetivamente 
                recebidas no caixa da empresa.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Conteúdo principal - Dark Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {accrualMode ? (
          // Modo Competência - Lista com campos de competência
          <div className="space-y-4">
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Receitas por Competência
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Gerencie suas receitas considerando o período de competência.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira receita
              </button>
            </div>
          </div>
        ) : (
          // Modo Caixa - Redirecionar para aba original
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Modo Caixa
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Para visualizar receitas em modo caixa, utilize a aba de receitas tradicional 
              no módulo financeiro principal.
            </p>
            <button
              onClick={() => setAccrualMode(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Voltar para Competência
            </button>
          </div>
        )}
      </div>

      {/* Modal de nova receita */}
      <NovaReceitaAccrualModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
        unitId={globalFilters.unitId}
      />
    </div>
  );
};

export default ReceitasAccrualTab;