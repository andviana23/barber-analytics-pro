/**
 * UNITS PAGE
 * 
 * Página de gerenciamento de unidades do sistema
 * Permite visualizar, criar, editar e gerenciar unidades
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../atoms';
import { KPICard } from '../../molecules';
import { MainContainer } from '../../organisms';
import { useUnits } from '../../hooks';
import { useAuth } from '../../context';

// Components
import UnitCard from './UnitCard';
import CreateUnitModal from './CreateUnitModal';
import EditUnitModal from './EditUnitModal';
import DeleteUnitModal from './DeleteUnitModal';
import UnitsComparison from './UnitsComparison';
import UnitsStats from './UnitsStats';

// Icons
import { 
  Plus, 
  Building2, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Settings,
  Filter
} from 'lucide-react';

const UnitsPage = () => {
  // Hooks
  const { user, hasPermission } = useAuth();
  const {
    units,
    activeUnits, 
    inactiveUnits,
    stats,
    loading,
    error,
    refresh,
    getUnitsComparison
  } = useUnits();

  // Estado local
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [view, setView] = useState('cards'); // cards, stats, comparison
  const [comparison, setComparison] = useState([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Permissões
  const canCreate = hasPermission('admin');
  const canEdit = hasPermission('admin');
  const canDelete = hasPermission('admin');
  const canViewStats = hasPermission(['admin', 'gerente']);

  /**
   * Carregar comparativo entre unidades
   */
  const loadComparison = async () => {
    if (!canViewStats) return;

    try {
      setLoadingComparison(true);
      const comparisonData = await getUnitsComparison();
      setComparison(comparisonData);
    } catch (error) {
      // Error já tratado no hook
    } finally {
      setLoadingComparison(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    if (view === 'comparison') {
      loadComparison();
    }
  }, [view]);

  /**
   * Handlers para modais
   */
  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setShowEditModal(true);
  };

  const handleDelete = (unit) => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUnit(null);
  };

  const handleModalSuccess = () => {
    closeModals();
    refresh();
  };

  /**
   * Filtrar unidades baseado na visualização
   */
  const getDisplayUnits = () => {
    if (showInactive) {
      return units;
    }
    return activeUnits;
  };

  const displayUnits = getDisplayUnits();

  /**
   * Renderizar conteúdo baseado na view selecionada
   */
  const renderContent = () => {
    if (view === 'stats') {
      return <UnitsStats units={comparison} loading={loadingComparison} />;
    }

    if (view === 'comparison') {
      return <UnitsComparison units={comparison} loading={loadingComparison} />;
    }

    // View padrão: cards
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayUnits.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            onEdit={canEdit ? () => handleEdit(unit) : null}
            onDelete={canDelete ? () => handleDelete(unit) : null}
            canViewStats={canViewStats}
          />
        ))}

        {displayUnits.length === 0 && !loading && (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {showInactive ? 'Nenhuma unidade encontrada' : 'Nenhuma unidade ativa'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {showInactive 
                  ? 'Não há unidades cadastradas no sistema.' 
                  : 'Não há unidades ativas. Verifique as unidades inativas ou crie uma nova.'
                }
              </p>
              {canCreate && (
                <button
                  onClick={handleCreate}
                  className="btn btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeira Unidade
                </button>
              )}
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <MainContainer>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Unidades
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gerencie as unidades da sua rede de barbearias
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            {/* Filtros */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={showInactive ? 'all' : 'active'}
                onChange={(e) => setShowInactive(e.target.value === 'all')}
                className="input-field text-sm"
              >
                <option value="active">Apenas Ativas</option>
                <option value="all">Todas as Unidades</option>
              </select>
            </div>

            {/* Seletor de Visualização */}
            {canViewStats && (
              <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                <button
                  onClick={() => setView('cards')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    view === 'cards'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Building2 className="h-4 w-4 mr-1 inline" />
                  Cards
                </button>
                <button
                  onClick={() => setView('stats')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    view === 'stats'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-1 inline" />
                  Stats
                </button>
                <button
                  onClick={() => setView('comparison')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    view === 'comparison'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-1 inline" />
                  Comparar
                </button>
              </div>
            )}

            {/* Botão Criar */}
            {canCreate && (
              <button
                onClick={handleCreate}
                className="btn btn-primary"
                disabled={loading}
              >
                <Plus className="h-5 w-5 mr-2" />
                Nova Unidade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total de Unidades"
            value={stats.total}
            icon={<Building2 className="h-6 w-6" />}
            trend={{ value: 0, isPositive: true }}
            className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          />

          <KPICard
            title="Unidades Ativas"
            value={stats.active}
            icon={<CheckCircle className="h-6 w-6" />}
            trend={{ 
              value: stats.activePercentage, 
              isPositive: true, 
              isPercentage: true 
            }}
            className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          />

          <KPICard
            title="Unidades Inativas"
            value={stats.inactive}
            icon={<XCircleIcon className="h-6 w-6" />}
            trend={{ 
              value: 100 - stats.activePercentage, 
              isPositive: false, 
              isPercentage: true 
            }}
            className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          />

          <KPICard
            title="Taxa de Ativação"
            value={`${stats.activePercentage.toFixed(1)}%`}
            icon={<ChartBarIcon className="h-6 w-6" />}
            trend={{ value: 0, isPositive: true }}
            className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
          />
        </div>
      )}

      {/* Conteúdo Principal */}
      {loading && view === 'cards' ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Carregando unidades...
          </span>
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Erro ao carregar unidades
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => refresh()}
            className="btn btn-primary"
          >
            Tentar Novamente
          </button>
        </Card>
      ) : (
        renderContent()
      )}

      {/* Modais */}
      {showCreateModal && (
        <CreateUnitModal
          isOpen={showCreateModal}
          onClose={closeModals}
          onSuccess={handleModalSuccess}
        />
      )}

      {showEditModal && selectedUnit && (
        <EditUnitModal
          isOpen={showEditModal}
          onClose={closeModals}
          onSuccess={handleModalSuccess}
          unit={selectedUnit}
        />
      )}

      {showDeleteModal && selectedUnit && (
        <DeleteUnitModal
          isOpen={showDeleteModal}
          onClose={closeModals}
          onSuccess={handleModalSuccess}
          unit={selectedUnit}
        />
      )}
    </MainContainer>
  );
};

export default UnitsPage;
