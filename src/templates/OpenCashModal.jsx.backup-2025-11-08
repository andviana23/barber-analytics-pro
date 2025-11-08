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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Coluna Esquerda - Inputs */}
          <div className="space-y-6">
            {/* Alerta informativo - Compacto e claro */}
            <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/5 from-primary/5 to-transparent p-5 dark:bg-primary/10 dark:from-primary/10">
              <div className="absolute left-0 top-0 h-full w-1 bg-primary"></div>
              <div className="ml-1 flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-theme-primary mb-3 text-sm font-semibold">
                    Informações Importantes
                  </h4>
                  <ul className="space-y-2">
                    <li className="text-theme-secondary flex items-start gap-2 text-xs leading-relaxed">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary"></span>
                      <span className="flex-1">
                        Confira o saldo inicial antes de abrir o caixa
                      </span>
                    </li>
                    <li className="text-theme-secondary flex items-start gap-2 text-xs leading-relaxed">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary"></span>
                      <span className="flex-1">
                        O caixa ficará aberto até o fechamento manual
                      </span>
                    </li>
                    <li className="text-theme-secondary flex items-start gap-2 text-xs leading-relaxed">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary"></span>
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
              <label className="text-theme-primary block text-sm font-semibold">
                Observações
                <span className="text-theme-secondary ml-2 text-xs font-normal">
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
              <div className="flex items-center justify-between text-xs">
                <p className="text-theme-secondary italic">
                  Informações adicionais sobre o caixa
                </p>
                <p className="text-theme-secondary font-semibold tabular-nums">
                  {observations.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Resumo */}
          <div className="space-y-6">
            {/* Card de Resumo - Compacto e visual */}
            <div className="card-theme rounded-xl border-2 border-primary/20 bg-primary/5 from-primary/5 to-transparent p-6 shadow-lg dark:bg-primary/10 dark:from-primary/10">
              {/* Header */}
              <div className="mb-6 flex items-center gap-3 border-b border-primary/20 pb-5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                  <CheckCircle className="text-dark-text-primary h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-theme-primary text-base font-bold">
                    Resumo da Abertura
                  </h4>
                  <p className="text-theme-secondary mt-0.5 text-xs">
                    Confira os dados antes de confirmar
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Saldo Inicial - Grande destaque */}
                <div className="card-theme rounded-lg border border-light-border p-5 dark:border-dark-border">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-theme-secondary text-xs font-bold uppercase tracking-wide">
                      Saldo Inicial
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 dark:bg-primary/20">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-black tracking-tight text-primary">
                    R$ {openingBalance.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                {/* Data e Hora */}
                <div className="card-theme rounded-lg border border-light-border p-4 dark:border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 dark:bg-primary/20">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
                        Data/Hora de Abertura
                      </p>
                      <p className="text-theme-primary truncate text-sm font-bold">
                        {new Date().toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="rounded-lg border border-feedback-light-success/30 bg-feedback-light-success/10 from-feedback-light-success/10 to-feedback-light-success/5 p-4 dark:border-feedback-dark-success/30 dark:bg-feedback-dark-success/10 dark:from-feedback-dark-success/10 dark:to-feedback-dark-success/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-feedback-light-success/20 dark:bg-feedback-dark-success/20">
                      <Clock className="h-4 w-4 text-feedback-light-success dark:text-feedback-dark-success" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
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
            <div className="flex items-start gap-3 rounded-lg border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-hover">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <p className="text-theme-secondary text-xs leading-relaxed">
                Após abrir o caixa, você poderá registrar todas as movimentações
                financeiras. O fechamento pode ser feito ao final do expediente.
              </p>
            </div>
          </div>
        </div>

        {/* Ações - Footer responsivo */}
        <div className="flex flex-col gap-3 border-t-2 border-light-border pt-6 dark:border-dark-border sm:flex-row">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn-theme-secondary w-full rounded-lg px-6 py-3.5 text-base font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-theme-primary inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-base font-semibold shadow-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                <span>Abrindo Caixa...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
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
