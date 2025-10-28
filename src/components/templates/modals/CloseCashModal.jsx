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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
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
      setErrors({ form: validation.error });
      return;
    }

    // Chama callback de confirmação
    await onConfirm(validation.data);

    // Reseta form
    setFormData({ closingBalance: '', observations: '' });
    setErrors({});
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ closingBalance: '', observations: '' });
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
        : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card-theme w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <div>
            <h2 className="text-xl font-bold text-theme-primary">
              Fechar Caixa
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              Informe o saldo final para fechamento
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X size={20} className="text-theme-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Saldo Inicial */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-theme-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-theme-muted">
                Saldo Inicial:
              </span>
              <span className="text-base font-semibold text-theme-primary">
                {formatCurrency(cashRegister.opening_balance || 0)}
              </span>
            </div>
          </div>

          {/* Saldo Esperado */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Saldo Esperado:
              </span>
              <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {formatCurrency(expectedBalance || 0)}
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
              Calculado com base nas movimentações registradas
            </p>
          </div>

          {/* Saldo Informado */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Saldo em Caixa (Contado) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
              <p className="text-xs text-theme-muted mt-1">
                {formatCurrency(closingBalanceNumber)}
              </p>
            )}
          </div>

          {/* Diferença */}
          {hasDifference && formData.closingBalance && (
            <div className={`p-4 rounded-lg border ${differenceColor}`}>
              <div className="flex items-center gap-2 mb-1">
                <DifferenceIcon size={20} />
                <span className="text-sm font-medium">
                  {difference > 0 ? 'Sobra em caixa' : 'Falta em caixa'}
                </span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(Math.abs(difference))}
              </p>
              <p className="text-xs mt-1 opacity-80">
                {difference > 0
                  ? 'O caixa tem mais dinheiro do que o esperado'
                  : 'O caixa tem menos dinheiro do que o esperado'}
              </p>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
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
              className="
                w-full
                px-4
                py-2
                rounded-lg
                border
                border-theme-border
                bg-white
                dark:bg-gray-800
                text-theme-primary
                placeholder-theme-muted
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500
                disabled:opacity-50
                disabled:cursor-not-allowed
                resize-none
              "
            />
            <p className="text-xs text-theme-muted mt-1">
              {formData.observations.length}/500 caracteres
            </p>
          </div>

          {/* Erro de validação */}
          {errors.form && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.form}
              </p>
            </div>
          )}

          {/* Alerta */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
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
