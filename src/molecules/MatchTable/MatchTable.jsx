import React, { useState } from 'react';
import { Check, X, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { ConfidenceBadge } from '../../atoms';
import { formatCurrency, formatDate } from '../../utils';

/**
 * Tabela de matches de reconciliação bancária
 *
 * @param {Array} matches - Lista de matches retornados pelo autoReconcile
 * @param {Function} onConfirm - Callback ao confirmar match (match, index)
 * @param {Function} onReject - Callback ao rejeitar match (match, index)
 * @param {boolean} loading - Estado de loading global
 */
const MatchTable = ({
  matches = [],
  onConfirm,
  onReject,
  loading = false
}) => {
  const [processingIndex, setProcessingIndex] = useState(null);
  const [processingAction, setProcessingAction] = useState(null); // 'confirm' | 'reject'

  const handleConfirm = async (match, index) => {
    setProcessingIndex(index);
    setProcessingAction('confirm');
    try {
      await onConfirm(match, index);
    } finally {
      setProcessingIndex(null);
      setProcessingAction(null);
    }
  };
  const handleReject = async (match, index) => {
    setProcessingIndex(index);
    setProcessingAction('reject');
    try {
      await onReject(match, index);
    } finally {
      setProcessingIndex(null);
      setProcessingAction(null);
    }
  };
  if (matches.length === 0) {
    return <div className="text-center py-12 text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted" data-testid="match-table-empty">
        <p className="text-lg font-medium">Nenhum match encontrado</p>
        <p className="text-sm mt-2">
          Ajuste a tolerância ou revise os lançamentos manualmente
        </p>
      </div>;
  }
  return <div className="overflow-x-auto" data-testid="match-table">
      <table className="w-full border-collapse">
        <thead>
          <tr className="card-theme dark:bg-dark-surface border-b-2 border-light-border dark:border-dark-border">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Extrato Bancário
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Receita
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Confiança
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Diferença
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, index) => {
          const isProcessing = processingIndex === index;
          const difference = match.difference || 0;
          const hasDifference = Math.abs(difference) > 0.01;
          return <tr key={`match-${index}`} className="border-b border-light-border dark:border-dark-border hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-dark-surface/50 transition-colors" data-testid={`match-row-${index}`}>
                {/* Coluna Extrato */}
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-theme-primary dark:text-dark-text-primary">
                      {match.statement?.description || 'Sem descrição'}
                    </div>
                    <div className="text-xs text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                      {formatDate(match.statement?.date)} •{' '}
                      {formatCurrency(match.statement?.amount || 0)}
                    </div>
                  </div>
                </td>

                {/* Coluna Receita */}
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-theme-primary dark:text-dark-text-primary">
                      {match.revenue?.description || match.revenue?.category || 'Sem descrição'}
                    </div>
                    <div className="text-xs text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                      {formatDate(match.revenue?.date)} •{' '}
                      {formatCurrency(match.revenue?.amount || match.revenue?.value || 0)}
                    </div>
                    {match.revenue?.professional_name && <div className="text-xs text-blue-600 dark:text-blue-400">
                        {match.revenue.professional_name}
                      </div>}
                  </div>
                </td>

                {/* Coluna Confiança */}
                <td className="px-4 py-4 text-center">
                  <ConfidenceBadge confidence={match.confidence_score || 0} size="sm" />
                </td>

                {/* Coluna Diferença */}
                <td className="px-4 py-4 text-right">
                  {hasDifference ? <div className="flex items-center justify-end gap-1">
                      {difference > 0 ? <TrendingUp size={14} className="text-green-600 dark:text-green-400" /> : <TrendingDown size={14} className="text-red-600 dark:text-red-400" />}
                      <span className={`text-sm font-medium ${difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(Math.abs(difference))}
                      </span>
                    </div> : <span className="text-sm text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary">
                      —
                    </span>}
                </td>

                {/* Coluna Ações */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleConfirm(match, index)} disabled={loading || isProcessing} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-dark-text-primary bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors" data-testid={`btn-confirm-match-${index}`} aria-label="Confirmar match">
                      {isProcessing && processingAction === 'confirm' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Confirmar
                    </button>
                    <button onClick={() => handleReject(match, index)} disabled={loading || isProcessing} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-dark-text-primary bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors" data-testid={`btn-reject-match-${index}`} aria-label="Rejeitar match">
                      {isProcessing && processingAction === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                      Rejeitar
                    </button>
                  </div>
                </td>
              </tr>;
        })}
        </tbody>
      </table>

      {/* Rodapé com resumo */}
      <div className="mt-4 px-4 py-3 bg-light-bg dark:bg-dark-bg dark:bg-dark-surface rounded-md">
        <div className="flex items-center justify-between text-sm">
          <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Total de matches encontrados: <strong>{matches.length}</strong>
          </span>
          <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Revise e confirme cada match individualmente
          </span>
        </div>
      </div>
    </div>;
};
export default MatchTable;