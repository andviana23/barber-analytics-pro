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

    if (!validate()) return;

    if (onConfirm) {
      onConfirm({
        opening_balance: openingBalance,
        observations: observations.trim() || null,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Abrir Caixa"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit}>
        {/* Grid com 2 colunas - Layout Premium */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 px-2">
          {/* Coluna Esquerda - Inputs (3/5) */}
          <div className="lg:col-span-3 space-y-10">
            {/* Alerta informativo - Melhorado */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent dark:from-primary/10 dark:via-primary/5 p-10">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
              <div className="flex items-start gap-7 ml-2">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shadow-sm">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-theme-primary mb-4 text-base tracking-tight">
                    Informações Importantes
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-theme-secondary leading-relaxed">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                      <span className="flex-1">
                        Confira o saldo inicial antes de abrir o caixa
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-theme-secondary leading-relaxed">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                      <span className="flex-1">
                        O caixa ficará aberto até o fechamento manual
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-theme-secondary leading-relaxed">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                      <span className="flex-1">
                        Apenas um caixa pode estar aberto por vez
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Saldo Inicial - Premium */}
            <div className="space-y-4">
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

            {/* Observações - Melhorado */}
            <div className="space-y-4">
              <label className="flex items-center justify-between text-sm font-semibold text-theme-primary">
                <span className="flex items-baseline gap-2">
                  Observações
                  <span className="text-theme-secondary font-normal text-xs">
                    (opcional)
                  </span>
                </span>
              </label>
              <textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                disabled={loading}
                rows={6}
                maxLength={500}
                placeholder="Ex: Troco preparado, notas disponíveis, etc."
                className="input-theme w-full resize-none text-sm leading-relaxed px-6 py-5"
              />
              <div className="flex justify-between items-center mt-3.5 px-1">
                <p className="text-xs text-theme-secondary italic leading-relaxed">
                  Informações adicionais sobre o caixa
                </p>
                <p className="text-xs font-semibold text-theme-secondary tabular-nums">
                  {observations.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Resumo (2/5) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Card de Resumo - Premium */}
            <div className="sticky top-6 space-y-10">
              <div className="card-theme rounded-2xl p-10 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent dark:from-primary/10 dark:via-primary/5 shadow-xl">
                {/* Header do Resumo */}
                <div className="flex items-center gap-6 mb-10 pb-8 border-b-2 border-primary/20">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-theme-primary text-lg leading-tight tracking-tight">
                      Resumo da Abertura
                    </h4>
                    <p className="text-xs text-theme-secondary mt-1 leading-relaxed">
                      Confira os dados antes de confirmar
                    </p>
                  </div>
                </div>

                <div className="space-y-7">
                  {/* Saldo Inicial - Destaque */}
                  <div className="bg-light-surface dark:bg-dark-surface rounded-xl p-9 border-2 border-light-border dark:border-dark-border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider">
                        Saldo Inicial
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shadow-sm">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-4xl font-black text-primary tracking-tight leading-none">
                      R$ {openingBalance.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Data e Hora */}
                  <div className="bg-light-surface dark:bg-dark-surface rounded-xl p-7 border border-light-border dark:border-dark-border">
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1.5">
                          Data/Hora de Abertura
                        </p>
                        <p className="text-sm font-bold text-theme-primary truncate leading-tight">
                          {new Date().toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-gradient-to-r from-feedback-light-success/10 to-feedback-light-success/5 dark:from-feedback-dark-success/10 dark:to-feedback-dark-success/5 rounded-xl p-7 border border-feedback-light-success/30 dark:border-feedback-dark-success/30">
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-feedback-light-success/20 dark:bg-feedback-dark-success/20 flex items-center justify-center shadow-sm">
                        <Clock className="w-5 h-5 text-feedback-light-success dark:text-feedback-dark-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1.5">
                          Status Após Abertura
                        </p>
                        <p className="text-sm font-bold text-feedback-light-success dark:text-feedback-dark-success leading-tight">
                          Caixa Aberto
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informação adicional */}
              <div className="flex items-start gap-6 p-7 rounded-xl bg-light-bg dark:bg-dark-hover border border-light-border dark:border-dark-border">
                <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-theme-secondary leading-relaxed">
                  Após abrir o caixa, você poderá registrar todas as
                  movimentações financeiras. O fechamento pode ser feito ao
                  final do expediente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações - Footer Premium */}
        <div className="flex gap-6 pt-14 mt-14 border-t-2 border-light-border dark:border-dark-border px-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn-theme-secondary flex-1 px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-theme-primary flex-1 px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Abrindo Caixa...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
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
