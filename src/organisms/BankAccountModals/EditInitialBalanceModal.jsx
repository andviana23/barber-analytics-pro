import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, Save, Edit3, TrendingUp, TrendingDown } from 'lucide-react';
import { bankAccountsService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Modal para editar saldo inicial de conta bancária
 * Registra log de auditoria com motivo da alteração
 */
const EditInitialBalanceModal = ({
  isOpen,
  onClose,
  onSuccess,
  account
}) => {
  const {
    user
  } = useAuth();
  const {
    showToast
  } = useToast();
  const [formData, setFormData] = useState({
    newBalance: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Atualizar formulário quando a conta mudar
  useEffect(() => {
    if (account && isOpen) {
      setFormData({
        newBalance: account.initial_balance?.toString() || '0',
        reason: ''
      });
      setError(null);
    }
  }, [account, isOpen]);
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const {
        data,
        error: updateError
      } = await bankAccountsService.updateInitialBalance(account.id, newBalanceValue, user?.id, formData.reason.trim());
      if (updateError) {
        throw new Error(updateError);
      }
      showToast('Saldo inicial atualizado com sucesso! Os saldos foram recalculados.', 'success');

      // Resetar formulário
      setFormData({
        newBalance: '',
        reason: ''
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
        reason: ''
      });
      setError(null);
      onClose();
    }
  };
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };
  if (!isOpen || !account) return null;
  const oldBalance = parseFloat(account.initial_balance) || 0;
  const newBalance = parseFloat(formData.newBalance) || 0;
  const difference = newBalance - oldBalance;
  const isIncrease = difference > 0;
  return <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card-theme relative w-full max-w-2xl transform rounded-2xl p-6 shadow-2xl transition-all dark:bg-dark-surface">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-light-border pb-4 dark:border-dark-border">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-blue-500 p-3 dark:bg-indigo-600">
                <Edit3 className="text-dark-text-primary h-6 w-6" />
              </div>
              <div>
                <h2 className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
                  Editar Saldo Inicial
                </h2>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-0.5 text-sm">
                  {account.name} - {account.bank_name || account.bank}
                </p>
              </div>
            </div>
            <button onClick={handleClose} disabled={loading} className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme rounded-lg p-2 transition-colors dark:text-theme-secondary dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Info Atual */}
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-900/20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Saldo Inicial Atual
            </p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(oldBalance)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Novo Saldo */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                Novo Saldo Inicial *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <DollarSign className="text-light-text-muted dark:text-dark-text-muted h-5 w-5" />
                </div>
                <input type="number" step="0.01" name="newBalance" value={formData.newBalance} onChange={handleChange} disabled={loading} placeholder="0,00" className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-xl border border-light-border px-4 py-3 pl-11 text-lg font-semibold placeholder-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700" required />
              </div>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1.5 text-xs">
                Digite o valor correto do saldo inicial da conta
              </p>
            </div>

            {/* Preview da Diferença */}
            {difference !== 0 && !isNaN(difference) && <div className={`rounded-xl border p-4 ${isIncrease ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}>
                <div className="flex items-center space-x-3">
                  {isIncrease ? <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /> : <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isIncrease ? 'Aumento' : 'Redução'} de:
                    </p>
                    <p className={`text-lg font-bold ${isIncrease ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {formatCurrency(Math.abs(difference))}
                    </p>
                  </div>
                </div>
              </div>}

            {/* Motivo */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                Motivo da Alteração *
              </label>
              <textarea name="reason" value={formData.reason} onChange={handleChange} disabled={loading} rows={4} placeholder="Ex: Ajuste de saldo para conciliação bancária, correção de valor inicial, etc." className="card-theme text-theme-primary dark:text-dark-text-primary w-full resize-none rounded-xl border border-light-border px-4 py-3 placeholder-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700" required />
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1.5 text-xs">
                Informe o motivo desta alteração para fins de auditoria
              </p>
            </div>

            {/* Aviso */}
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start space-x-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="mb-1 text-sm font-semibold text-yellow-800 dark:text-yellow-300">
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
            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>}

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3 border-t border-light-border pt-4 dark:border-dark-border">
              <button type="button" onClick={handleClose} disabled={loading} className="card-theme rounded-xl border border-light-border px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600 transition-colors hover:bg-light-bg disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700 dark:text-theme-secondary dark:hover:bg-gray-600">
                Cancelar
              </button>
              <button type="submit" disabled={loading || !formData.reason.trim() || isNaN(parseFloat(formData.newBalance))} className="text-dark-text-primary inline-flex items-center rounded-xl bg-gradient-primary px-6 py-2.5 text-sm font-semibold shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-light-surface dark:border-dark-surface"></div>
                    Salvando...
                  </> : <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alteração
                  </>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>;
};
export default EditInitialBalanceModal;