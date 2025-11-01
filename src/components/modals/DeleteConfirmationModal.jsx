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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card-theme dark:bg-dark-surface rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary">
            Confirmar Exclusão
          </h3>
          <button
            onClick={onClose}
            className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary dark:hover:text-theme-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          {/* Informações da Despesa */}
          <div className="bg-light-bg dark:bg-dark-bg rounded-md p-4">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-light-text-muted dark:text-dark-text-muted mt-1" />
              <div>
                <p className="font-medium text-theme-primary dark:text-dark-text-primary">
                  {expense.description || 'Sem descrição'}
                </p>
                <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  {expense.value?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }) || 'R$ 0,00'}
                </p>
                {expense.expected_payment_date && (
                  <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
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
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-1" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                    Despesa Recorrente Detectada
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
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
                  className="text-sm text-theme-primary dark:text-dark-text-primary"
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
                  className="text-sm text-theme-primary dark:text-dark-text-primary"
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-1" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-300">
                  Atenção: Esta ação não pode ser desfeita
                </h4>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
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
            className="btn-theme-secondary px-4 py-2 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-red-600 dark:bg-red-700 text-dark-text-primary rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-light-surface dark:border-dark-surface mr-2"></div>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
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
