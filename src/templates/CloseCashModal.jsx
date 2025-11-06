import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../atoms/Modal';
import CurrencyInput from '../atoms/CurrencyInput';
import { formatCurrency } from '../utils/formatters';

/**
 * CloseCashModal - Modal para fechamento de caixa
 *
 * Template modal que permite fechar o caixa com conferência de valores.
 * Calcula diferença entre esperado e informado, valida e confirma operação.
 *
 * @component
 * @example
 * ```jsx
 * <CloseCashModal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   onConfirm={handleCloseCash}
 *   cashRegister={activeCash}
 *   expectedBalance={calculatedBalance}
 * />
 * ```
 */
const CloseCashModal = ({
  isOpen,
  onClose,
  onConfirm,
  cashRegister,
  expectedBalance = 0,
  transactions = [],
  loading = false,
}) => {
  const [closingBalance, setClosingBalance] = useState(expectedBalance);
  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState({});
  const [showDifferenceWarning, setShowDifferenceWarning] = useState(false);
  useEffect(() => {
    setClosingBalance(expectedBalance);
  }, [expectedBalance]);
  const difference = closingBalance - expectedBalance;
  const hasDifference = Math.abs(difference) > 0.01; // Considera diferenças maiores que 1 centavo

  const handleReset = () => {
    setClosingBalance(expectedBalance);
    setObservations('');
    setErrors({});
    setShowDifferenceWarning(false);
  };
  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };
  const validate = () => {
    const newErrors = {};
    if (closingBalance < 0) {
      newErrors.closingBalance = 'Saldo final não pode ser negativo';
    }
    if (closingBalance > 1000000) {
      newErrors.closingBalance = 'Saldo final muito alto. Verifique o valor.';
    }

    // Se há diferença significativa e não confirmou
    if (hasDifference && !showDifferenceWarning) {
      setShowDifferenceWarning(true);
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;
    if (onConfirm) {
      onConfirm({
        closingBalance: closingBalance,
        // ✅ camelCase para DTO
        observations: observations.trim() || null,
        difference: difference,
      });
    }
  };
  const totalInflow = transactions
    .filter(t => t.type === 'inflow')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOutflow = transactions
    .filter(t => t.type === 'outflow')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Fechar Caixa"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resumo de Movimentações */}
        <div className="rounded-lg border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-hover">
          <h4 className="text-theme-primary mb-4 font-semibold">
            Resumo do Caixa
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-theme-secondary text-sm">
                Saldo Inicial:
              </span>
              <span className="text-theme-primary font-medium">
                {formatCurrency(cashRegister?.opening_balance || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-secondary text-sm">
                (+) Entradas
                <span className="ml-1 text-xs">
                  ({transactions.filter(t => t.type === 'inflow').length})
                </span>
              </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                +{formatCurrency(totalInflow)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-secondary text-sm">
                (-) Saídas
                <span className="ml-1 text-xs">
                  ({transactions.filter(t => t.type === 'outflow').length})
                </span>
              </span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -{formatCurrency(totalOutflow)}
              </span>
            </div>
            <div className="border-t border-light-border pt-2 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <span className="text-theme-primary font-semibold">
                  Saldo Esperado:
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(expectedBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Saldo Informado */}
        <div>
          <CurrencyInput
            label="Saldo Final (contado)"
            value={closingBalance}
            onChange={setClosingBalance}
            min={0}
            error={errors.closingBalance}
            required
            placeholder="0,00"
            helperText="Informe o valor real contado no caixa"
          />
        </div>

        {/* Diferença */}
        {hasDifference && (
          <div
            className={`rounded-lg border p-4 ${difference > 0 ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}
          >
            <div className="flex items-start gap-3">
              <svg
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4
                  className={`mb-1 font-semibold ${difference > 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}
                >
                  Diferença Detectada: {difference > 0 ? '+' : ''}
                  {formatCurrency(difference)}
                </h4>
                <p
                  className={`text-sm ${difference > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                >
                  {difference > 0
                    ? 'O caixa tem mais dinheiro do que o esperado (sobra).'
                    : 'O caixa tem menos dinheiro do que o esperado (falta).'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="text-theme-primary mb-2 block text-sm font-medium">
            Observações
            {hasDifference && <span className="ml-1 text-red-500">*</span>}
          </label>
          <textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            disabled={loading}
            rows={4}
            maxLength={500}
            placeholder={
              hasDifference
                ? 'Explique o motivo da diferença encontrada...'
                : 'Informações adicionais sobre o fechamento (opcional)'
            }
            className="card-theme text-theme-primary placeholder-theme-secondary w-full resize-none rounded-lg border border-light-border px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-border dark:bg-dark-surface"
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-theme-secondary text-xs">
              {hasDifference
                ? 'Obrigatório explicar a diferença'
                : 'Informações adicionais'}
            </p>
            <p className="text-theme-secondary text-xs">
              {observations.length}/500
            </p>
          </div>
        </div>

        {/* Confirmação de diferença */}
        {hasDifference && showDifferenceWarning && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold text-yellow-800 dark:text-yellow-200">
                  Confirme o Fechamento
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Você está fechando o caixa com uma diferença de{' '}
                  <strong>
                    {difference > 0 ? '+' : ''}
                    {formatCurrency(difference)}
                  </strong>
                  . Verifique os valores e confirme se está correto.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 border-t border-light-border pt-4 dark:border-dark-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-theme-primary flex-1 rounded-lg border border-light-border px-4 py-2.5 font-medium transition-colors hover:bg-light-surface disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-border dark:hover:bg-dark-hover"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || (hasDifference && !observations.trim())}
            className="text-dark-text-primary inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                Fechando...
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Fechar Caixa
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
CloseCashModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback ao fechar */
  onClose: PropTypes.func.isRequired,
  /** Callback ao confirmar fechamento */
  onConfirm: PropTypes.func.isRequired,
  /** Dados do caixa atual */
  cashRegister: PropTypes.shape({
    opening_balance: PropTypes.number,
    opened_at: PropTypes.string,
    opened_by_name: PropTypes.string,
  }),
  /** Saldo esperado calculado */
  expectedBalance: PropTypes.number,
  /** Lista de transações do período */
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['inflow', 'outflow']),
      amount: PropTypes.number,
    })
  ),
  /** Estado de carregamento */
  loading: PropTypes.bool,
};
export default CloseCashModal;
