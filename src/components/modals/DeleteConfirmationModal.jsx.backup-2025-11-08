import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';

/**
 * Modal de confirmação para exclusão de despesas com lógica de recorrência
 */
const DeleteConfirmationModal = ({ expense, isOpen, onClose, onDelete }) => {
  const [deleteType, setDeleteType] = useState('single'); // 'single' ou 'series'
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const handleDelete = async () => {
    if (!expense) return;
    try {
      setLoading(true);
      if (expense.is_recurring && deleteType === 'series') {
        // Deletar todas as despesas da série recorrente
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('recurring_series_id', expense.recurring_series_id);
        if (error) throw error;
        showToast({
          type: 'success',
          message: 'Série de despesas recorrentes excluída com sucesso!',
        });
      } else {
        // Deletar apenas esta despesa
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expense.id);
        if (error) throw error;
        showToast({
          type: 'success',
          message: 'Despesa excluída com sucesso!',
        });
      }
      onDelete();
      onClose();
    } catch (error) {
      console.error('❌ Erro ao excluir despesa:', error);
      showToast({
        type: 'error',
        message: 'Erro ao excluir despesa',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen || !expense) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="card-theme mx-4 w-full max-w-md rounded-lg p-6 dark:bg-dark-surface">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Confirmar Exclusão
          </h3>
          <button
            onClick={onClose}
            className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary dark:hover:text-theme-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          {/* Informações da Despesa */}
          <div className="rounded-md bg-light-bg p-4 dark:bg-dark-bg">
            <div className="flex items-start space-x-3">
              <DollarSign className="text-light-text-muted dark:text-dark-text-muted mt-1 h-5 w-5" />
              <div>
                <p className="text-theme-primary dark:text-dark-text-primary font-medium">
                  {expense.description || 'Sem descrição'}
                </p>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  {expense.value?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }) || 'R$ 0,00'}
                </p>
                {expense.expected_payment_date && (
                  <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                    Vencimento:{' '}
                    {new Date(expense.expected_payment_date).toLocaleDateString(
                      'pt-BR'
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Aviso de Recorrência */}
          {expense.is_recurring && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="mt-1 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                    Despesa Recorrente Detectada
                  </h4>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                    Esta é uma despesa recorrente. Escolha como deseja proceder:
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Opções de Exclusão */}
          {expense.is_recurring && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="single"
                  name="deleteType"
                  value="single"
                  checked={deleteType === 'single'}
                  onChange={e => setDeleteType(e.target.value)}
                  className="text-red-600 focus:ring-red-500"
                />
                <label
                  htmlFor="single"
                  className="text-theme-primary dark:text-dark-text-primary text-sm"
                >
                  <span className="font-medium">
                    Excluir apenas esta ocorrência
                  </span>
                  <p className="text-theme-secondary dark:text-dark-text-muted">
                    Remove apenas esta despesa específica
                  </p>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="series"
                  name="deleteType"
                  value="series"
                  checked={deleteType === 'series'}
                  onChange={e => setDeleteType(e.target.value)}
                  className="text-red-600 focus:ring-red-500"
                />
                <label
                  htmlFor="series"
                  className="text-theme-primary dark:text-dark-text-primary text-sm"
                >
                  <span className="font-medium">
                    Excluir toda a série recorrente
                  </span>
                  <p className="text-theme-secondary dark:text-dark-text-muted">
                    Remove esta despesa e todas as futuras da série
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Aviso Final */}
          <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="mt-1 h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-300">
                  Atenção: Esta ação não pode ser desfeita
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  A exclusão da despesa é permanente e não pode ser revertida.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-theme-secondary rounded-md px-4 py-2 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-dark-text-primary flex items-center rounded-md bg-red-600 px-4 py-2 transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-light-surface dark:border-dark-surface"></div>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirmar Exclusão
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default DeleteConfirmationModal;
