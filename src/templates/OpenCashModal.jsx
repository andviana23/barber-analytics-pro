import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Info, CheckCircle, Calendar, DollarSign, Clock } from 'lucide-react';
import Modal from '../atoms/Modal';
import CurrencyInput from '../atoms/CurrencyInput';

/**
 * OpenCashModal - Modal para abertura de caixa
 *
 * Template modal que permite abrir o caixa informando saldo inicial e observações.
 * Valida valores e confirma operação.
 * Refatorado 100% seguindo Design System (28/10/2025)
 * Layout 2 colunas com todas informações visíveis
 *
 * @component
 * @example
 * ```jsx
 * <OpenCashModal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   onConfirm={handleOpenCash}
 *   loading={isSubmitting}
 * />
 * ```
 */
const OpenCashModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  minBalance = 0,
  suggestedBalance = 0,
}) => {
  const [openingBalance, setOpeningBalance] = useState(suggestedBalance || 0);
  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState({});

  const handleReset = () => {
    setOpeningBalance(suggestedBalance || 0);
    setObservations('');
    setErrors({});
  };

  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };

  const validate = () => {
    const newErrors = {};

    if (openingBalance < minBalance) {
      newErrors.openingBalance = `Saldo mínimo: R$ ${minBalance.toFixed(2)}`;
    }

    if (openingBalance > 100000) {
      newErrors.openingBalance = 'Saldo inicial muito alto. Verifique o valor.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();

    console.log('🎯 OpenCashModal - handleSubmit DISPARADO!', {
      openingBalance,
      observations,
      errors,
    });

    if (!validate()) {
      console.log('❌ Validação falhou:', errors);
      return;
    }

    console.log('✅ Validação passou, chamando onConfirm...');

    if (onConfirm) {
      const data = {
        opening_balance: openingBalance,
        observations: observations.trim() || null,
      };

      console.log('📤 Enviando dados:', data);
      onConfirm(data);
    } else {
      console.error('⚠️ onConfirm não está definido!');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Abrir Caixa"
      maxWidth="5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Grid Responsivo - 2 colunas em desktop, 1 em mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Coluna Esquerda - Inputs */}
          <div className="space-y-6">
            {/* Alerta informativo - Compacto e claro */}
            <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 p-5">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="flex items-start gap-4 ml-1">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-theme-primary mb-3 text-sm">
                    Informações Importantes
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-xs text-theme-secondary leading-relaxed">
                      <span className="flex-shrink-0 w-1 h-1 rounded-full bg-primary mt-1.5"></span>
                      <span className="flex-1">
                        Confira o saldo inicial antes de abrir o caixa
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-theme-secondary leading-relaxed">
                      <span className="flex-shrink-0 w-1 h-1 rounded-full bg-primary mt-1.5"></span>
                      <span className="flex-1">
                        O caixa ficará aberto até o fechamento manual
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-theme-secondary leading-relaxed">
                      <span className="flex-shrink-0 w-1 h-1 rounded-full bg-primary mt-1.5"></span>
                      <span className="flex-1">
                        Apenas um caixa pode estar aberto por vez
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Saldo Inicial - Destaque com ícone */}
            <div className="space-y-2">
              <CurrencyInput
                label="Saldo Inicial"
                value={openingBalance}
                onChange={setOpeningBalance}
                min={minBalance}
                max={100000}
                error={errors.openingBalance}
                required
                placeholder="0,00"
                helperText="Valor entre R$ 0,00 e R$ 100.000,00"
              />
            </div>

            {/* Observações - Compacto */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-theme-primary">
                Observações
                <span className="text-theme-secondary font-normal text-xs ml-2">
                  (opcional)
                </span>
              </label>
              <textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                disabled={loading}
                rows={4}
                maxLength={500}
                placeholder="Ex: Troco preparado, notas disponíveis, etc."
                className="input-theme w-full resize-none text-sm leading-relaxed"
              />
              <div className="flex justify-between items-center text-xs">
                <p className="text-theme-secondary italic">
                  Informações adicionais sobre o caixa
                </p>
                <p className="font-semibold text-theme-secondary tabular-nums">
                  {observations.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Resumo */}
          <div className="space-y-6">
            {/* Card de Resumo - Compacto e visual */}
            <div className="card-theme rounded-xl p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 shadow-lg">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-primary/20">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-theme-primary text-base">
                    Resumo da Abertura
                  </h4>
                  <p className="text-xs text-theme-secondary mt-0.5">
                    Confira os dados antes de confirmar
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Saldo Inicial - Grande destaque */}
                <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-5 border border-light-border dark:border-dark-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-theme-secondary uppercase tracking-wide">
                      Saldo Inicial
                    </span>
                    <div className="w-8 h-8 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-primary tracking-tight">
                    R$ {openingBalance.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                {/* Data e Hora */}
                <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-4 border border-light-border dark:border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
                        Data/Hora de Abertura
                      </p>
                      <p className="text-sm font-bold text-theme-primary truncate">
                        {new Date().toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gradient-to-r from-feedback-light-success/10 to-feedback-light-success/5 dark:from-feedback-dark-success/10 dark:to-feedback-dark-success/5 rounded-lg p-4 border border-feedback-light-success/30 dark:border-feedback-dark-success/30">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-md bg-feedback-light-success/20 dark:bg-feedback-dark-success/20 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-feedback-light-success dark:text-feedback-dark-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
                        Status Após Abertura
                      </p>
                      <p className="text-sm font-bold text-feedback-light-success dark:text-feedback-dark-success">
                        Caixa Aberto
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informação adicional */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-light-bg dark:bg-dark-hover border border-light-border dark:border-dark-border">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-theme-secondary leading-relaxed">
                Após abrir o caixa, você poderá registrar todas as movimentações
                financeiras. O fechamento pode ser feito ao final do expediente.
              </p>
            </div>
          </div>
        </div>

        {/* Ações - Footer responsivo */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-light-border dark:border-dark-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn-theme-secondary w-full sm:flex-1 px-6 py-3.5 rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-theme-primary w-full sm:flex-1 px-6 py-3.5 rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Abrindo Caixa...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Abrir Caixa</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

OpenCashModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback ao fechar */
  onClose: PropTypes.func.isRequired,
  /** Callback ao confirmar abertura */
  onConfirm: PropTypes.func.isRequired,
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** Saldo mínimo permitido */
  minBalance: PropTypes.number,
  /** Saldo sugerido (último fechamento) */
  suggestedBalance: PropTypes.number,
};

export default OpenCashModal;
