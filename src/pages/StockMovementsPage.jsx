/**
 * @file StockMovementsPage.jsx
 * @description Página principal de movimentações de estoque
 * @module Pages/Stock
 * @author Andrey Viana
 * @date 13/11/2025
 */

import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Download,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../atoms/Button/Button';
import StockMovementTable from '../components/stock/StockMovementTable';
import StockMovementModal from '../components/stock/StockMovementModal';
import StockSummaryCard from '../components/stock/StockSummaryCard';
import { useStockMovements, useStockSummary } from '../hooks/useStockMovements';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';

/**
 * Página de movimentações de estoque
 * Design System compliant com tabs, filtros e export
 */
const StockMovementsPage = () => {
  const { showToast } = useToast();

  // Estados
  const [activeTab, setActiveTab] = useState('hoje'); // 'hoje', '7dias', 'custom'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('ENTRADA');
  const [currentPage, setCurrentPage] = useState(1);
  const [customDates, setCustomDates] = useState({
    startDate: null,
    endDate: null,
  });

  // Calcular período baseado na aba ativa
  const getPeriodDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (activeTab) {
      case 'hoje':
        return { startDate: today, endDate: tomorrow };
      case '7dias': {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return { startDate: sevenDaysAgo, endDate: tomorrow };
      }
      case 'custom':
        return customDates;
      default:
        return { startDate: today, endDate: tomorrow };
    }
  };

  const period = getPeriodDates();

  // Hooks
  const {
    movements,
    totalCount,
    // hasMore, // Não utilizado no momento
    isLoading,
    isFetching,
    error,
    refetch,
    recordEntry,
    recordExit,
    isRecordingEntry,
    isRecordingExit,
  } = useStockMovements({
    filters: {
      startDate: period.startDate,
      endDate: period.endDate,
      page: currentPage,
      pageSize: 20,
    },
  });

  const { summary, isLoading: loadingSummary } = useStockSummary(
    period.startDate,
    period.endDate
  );

  // Handlers
  const handleOpenModal = type => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSubmitMovement = async data => {
    try {
      if (modalType === 'ENTRADA') {
        await recordEntry(data);
      } else {
        await recordExit(data);
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao registrar movimentação',
        message: err.message,
      });
    }
  };

  const handleExportCSV = () => {
    // Implementar export CSV
    showToast({
      type: 'info',
      title: 'Export em desenvolvimento',
      message: 'Funcionalidade de export CSV será implementada em breve',
    });
  };

  const handleViewDetails = movement => {
    // Implementar visualização de detalhes
    // TODO: Implementar modal de detalhes
    showToast({
      type: 'info',
      title: 'Em desenvolvimento',
      message: `Detalhes da movimentação: ${movement.id}`,
    });
  };

  const handleEditNotes = movement => {
    // Implementar edição de notas
    // TODO: Implementar modal de edição de notas
    showToast({
      type: 'info',
      title: 'Em desenvolvimento',
      message: `Editar notas da movimentação: ${movement.id}`,
    });
  };

  const handleRevert = movementId => {
    // Implementar reversão (requer confirmação)
    // TODO: Implementar confirmação e reversão
    showToast({
      type: 'warning',
      title: 'Em desenvolvimento',
      message: `Reverter movimentação: ${movementId}`,
    });
  };

  return (
    <div className="min-h-screen bg-light-bg p-4 dark:bg-dark-bg md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-theme-primary text-2xl font-bold sm:text-3xl">
              Movimentações de Estoque
            </h1>
            <p className="text-theme-muted mt-1 text-sm">
              Gerencie entradas e saídas de produtos
            </p>
          </div>

          {/* Botões de ação - responsivo */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {/* Botões secundários - primeira linha no mobile */}
            <Button
              variant="outline"
              size="md"
              onClick={() => refetch()}
              icon={
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                />
              }
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleExportCSV}
              icon={<Download className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>

            {/* Botões principais - segunda linha no mobile */}
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleOpenModal('SAIDA')}
              icon={<Minus className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Registrar Saída</span>
              <span className="sm:hidden">Saída</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleOpenModal('ENTRADA')}
              icon={<Plus className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Registrar Entrada</span>
              <span className="sm:hidden">Entrada</span>
            </Button>
          </div>
        </div>

        {/* Resumo KPI */}
        <StockSummaryCard
          summary={summary}
          isLoading={loadingSummary}
          onViewHistory={() => setActiveTab('7dias')}
        />

        {/* Tabs de Período */}
        <div className="card-theme overflow-hidden">
          <div className="border-theme-border flex overflow-x-auto border-b scrollbar-hide">
            <button
              onClick={() => setActiveTab('hoje')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors sm:flex-1 sm:px-6 ${
                activeTab === 'hoje'
                  ? 'border-b-2 border-primary bg-light-bg text-primary dark:bg-dark-surface'
                  : 'text-theme-muted hover:bg-light-bg dark:hover:bg-dark-surface'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setActiveTab('7dias')}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors sm:flex-1 sm:px-6 ${
                activeTab === '7dias'
                  ? 'border-b-2 border-primary bg-light-bg text-primary dark:bg-dark-surface'
                  : 'text-theme-muted hover:bg-light-bg dark:hover:bg-dark-surface'
              }`}
            >
              Últimos 7 Dias
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors sm:flex-1 sm:px-6 ${
                activeTab === 'custom'
                  ? 'border-b-2 border-primary bg-light-bg text-primary dark:bg-dark-surface'
                  : 'text-theme-muted hover:bg-light-bg dark:hover:bg-dark-surface'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Período Customizado</span>
                <span className="sm:hidden">Customizado</span>
              </span>
            </button>
          </div>

          {/* Filtro de período customizado */}
          {activeTab === 'custom' && (
            <div className="border-theme-border border-b bg-light-bg p-4 dark:bg-dark-surface">
              <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className="text-theme-primary mb-2 block text-sm font-medium">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={
                      customDates.startDate
                        ? formatDate(customDates.startDate, 'yyyy-MM-dd')
                        : ''
                    }
                    onChange={e =>
                      setCustomDates(prev => ({
                        ...prev,
                        startDate: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      }))
                    }
                    className="input-theme w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-theme-primary mb-2 block text-sm font-medium">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={
                      customDates.endDate
                        ? formatDate(customDates.endDate, 'yyyy-MM-dd')
                        : ''
                    }
                    onChange={e =>
                      setCustomDates(prev => ({
                        ...prev,
                        endDate: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      }))
                    }
                    className="input-theme w-full"
                  />
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => refetch()}
                  icon={<Filter className="h-4 w-4" />}
                  className="w-full md:w-auto"
                >
                  Aplicar Filtro
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabela de Movimentações */}
        {error && (
          <div className="card-theme border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <StockMovementTable
          movements={movements}
          isLoading={isLoading}
          currentPage={currentPage}
          pageSize={20}
          totalCount={totalCount}
          onPageChange={setCurrentPage}
          onViewDetails={handleViewDetails}
          onEditNotes={handleEditNotes}
          onRevert={handleRevert}
          canRevert={false} // Implementar verificação de permissão
        />

        {/* Modal de Movimentação */}
        <StockMovementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitMovement}
          isSubmitting={isRecordingEntry || isRecordingExit}
          movementType={modalType}
        />
      </div>
    </div>
  );
};

export default StockMovementsPage;
