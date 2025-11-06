/**
 * @file OpenCashModal.jsx
 * @description Modal para abertura de caixa
 * @module Components/Templates/Modals
 * @author Andrey Viana
 * @date 2025-10-24
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, DollarSign } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import { Input } from '../../../atoms/Input/Input';
import { formatCurrency } from '../../../utils/formatters';

/**
 * Modal para abrir caixa
 * Segue padrões do Design System
 */
const OpenCashModal = ({
  isOpen,
  onClose,
  onConfirm,
  unitId,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    openingBalance: '',
    observations: '',
  });
  const [errors, setErrors] = useState({});
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Limpa erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    console.log('📝 OpenCashModal - handleSubmit CHAMADO', {
      formData,
      unitId,
    });

    // ✅ Validação simples (só os campos do form)
    const openingBalance = parseFloat(formData.openingBalance) || 0;
    if (openingBalance < 0) {
      setErrors({
        form: 'Saldo inicial não pode ser negativo',
      });
      return;
    }
    if (!unitId) {
      setErrors({
        form: 'Unidade não identificada',
      });
      return;
    }
    const dataToSend = {
      openingBalance,
      observations: formData.observations || '',
    };
    console.log('🚀 Chamando onConfirm com:', dataToSend);

    // Chama callback de confirmação (a página vai adicionar unitId e openedBy)
    await onConfirm(dataToSend);

    // Reseta form
    setFormData({
      openingBalance: '',
      observations: '',
    });
    setErrors({});
  };
  const handleClose = () => {
    if (!loading) {
      setFormData({
        openingBalance: '',
        observations: '',
      });
      setErrors({});
      onClose();
    }
  };
  if (!isOpen) return null;
  const openingBalanceNumber = parseFloat(formData.openingBalance) || 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card-theme max-h-[90vh] w-full max-w-md overflow-y-auto">
        {/* Header */}
        <div className="border-theme-border flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-theme-primary text-xl font-bold">
              Abrir Caixa
            </h2>
            <p className="text-theme-muted mt-1 text-sm">
              Informe o saldo inicial do caixa
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
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              Saldo Inicial *
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <DollarSign size={18} className="text-theme-muted" />
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.openingBalance}
                onChange={e => handleChange('openingBalance', e.target.value)}
                placeholder="0,00"
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
            {openingBalanceNumber > 0 && (
              <p className="text-theme-muted mt-1 text-xs">
                {formatCurrency(openingBalanceNumber)}
              </p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              Observações
            </label>
            <textarea
              value={formData.observations}
              onChange={e => handleChange('observations', e.target.value)}
              placeholder="Observações sobre a abertura do caixa (opcional)"
              rows={4}
              disabled={loading}
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

          {/* Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Atenção:</strong> Certifique-se de contar o dinheiro em
              caixa antes de abrir. Apenas um caixa pode estar aberto por vez.
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
              variant="primary"
              disabled={loading || !formData.openingBalance}
              className="flex-1"
            >
              {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
OpenCashModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback para fechar modal */
  onClose: PropTypes.func.isRequired,
  /** Callback ao confirmar abertura */
  onConfirm: PropTypes.func.isRequired,
  /** ID da unidade */
  unitId: PropTypes.string.isRequired,
  /** Estado de loading */
  loading: PropTypes.bool,
};
export default OpenCashModal;
