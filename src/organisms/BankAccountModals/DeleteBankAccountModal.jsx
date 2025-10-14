/**
 * DELETE BANK ACCOUNT MODAL
 * 
 * Modal para confirmação de exclusão de conta bancária
 */

import React, { useState } from 'react';
import { Button } from '../../atoms';
import { useBankAccounts } from '../../hooks';
import { useToast } from '../../context';

// Icons
import {
  X,
  AlertTriangle,
  Trash2,
  CreditCard
} from 'lucide-react';

const DeleteBankAccountModal = ({ isOpen, onClose, onSuccess, account = null }) => {
  const { deleteBankAccount, loading } = useBankAccounts();
  const { showSuccess, showError } = useToast();
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!account) return;

    // Verificar confirmação
    if (confirmText !== account.name) {
      showError(
        'Confirmação inválida',
        'Digite exatamente o nome da conta para confirmar a exclusão.'
      );
      return;
    }

    try {
      await deleteBankAccount(account.id);
      
      showSuccess(
        'Conta bancária excluída',
        `A conta ${account.name} foi excluída com sucesso.`
      );

      setConfirmText('');
      onSuccess?.(account);
      onClose();
    } catch (error) {
      showError(
        'Erro ao excluir conta',
        error.message
      );
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setConfirmText('');
    onClose();
  };

  if (!isOpen || !account) return null;

  const isConfirmValid = confirmText === account.name;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Excluir Conta Bancária
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            
            {/* Account info */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {account.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {account.bank} • {account.agency}-{account.account_number}
                </p>
                {account.units && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Unidade: {account.units.name}
                  </p>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  Atenção!
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  A conta será desativada permanentemente. Ela não aparecerá mais nas listagens,
                  mas os dados históricos serão preservados no sistema.
                </p>
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Para confirmar, digite o nome da conta: <strong>{account.name}</strong>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={account.name}
                disabled={loading}
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                  disabled:bg-gray-50 disabled:text-gray-500
                  ${isConfirmValid 
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700' 
                    : 'border-gray-300 dark:border-gray-600'
                  }
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                `}
              />
              {confirmText && !isConfirmValid && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  O texto não confere com o nome da conta
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={loading || !isConfirmValid}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Excluindo...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Excluir Conta
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBankAccountModal;