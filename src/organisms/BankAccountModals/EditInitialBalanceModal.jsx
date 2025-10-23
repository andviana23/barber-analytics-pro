import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  AlertCircle,
  Save,
  Edit3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { bankAccountsService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Modal para editar saldo inicial de conta bancária
 * Registra log de auditoria com motivo da alteração
 */
const EditInitialBalanceModal = ({ isOpen, onClose, onSuccess, account }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    newBalance: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Atualizar formulário quando a conta mudar
  useEffect(() => {
    if (account && isOpen) {
      setFormData({
        newBalance: account.initial_balance?.toString() || '0',
        reason: '',
      });
      setError(null);
    }
  }, [account, isOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!account) {
      setError('Conta bancária não encontrada');
      return;
    }

    // Validações
    const newBalanceValue = parseFloat(formData.newBalance);

    if (isNaN(newBalanceValue)) {
      setError('Digite um valor válido para o saldo inicial');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Digite o motivo da alteração do saldo inicial');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Chamar o service para atualizar saldo inicial
      const { data, error: updateError } =
        await bankAccountsService.updateInitialBalance(
          account.id,
          newBalanceValue,
          user?.id,
          formData.reason.trim()
        );

      if (updateError) {
        throw new Error(updateError);
      }

      showToast(
        'Saldo inicial atualizado com sucesso! Os saldos foram recalculados.',
        'success'
      );

      // Resetar formulário
      setFormData({
        newBalance: '',
        reason: '',
      });

      // Callback de sucesso
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      console.error('Erro ao atualizar saldo inicial:', err);
      setError(err.message || 'Erro ao atualizar saldo inicial');
      showToast('Erro ao atualizar saldo inicial: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        newBalance: '',
        reason: '',
      });
      setError(null);
      onClose();
    }
  };

  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  if (!isOpen || !account) return null;

  const oldBalance = parseFloat(account.initial_balance) || 0;
  const newBalance = parseFloat(formData.newBalance) || 0;
  const difference = newBalance - oldBalance;
  const isIncrease = difference > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Editar Saldo Inicial
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {account.name} - {account.bank_name || account.bank}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info Atual */}
          <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
              Saldo Inicial Atual
            </p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(oldBalance)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Novo Saldo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Novo Saldo Inicial *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  name="newBalance"
                  value={formData.newBalance}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0,00"
                  className="pl-11 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Digite o valor correto do saldo inicial da conta
              </p>
            </div>

            {/* Preview da Diferença */}
            {difference !== 0 && !isNaN(difference) && (
              <div
                className={`p-4 rounded-xl border ${
                  isIncrease
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {isIncrease ? (
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        isIncrease
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isIncrease ? 'Aumento' : 'Redução'} de:
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        isIncrease
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {formatCurrency(Math.abs(difference))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Motivo da Alteração *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                placeholder="Ex: Ajuste de saldo para conciliação bancária, correção de valor inicial, etc."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                required
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Informe o motivo desta alteração para fins de auditoria
              </p>
            </div>

            {/* Aviso */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                    Atenção
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Esta alteração será registrada no histórico de auditoria e
                    recalculará automaticamente o <strong>Saldo Atual</strong> e
                    o <strong>Saldo Disponível</strong> da conta.
                  </p>
                </div>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  !formData.reason.trim() ||
                  isNaN(parseFloat(formData.newBalance))
                }
                className="inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alteração
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditInitialBalanceModal;
