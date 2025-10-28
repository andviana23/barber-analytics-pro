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
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpa erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
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
      setErrors({ form: 'Saldo inicial não pode ser negativo' });
      return;
    }

    if (!unitId) {
      setErrors({ form: 'Unidade não identificada' });
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
    setFormData({ openingBalance: '', observations: '' });
    setErrors({});
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ openingBalance: '', observations: '' });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  const openingBalanceNumber = parseFloat(formData.openingBalance) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card-theme w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <div>
            <h2 className="text-xl font-bold text-theme-primary">
              Abrir Caixa
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              Informe o saldo inicial do caixa
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
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Saldo Inicial *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
              <p className="text-xs text-theme-muted mt-1">
                {formatCurrency(openingBalanceNumber)}
              </p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Observações
            </label>
            <textarea
              value={formData.observations}
              onChange={e => handleChange('observations', e.target.value)}
              placeholder="Observações sobre a abertura do caixa (opcional)"
              rows={4}
              disabled={loading}
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

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
