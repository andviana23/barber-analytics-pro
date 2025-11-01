import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { MatchTable } from '../../molecules';
import reconciliationService from '../../services/reconciliationService';
import { useToast } from '../../context/ToastContext';

/**
 * Step intermediário para auto-match de reconciliação bancária
 * Executa autoReconcile e exibe matches para confirmação/rejeição
 *
 * @param {string} accountId - ID da conta bancária selecionada
 * @param {Array} statements - Lista de lançamentos do extrato bancário
 * @param {Function} onMatchesConfirmed - Callback após confirmar todos matches (confirmedCount)
 * @param {Function} onSkip - Callback para pular auto-match e ir direto para preview
 * @param {number} tolerance - Tolerância de valor (padrão: 0.01 = R$ 0,01)
 * @param {number} dateTolerance - Tolerância de dias na data (padrão: 2 dias)
 */
const AutoMatchStep = ({
  accountId,
  statements = [],
  onMatchesConfirmed,
  onSkip,
  tolerance = 0.01,
  dateTolerance = 2
}) => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const {
    showToast
  } = useToast();

  // Executa auto-match ao montar componente
  useEffect(() => {
    const executeAutoMatch = async () => {
      if (!accountId || statements.length === 0) {
        setError('Conta bancária ou lançamentos não informados');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const {
          data,
          error: autoMatchError
        } = await reconciliationService.autoReconcile({
          account_id: accountId,
          tolerance,
          date_tolerance: dateTolerance
        });
        if (autoMatchError) {
          throw new Error(autoMatchError.message || 'Erro ao executar auto-match');
        }
        setMatches(data?.matches || []);
        if (!data?.matches || data.matches.length === 0) {
          showToast('Nenhum match automático encontrado', 'info');
        } else {
          showToast(`${data.matches.length} match(es) encontrado(s)`, 'success');
        }
      } catch (err) {
        console.error('Erro no auto-match:', err);
        setError(err.message || 'Erro desconhecido ao executar auto-match');
        showToast('Erro ao executar auto-match', 'error');
      } finally {
        setLoading(false);
      }
    };
    executeAutoMatch();
  }, [accountId, statements, tolerance, dateTolerance]);

  // Handler de confirmação de match individual
  const handleConfirmMatch = async (match, index) => {
    try {
      const {
        error: confirmError
      } = await reconciliationService.confirmReconciliation({
        statement_id: match.statement_id || match.bank_statement_id,
        reference_type: match.reference_type || 'Revenue',
        reference_id: match.reference_id || match.revenue_id,
        difference: match.difference || 0
      });
      if (confirmError) {
        throw new Error(confirmError.message || 'Erro ao confirmar reconciliação');
      }

      // Remove match da lista
      setMatches(prev => prev.filter((_, i) => i !== index));
      setConfirmedCount(prev => prev + 1);
      showToast('Match confirmado com sucesso', 'success');
    } catch (err) {
      console.error('Erro ao confirmar match:', err);
      showToast(err.message || 'Erro ao confirmar match', 'error');
    }
  };

  // Handler de rejeição de match individual
  const handleRejectMatch = async (match, index) => {
    try {
      // Se já existe reconciliation_id, chama rejectReconciliation
      if (match.reconciliation_id) {
        const {
          error: rejectError
        } = await reconciliationService.rejectReconciliation(match.reconciliation_id, 'Match rejeitado pelo usuário na revisão manual');
        if (rejectError) {
          throw new Error(rejectError.message || 'Erro ao rejeitar reconciliação');
        }
      }

      // Remove match da lista
      setMatches(prev => prev.filter((_, i) => i !== index));
      setRejectedCount(prev => prev + 1);
      showToast('Match rejeitado', 'warning');
    } catch (err) {
      console.error('Erro ao rejeitar match:', err);
      showToast(err.message || 'Erro ao rejeitar match', 'error');
    }
  };

  // Handler de finalizar revisão (ir para próximo step)
  const handleFinishReview = () => {
    if (matches.length > 0) {
      showToast('Ainda existem matches pendentes de revisão', 'warning');
      return;
    }
    onMatchesConfirmed(confirmedCount);
  };

  // Renderização de loading
  if (loading) {
    return <div className="flex flex-col items-center justify-center py-16 space-y-4" data-testid="auto-match-loading">
        <Loader2 size={48} className="animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Executando auto-match...
        </p>
        <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
          Comparando lançamentos bancários com receitas registradas
        </p>
      </div>;
  }

  // Renderização de erro
  if (error) {
    return <div className="flex flex-col items-center justify-center py-16 space-y-4" data-testid="auto-match-error">
        <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Erro ao executar auto-match
        </p>
        <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted max-w-md text-center">
          {error}
        </p>
        <button onClick={onSkip} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-dark-text-primary rounded-md transition-colors" data-testid="btn-skip-after-error">
          Pular e continuar manualmente
        </button>
      </div>;
  }

  // Renderização quando não há matches pendentes
  if (matches.length === 0) {
    return <div className="space-y-6" data-testid="auto-match-complete">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <CheckCircle2 size={64} className="text-green-600 dark:text-green-400" />
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
            Revisão concluída!
          </p>
          <div className="text-center space-y-1">
            <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              <strong className="text-green-600 dark:text-green-400">
                {confirmedCount}
              </strong>{' '}
              match(es) confirmado(s)
            </p>
            {rejectedCount > 0 && <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                <strong className="text-red-600 dark:text-red-400">
                  {rejectedCount}
                </strong>{' '}
                match(es) rejeitado(s)
              </p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
          <button onClick={onSkip} className="px-4 py-2 text-gray-700 dark:text-gray-300 dark:text-gray-600 hover:card-theme dark:hover:bg-dark-surface rounded-md transition-colors" data-testid="btn-back-to-preview">
            Revisar lançamentos
          </button>
          <button onClick={handleFinishReview} className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-dark-text-primary rounded-md transition-colors" data-testid="btn-finish-review">
            Continuar
            <ArrowRight size={16} />
          </button>
        </div>
      </div>;
  }

  // Renderização principal com MatchTable
  return <div className="space-y-6" data-testid="auto-match-step">
      {/* Header com resumo */}
      <div className="flex items-center justify-between pb-4 border-b border-light-border dark:border-dark-border">
        <div>
          <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary">
            Revisão de Matches Automáticos
          </h3>
          <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1">
            Revise cada match e confirme ou rejeite individualmente
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">Pendentes:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {matches.length}
            </span>
          </div>
          {confirmedCount > 0 && <div className="flex items-center gap-2">
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Confirmados:
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {confirmedCount}
              </span>
            </div>}
          {rejectedCount > 0 && <div className="flex items-center gap-2">
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Rejeitados:
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {rejectedCount}
              </span>
            </div>}
        </div>
      </div>

      {/* Tabela de matches */}
      <MatchTable matches={matches} onConfirm={handleConfirmMatch} onReject={handleRejectMatch} loading={loading} />

      {/* Footer com ações */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
        <button onClick={onSkip} className="px-4 py-2 text-gray-700 dark:text-gray-300 dark:text-gray-600 hover:card-theme dark:hover:bg-dark-surface rounded-md transition-colors" data-testid="btn-skip-automatch">
          Pular auto-match
        </button>
      </div>
    </div>;
};
export default AutoMatchStep;