/**
 * @file CloseCashModal.jsx
 * @description Modal para fechamento de caixa
 * @module Components/Templates/Modals
 * @author Andrey Viana
 * @date 2025-10-24
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import { Input } from '../../../atoms/Input/Input';
import { validateCloseCashRegister } from '../../../dtos/CashRegisterDTO';
import { formatCurrency } from '../../../utils/formatters';

/**
 * Modal para fechar caixa com cálculo de diferença
 * Segue padrões do Design System
 */
const CloseCashModal = ({
  isOpen,
  onClose,
  onConfirm,
  cashRegister,
  expectedBalance,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    closingBalance: '',
    observations: '',
  });
  const [errors, setErrors] = useState({});
  const [difference, setDifference] = useState(0);

  // Calcula diferença quando saldo informado muda
  useEffect(() => {
    const closingBalance = parseFloat(formData.closingBalance) || 0;
    const expected = expectedBalance || 0;
    setDifference(closingBalance - expected);
  }, [formData.closingBalance, expectedBalance]);
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();

    // Valida com Zod
    const validation = validateCloseCashRegister({
      closingBalance: parseFloat(formData.closingBalance) || 0,
      observations: formData.observations,
    });
    if (!validation.success) {
      setErrors({
        form: validation.error,
      });
      return;
    }

    // Chama callback de confirmação
    await onConfirm(validation.data);

    // Reseta form
    setFormData({
      closingBalance: '',
      observations: '',
    });
    setErrors({});
  };
  const handleClose = () => {
    if (!loading) {
      setFormData({
        closingBalance: '',
        observations: '',
      });
      setErrors({});
      onClose();
    }
  };
  if (!isOpen || !cashRegister) return null;
  const closingBalanceNumber = parseFloat(formData.closingBalance) || 0;
  const hasDifference = Math.abs(difference) > 0.01;

  // Ícone e cor da diferença
  const DifferenceIcon =
    difference > 0 ? TrendingUp : difference < 0 ? TrendingDown : Minus;
  const differenceColor =
    difference > 0
      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      : difference < 0
        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        : 'text-theme-secondary dark:text-dark-text-muted bg-light-surface/30 dark:bg-dark-surface/30 border-light-border dark:border-dark-border';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card-theme max-h-[90vh] w-full max-w-md overflow-y-auto">
        {/* Header */}
        <div className="border-theme-border flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-theme-primary text-xl font-bold">
              Fechar Caixa
            </h2>
            <p className="text-theme-muted mt-1 text-sm">
              Informe o saldo final para fechamento
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="hover:card-theme rounded-lg p-2 transition-colors disabled:opacity-50 dark:hover:bg-dark-surface"
            aria-label="Fechar modal"
          >
            <X size={20} className="text-theme-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Saldo Inicial */}
          <div className="border-theme-border rounded-lg border bg-light-bg p-4 dark:bg-dark-bg dark:bg-dark-surface/50">
            <div className="flex items-center justify-between">
              <span className="text-theme-muted text-sm font-medium">
                Saldo Inicial:
              </span>
              <span className="text-theme-primary text-base font-semibold">
                {formatCurrency(cashRegister.opening_balance || 0)}
              </span>
            </div>
          </div>

          {/* Saldo Esperado */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Saldo Esperado:
              </span>
              <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {formatCurrency(expectedBalance || 0)}
              </span>
            </div>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-300">
              Calculado com base nas movimentações registradas
            </p>
          </div>

          {/* Saldo Informado */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              Saldo em Caixa (Contado) *
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <DollarSign size={18} className="text-theme-muted" />
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.closingBalance}
                onChange={e => handleChange('closingBalance', e.target.value)}
                placeholder="0,00"
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
            {closingBalanceNumber > 0 && (
              <p className="text-theme-muted mt-1 text-xs">
                {formatCurrency(closingBalanceNumber)}
              </p>
            )}
          </div>

          {/* Diferença */}
          {hasDifference && formData.closingBalance && (
            <div className={`rounded-lg border p-4 ${differenceColor}`}>
              <div className="mb-1 flex items-center gap-2">
                <DifferenceIcon size={20} />
                <span className="text-sm font-medium">
                  {difference > 0 ? 'Sobra em caixa' : 'Falta em caixa'}
                </span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(Math.abs(difference))}
              </p>
              <p className="mt-1 text-xs opacity-80">
                {difference > 0
                  ? 'O caixa tem mais dinheiro do que o esperado'
                  : 'O caixa tem menos dinheiro do que o esperado'}
              </p>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              Observações {hasDifference && '*'}
            </label>
            <textarea
              value={formData.observations}
              onChange={e => handleChange('observations', e.target.value)}
              placeholder={
                hasDifference
                  ? 'Explique o motivo da diferença no caixa (obrigatório)'
                  : 'Observações sobre o fechamento do caixa (opcional)'
              }
              rows={4}
              disabled={loading}
              required={hasDifference}
              className="border-theme-border card-theme text-theme-primary placeholder-theme-muted focus:ring-primary-500 w-full resize-none rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-surface"
            />
            <p className="text-theme-muted mt-1 text-xs">
              {formData.observations.length}/500 caracteres
            </p>
          </div>

          {/* Erro de validação */}
          {errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.form}
              </p>
            </div>
          )}

          {/* Alerta */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Atenção:</strong> Após o fechamento, não será possível
              criar novas comandas neste caixa.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={loading || !formData.closingBalance}
              className="flex-1"
            >
              {loading ? 'Fechando...' : 'Fechar Caixa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
CloseCashModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback para fechar modal */
  onClose: PropTypes.func.isRequired,
  /** Callback ao confirmar fechamento */
  onConfirm: PropTypes.func.isRequired,
  /** Dados do caixa */
  cashRegister: PropTypes.shape({
    id: PropTypes.string,
    opening_balance: PropTypes.number,
  }),
  /** Saldo esperado calculado */
  expectedBalance: PropTypes.number,
  /** Estado de loading */
  loading: PropTypes.bool,
};
export default CloseCashModal;
