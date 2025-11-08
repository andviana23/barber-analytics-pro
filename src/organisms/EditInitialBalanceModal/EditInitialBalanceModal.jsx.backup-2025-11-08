import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  DollarSign,
  Edit3,
  Info,
  Save,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { balanceAdjustmentService } from '../../services';
import { formatCurrency } from '../../utils/formatters';

/**
 * Modal para editar saldo inicial do mês
 *
 * Permite ajustar o saldo inicial de um período específico.
 * O ajuste é registrado separadamente e não afeta receitas/despesas.
 */
const EditInitialBalanceModal = ({
  isOpen,
  onClose,
  onSuccess,
  unitId,
  period,
  currentBalance = 0,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    amount: 0,
    reason: '',
    originalBalance: currentBalance,
    adjustedBalance: currentBalance,
  });
  const [existingAdjustment, setExistingAdjustment] = useState(null);

  // Carregar ajuste existente quando modal abrir
  useEffect(() => {
    if (isOpen && unitId && period) {
      loadExistingAdjustment();
    }
  }, [isOpen, unitId, period]);

  // Calcular saldo ajustado quando amount muda
  useEffect(() => {
    const newAdjustedBalance =
      adjustmentData.originalBalance + adjustmentData.amount;
    setAdjustmentData(prev => ({
      ...prev,
      adjustedBalance: newAdjustedBalance,
    }));
  }, [adjustmentData.amount, adjustmentData.originalBalance]);

  const loadExistingAdjustment = async () => {
    try {
      setLoading(true);

      // Buscar saldo ajustado atual
      const { data: balanceData, error } =
        await balanceAdjustmentService.getAdjustedInitialBalance(
          unitId,
          period
        );

      if (error) {
        throw new Error(error);
      }

      if (balanceData) {
        setAdjustmentData({
          amount: balanceData.adjustment || 0,
          reason: '',
          originalBalance: balanceData.originalBalance || 0,
          adjustedBalance: balanceData.adjustedBalance || 0,
        });

        // Buscar dados do ajuste para pegar o motivo
        const { data: adjustment } =
          await balanceAdjustmentService.getBalanceAdjustment(unitId, period);

        if (adjustment) {
          setExistingAdjustment(adjustment);
          setAdjustmentData(prev => ({
            ...prev,
            reason: adjustment.reason || '',
          }));
        }
      } else {
        // Não há ajuste, usar dados atuais
        setAdjustmentData({
          amount: 0,
          reason: '',
          originalBalance: currentBalance,
          adjustedBalance: currentBalance,
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível carregar os dados do ajuste',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = e => {
    const value = Number.parseFloat(e.target.value) || 0;
    setAdjustmentData(prev => ({
      ...prev,
      amount: value,
    }));
  };

  const handleReasonChange = e => {
    setAdjustmentData(prev => ({
      ...prev,
      reason: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!adjustmentData.reason.trim()) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Por favor, informe o motivo do ajuste',
      });
      return;
    }

    try {
      setSaving(true);

      const { data, error } =
        await balanceAdjustmentService.createOrUpdateBalanceAdjustment(
          unitId,
          period,
          adjustmentData.amount,
          adjustmentData.reason,
          user.id
        );

      if (error) {
        throw new Error(error);
      }

      showToast({
        type: 'success',
        title: 'Sucesso',
        message: existingAdjustment
          ? 'Ajuste atualizado com sucesso!'
          : 'Ajuste criado com sucesso!',
      });

      if (onSuccess) {
        onSuccess(data);
      }

      onClose();
    } catch {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível salvar o ajuste',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setAdjustmentData({
      amount: 0,
      reason: '',
      originalBalance: currentBalance,
      adjustedBalance: currentBalance,
    });
    setExistingAdjustment(null);
    onClose();
  };

  if (!isOpen) return null;

  const periodFormatted = format(new Date(`${period}-01`), 'MMMM yyyy', {
    locale: ptBR,
  });
  const adjustmentDifference =
    adjustmentData.adjustedBalance - adjustmentData.originalBalance;
  const isIncrease = adjustmentDifference > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card-theme w-full max-w-lg rounded-xl border border-light-border p-0 shadow-xl dark:border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <Edit3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-theme-primary text-lg font-semibold">
                Ajustar Saldo Inicial
              </h3>
              <p className="text-theme-secondary text-sm">{periodFormatted}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-theme-secondary rounded-lg p-2 hover:bg-light-hover dark:hover:bg-dark-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* Saldos */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Saldo Original */}
                  <div className="rounded-lg border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="text-theme-secondary h-4 w-4" />
                      <span className="text-theme-secondary text-xs font-semibold uppercase tracking-wide">
                        Saldo Original
                      </span>
                    </div>
                    <p className="text-theme-primary mt-2 text-lg font-bold">
                      {formatCurrency(adjustmentData.originalBalance)}
                    </p>
                  </div>

                  {/* Saldo Ajustado */}
                  <div className="rounded-lg border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Saldo Ajustado
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-primary">
                      {formatCurrency(adjustmentData.adjustedBalance)}
                    </p>
                  </div>
                </div>

                {/* Diferença */}
                {adjustmentDifference !== 0 && (
                  <div
                    className={`rounded-lg border p-4 ${
                      isIncrease
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isIncrease ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          isIncrease
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isIncrease ? 'Aumento' : 'Redução'}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-lg font-bold ${
                        isIncrease
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {formatCurrency(Math.abs(adjustmentDifference))}
                    </p>
                  </div>
                )}
              </div>

              {/* Formulário */}
              <div className="space-y-4">
                {/* Valor do Ajuste */}
                <div>
                  <label
                    htmlFor="adjustment-amount"
                    className="text-theme-primary mb-2 block text-sm font-medium"
                  >
                    Valor do Ajuste
                  </label>
                  <input
                    id="adjustment-amount"
                    type="number"
                    step="0.01"
                    value={adjustmentData.amount}
                    onChange={handleAmountChange}
                    className="input-theme w-full"
                    placeholder="Digite o valor (positivo para aumento, negativo para redução)"
                  />
                  <p className="text-theme-secondary mt-1 text-xs">
                    Use valores positivos para aumentar o saldo e negativos para
                    reduzir
                  </p>
                </div>

                {/* Motivo */}
                <div>
                  <label
                    htmlFor="adjustment-reason"
                    className="text-theme-primary mb-2 block text-sm font-medium"
                  >
                    Motivo do Ajuste *
                  </label>
                  <textarea
                    id="adjustment-reason"
                    value={adjustmentData.reason}
                    onChange={handleReasonChange}
                    className="input-theme w-full"
                    rows={3}
                    placeholder="Descreva o motivo do ajuste (obrigatório)"
                    required
                  />
                </div>
              </div>

              {/* Aviso */}
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <div className="flex items-start space-x-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Importante:</p>
                    <p className="mt-1">
                      Este ajuste será aplicado apenas ao saldo inicial e não
                      afetará receitas ou despesas. O novo saldo será usado como
                      base para todos os cálculos do período.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="flex justify-end space-x-3 border-t border-light-border p-6 dark:border-dark-border">
            <button
              onClick={handleClose}
              className="btn-theme-secondary"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !adjustmentData.reason.trim()}
              className="btn-theme-primary flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>
                    {existingAdjustment ? 'Atualizar' : 'Salvar'} Ajuste
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

EditInitialBalanceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  unitId: PropTypes.string.isRequired,
  period: PropTypes.string.isRequired, // Formato YYYY-MM
  currentBalance: PropTypes.number,
};

EditInitialBalanceModal.defaultProps = {
  onSuccess: null,
  currentBalance: 0,
};

export default EditInitialBalanceModal;
