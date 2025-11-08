/**
 * UNITS PAGE - REFATORADA 100%
 *
 * Página moderna de gerenciamento de unidades
 * Features:
 * - Visualização em cards, estatísticas e comparação
 * - CRUD completo de unidades
 * - Filtros por status (ativas/todas)
 * - KPIs em tempo real
 * - Interface responsiva e acessível
 * - Permissões baseadas em roles
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { Plus, Building2, CheckCircle, XCircle, BarChart3, Settings, Filter, RefreshCw, TrendingUp, Search } from 'lucide-react';
const UnitsPage = () => {
  // ==================== HOOKS ====================
  const {
    hasPermission
  } = useAuth();
  const {
    units,
    activeUnits,
    stats,
    loading,
    error,
    refresh,
    getUnitsComparison
  } = useUnits();

  // ==================== STATE ====================
  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Visualização
  const [showInactive, setShowInactive] = useState(false);
  const [view, setView] = useState('cards'); // cards, stats, comparison
  const [searchTerm, setSearchTerm] = useState('');

  // Comparação de unidades
  const [comparison, setComparison] = useState([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // ==================== PERMISSÕES ====================
  const canCreate = hasPermission('admin');
  const canEdit = hasPermission('admin');
  const canDelete = hasPermission('admin');
  const canViewStats = hasPermission(['admin', 'gerente']);

  // Debug de permissões (temporário)
  useEffect(() => {
    if (!loading) {
      // eslint-disable-next-line no-console
      console.log('🔐 Permissões UnitsPage:', {
        canCreate,
        canEdit,
        canDelete,
        canViewStats
      });
    }
  }, [canCreate, canEdit, canDelete, canViewStats, loading]);

  // ==================== EFFECTS ====================
  /**
   * Carregar comparativo entre unidades quando view mudar
   */
  useEffect(() => {
    const loadComparison = async () => {
      if (!canViewStats) return;
      if (view !== 'comparison' && view !== 'stats') return;
      try {
        setLoadingComparison(true);
        const comparisonData = await getUnitsComparison();
        setComparison(comparisonData);
      } catch {
        // Erro já tratado no hook useUnits
        setComparison([]);
      } finally {
        setLoadingComparison(false);
      }
    };
    loadComparison();
  }, [view, canViewStats, getUnitsComparison]);

  // ==================== HANDLERS ====================
  /**
   * Abrir modal de criação
   */
  const handleCreate = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  /**
   * Abrir modal de edição
   */
  const handleEdit = useCallback(unit => {
    setSelectedUnit(unit);
    setShowEditModal(true);
  }, []);

  /**
   * Abrir modal de exclusão
   */
  const handleDelete = useCallback(unit => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
  }, []);

  /**
   * Fechar todos os modais
   */
  const closeModals = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUnit(null);
  }, []);

  /**
   * Sucesso em operação - fechar modal e atualizar lista
   */
  const handleModalSuccess = useCallback(() => {
    closeModals();
    refresh();
  }, [closeModals, refresh]);

  /**
   * Atualizar lista de unidades
   */
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // ==================== COMPUTED VALUES ====================
  /**
   * Filtrar unidades baseado no status e busca
   */
  const displayUnits = useCallback(() => {
    let filtered = showInactive ? units : activeUnits;

    // Aplicar filtro de busca se houver termo
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(unit => unit.name.toLowerCase().includes(term));
    }
    return filtered;
  }, [units, activeUnits, showInactive, searchTerm])();

  // ==================== RENDER FUNCTIONS ====================
  /**
   * Renderizar conteúdo baseado na view selecionada
   */
  const renderContent = () => {
    // View: Estatísticas
    if (view === 'stats') {
      return <UnitsStats units={comparison} loading={loadingComparison} />;
    }

    // View: Comparação
    if (view === 'comparison') {
      return <UnitsComparison units={comparison} loading={loadingComparison} />;
    }

    // View: Cards (padrão)
    // Estado Vazio
    if (displayUnits.length === 0 && !loading) {
      return <Card className="p-16">
          <div className="mx-auto max-w-md text-center">
            <div className="card-theme mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full dark:bg-dark-surface">
              <Building2 className="text-light-text-muted dark:text-dark-text-muted h-10 w-10" />
            </div>

            <h3 className="text-theme-primary dark:text-dark-text-primary mb-3 text-2xl font-bold">
              {searchTerm ? 'Nenhuma unidade encontrada' : showInactive ? 'Nenhuma unidade cadastrada' : 'Nenhuma unidade ativa'}
            </h3>

            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-8">
              {searchTerm ? <>
                  Nenhuma unidade corresponde à busca &ldquo;
                  <strong>{searchTerm}</strong>&rdquo;. Tente outro termo.
                </> : showInactive ? 'Comece criando sua primeira unidade para gerenciar sua rede de barbearias.' : 'Não há unidades ativas no momento. Verifique as unidades inativas ou crie uma nova.'}
            </p>

            {canCreate && !searchTerm && <button onClick={handleCreate} className="text-dark-text-primary inline-flex transform items-center rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold shadow-xl transition-all hover:scale-105 hover:bg-blue-700 hover:shadow-2xl">
                <Plus className="mr-2 h-6 w-6" />
                Criar Primeira Unidade
              </button>}
          </div>
        </Card>;
    }

    // Grid de Unidades
    return <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {displayUnits.map(unit => <UnitCard key={unit.id} unit={unit} onEdit={canEdit ? handleEdit : null} onDelete={canDelete ? handleDelete : null} canViewStats={canViewStats} />)}
      </div>;
  };
  return <MainContainer>
      {/* ==================== HEADER ==================== */}
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          {/* Linha 1: Título + Botão Principal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-theme-primary dark:text-dark-text-primary text-3xl font-bold">
                  Unidades
                </h1>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  {stats.total} {stats.total === 1 ? 'unidade' : 'unidades'}{' '}
                  cadastradas
                </p>
              </div>
            </div>

            {/* BOTÃO PRINCIPAL - SEMPRE VISÍVEL NO TOPO */}
            <div className="flex items-center gap-3">
              <button onClick={handleRefresh} disabled={loading} className="card-theme inline-flex items-center justify-center rounded-xl border-2 border-light-border px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 transition-all hover:bg-light-bg disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface dark:text-gray-200 dark:text-theme-secondary dark:hover:bg-gray-700" title="Atualizar lista">
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* BOTÃO SEMPRE VISÍVEL - SEM VERIFICAÇÃO DE PERMISSÃO */}
              <button onClick={handleCreate} disabled={loading || !canCreate} className="text-dark-text-primary inline-flex transform items-center justify-center rounded-xl bg-gradient-primary px-8 py-3 text-lg font-bold shadow-2xl transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/50 disabled:transform-none disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50" title={canCreate ? 'Criar nova unidade' : 'Apenas administradores podem criar unidades'}>
                <Plus className="mr-2 h-6 w-6" />
                Nova Unidade
              </button>
            </div>
          </div>

          {/* Linha 2: Descrição */}
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Gerencie as unidades da sua rede de barbearias
          </p>
        </div>
      </div>

      {/* ==================== FILTROS E VISUALIZAÇÃO ==================== */}
      <div className="mb-6 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        {/* Barra de Busca e Filtros */}
        <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {/* Busca */}
          <div className="relative max-w-md flex-1">
            <Search className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
            <input type="text" placeholder="Buscar unidades..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="card-theme w-full rounded-xl border border-light-border py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface" />
          </div>

          {/* Filtro de Status */}
          <div className="card-theme flex items-center gap-2 rounded-xl border border-light-border px-4 py-2.5 dark:border-dark-border dark:bg-dark-surface">
            <Filter className="text-light-text-muted dark:text-dark-text-muted h-5 w-5" />
            <select value={showInactive ? 'all' : 'active'} onChange={e => setShowInactive(e.target.value === 'all')} className="cursor-pointer border-none bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 focus:ring-0 dark:text-gray-200 dark:text-theme-secondary">
              <option value="active">Apenas Ativas ({stats.active})</option>
              <option value="all">Todas ({stats.total})</option>
            </select>
          </div>
        </div>

        {/* Seletor de Visualização */}
        {canViewStats && <div className="card-theme flex rounded-xl border border-light-border p-1 dark:border-dark-border dark:bg-dark-surface">
            <button onClick={() => setView('cards')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${view === 'cards' ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`} title="Visualização em cards">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button onClick={() => setView('stats')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${view === 'stats' ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`} title="Estatísticas detalhadas">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estatísticas</span>
            </button>
            <button onClick={() => setView('comparison')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${view === 'comparison' ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`} title="Comparar unidades">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Comparar</span>
            </button>
          </div>}
      </div>

      {/* ==================== KPI CARDS ==================== */}
      {view === 'cards' && !loading && <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total de Unidades" value={stats.total} subtitle="Todas cadastradas" icon={Building2} color="blue" loading={loading} />

          <KPICard title="Unidades Ativas" value={stats.active} subtitle={`${stats.activePercentage.toFixed(1)}% do total`} icon={CheckCircle} color="green" trend={{
        value: stats.activePercentage,
        isPositive: true,
        period: 'Operacionais'
      }} loading={loading} />

          <KPICard title="Unidades Inativas" value={stats.inactive} subtitle={`${(100 - stats.activePercentage).toFixed(1)}% do total`} icon={XCircle} color="red" trend={{
        value: 100 - stats.activePercentage,
        isPositive: false,
        period: 'Desativadas'
      }} loading={loading} />

          <KPICard title="Taxa de Ativação" value={`${stats.activePercentage.toFixed(1)}%`} subtitle="Unidades operacionais" icon={TrendingUp} color="blue" loading={loading} />
        </div>}

      {/* ==================== CONTEÚDO PRINCIPAL ==================== */}
      {loading && view === 'cards' /* Loading State */ ? <Card className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted font-medium">
              Carregando unidades...
            </p>
          </div>
        </Card> : error /* Error State */ ? <Card className="p-12">
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-xl font-semibold">
              Erro ao carregar unidades
            </h3>
            <p className="mx-auto mb-6 max-w-md text-red-600 dark:text-red-400">
              {error}
            </p>
            <button onClick={handleRefresh} className="text-dark-text-primary inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl">
              <RefreshCw className="mr-2 h-5 w-5" />
              Tentar Novamente
            </button>
          </div>
        </Card> /* Content */ : renderContent()}

      {/* Modais */}
      {showCreateModal && <CreateUnitModal isOpen={showCreateModal} onClose={closeModals} onSuccess={handleModalSuccess} />}

      {showEditModal && selectedUnit && <EditUnitModal isOpen={showEditModal} onClose={closeModals} onSuccess={handleModalSuccess} unit={selectedUnit} />}

      {showDeleteModal && selectedUnit && <DeleteUnitModal isOpen={showDeleteModal} onClose={closeModals} onSuccess={handleModalSuccess} unit={selectedUnit} />}
    </MainContainer>;
};
export default UnitsPage;