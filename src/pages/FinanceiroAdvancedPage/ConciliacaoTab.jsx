import React, { useState, useEffect, useCallback } from 'react';

// Custom Hooks
import { useReconciliationMatches } from '../../hooks/useReconciliationMatches';
import { useBankStatements } from '../../hooks/useBankStatements';
import useBankAccounts from '../../hooks/useBankAccounts';

// Components
import ConciliacaoPanel from '../../organisms/ConciliacaoPanel/ConciliacaoPanel';
import ImportStatementModal from '../../templates/ImportStatementModal';
import ManualReconciliationModal from '../../templates/ManualReconciliationModal';
import ImportExpensesFromOFXModal from '../../templates/ImportExpensesFromOFXModal';

/**
 * Tab de Conciliação Bancária
 *
 * Features:
 * - ConciliacaoPanel para gerenciar matches automáticos
 * - ImportStatementModal para importação de extratos
 * - ManualReconciliationModal para vinculações manuais
 * - Integration com hooks de reconciliação e extratos
 */
const ConciliacaoTab = ({
  globalFilters
}) => {
  // Estado local
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportExpensesOFXModalOpen, setIsImportExpensesOFXModalOpen] = useState(false);

  // Hooks para dados
  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
    runAutoMatch,
    confirmMatch,
    rejectMatch
  } = useReconciliationMatches(globalFilters.accountId);
  const {
    statements,
    unreconciled,
    loading: statementsLoading,
    error: statementsError,
    refetch: refetchStatements,
    importStatements
  } = useBankStatements(globalFilters.accountId, null, null);
  const {
    bankAccounts: availableAccounts,
    loading: bankAccountsLoading,
    updateFilters: updateBankAccountFilters
  } = useBankAccounts({
    unitId: globalFilters.unitId,
    incluirInativas: false
  });
  useEffect(() => {
    updateBankAccountFilters({
      unitId: globalFilters.unitId,
      incluirInativas: false
    });
  }, [globalFilters.unitId, updateBankAccountFilters]);

  // Handlers
  const handleImportSuccess = useCallback(() => {
    setIsImportModalOpen(false);
    refetchMatches();
  }, [refetchMatches]);
  const handleImportExpensesOFXSuccess = useCallback(report => {
    setIsImportExpensesOFXModalOpen(false);
    refetchMatches();
    refetchStatements();
    console.log('✅ Importação OFX concluída:', report);
  }, [refetchMatches, refetchStatements]);
  const handleImport = useCallback(payload => importStatements(payload), [importStatements]);
  const handleManualReconciliationSuccess = () => {
    setIsManualModalOpen(false);
    refetchStatements();
    refetchMatches();
  };
  const handleRunAutoMatch = async () => {
    await runAutoMatch();
  };
  const handleConfirmMatch = async (matchId, adjustmentData) => {
    const result = await confirmMatch(matchId, adjustmentData);
    if (result.success) {
      refetchStatements();
    }
    return result;
  };
  const handleRejectMatch = async (matchId, reason) => {
    const result = await rejectMatch(matchId, reason);
    if (result.success) {
      refetchStatements();
    }
    return result;
  };
  return <div className="space-y-6">
      {/* Controles principais - Dark Mode */}
      <div className="card-theme rounded-lg border border-light-border p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
              Conciliação Bancária
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
              Gerencie a conciliação entre extratos bancários e lançamentos
              financeiros
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={() => setIsImportModalOpen(true)} className="text-dark-text-primary rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600">
              Importar Extrato
            </button>
            <button onClick={() => setIsImportExpensesOFXModalOpen(true)} className="text-dark-text-primary rounded-md bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600">
              Importar Despesas (OFX)
            </button>
            <button onClick={() => setIsManualModalOpen(true)} className="card-theme rounded-md border border-light-border px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700 dark:text-theme-secondary dark:hover:bg-gray-600">
              Vincular Manual
            </button>
            <button onClick={handleRunAutoMatch} disabled={matchesLoading || !globalFilters.accountId} className="card-theme rounded-md border border-light-border px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700 dark:text-theme-secondary dark:hover:bg-gray-600">
              Executar Auto-Match
            </button>
          </div>
        </div>

        {/* Info da conta selecionada - Dark Mode */}
        {!globalFilters.accountId && <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Selecione uma conta bancária nos filtros globais para utilizar a
              conciliação.
            </p>
          </div>}
      </div>

      {/* Panel principal de conciliação */}
      {globalFilters.accountId ? <ConciliacaoPanel
    // Props adaptadas para o painel
    reconciliationMatches={matches} bankTransactions={statements} internalTransactions={unreconciled} selectedAccount={availableAccounts.find(acc => acc.id === globalFilters.accountId) || {
      id: globalFilters.accountId,
      nome: 'Conta Selecionada'
    }}
    // Estados
    loading={matchesLoading || statementsLoading} error={matchesError || statementsError}
    // Callbacks
    onApproveMatch={handleConfirmMatch} onRejectMatch={handleRejectMatch} onRefreshData={() => {
      refetchMatches();
      refetchStatements();
    }} onRunAutoMatch={handleRunAutoMatch} onImportStatement={() => setIsImportModalOpen(true)} onCreateManualMatch={() => setIsManualModalOpen(true)} /> : <div className="card-theme rounded-lg border border-light-border p-12 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="text-center">
            <div className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary mb-4 text-6xl">
              🏦
            </div>
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-medium">
              Nenhuma conta selecionada
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mx-auto max-w-md">
              Para utilizar a conciliação bancária, você precisa primeiro
              selecionar uma conta bancária nos filtros globais da página.
            </p>
          </div>
        </div>}

      {/* Modal de importação */}
      <ImportStatementModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImport} onSuccess={handleImportSuccess} loading={statementsLoading || bankAccountsLoading} availableAccounts={availableAccounts} defaultAccountId={globalFilters.accountId} />

      {/* Modal de conciliação manual */}
      <ManualReconciliationModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} onSuccess={handleManualReconciliationSuccess} accountId={globalFilters.accountId} unreconciled={unreconciled} />

      {/* Modal de importação de despesas OFX */}
      <ImportExpensesFromOFXModal isOpen={isImportExpensesOFXModalOpen} onClose={() => setIsImportExpensesOFXModalOpen(false)} onSuccess={handleImportExpensesOFXSuccess} availableAccounts={availableAccounts} defaultAccountId={globalFilters.accountId} unitId={globalFilters.unitId} />

      {/* Status de loading overlay - Dark Mode */}
      {(matchesLoading || statementsLoading) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm dark:bg-black dark:bg-opacity-50">
          <div className="card-theme rounded-lg border border-light-border p-6 shadow-xl dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="text-theme-primary dark:text-dark-text-primary">
                Carregando dados de conciliação...
              </span>
            </div>
          </div>
        </div>}
    </div>;
};
export default ConciliacaoTab;