import React from 'react';
import {
  Pencil,
  Trash2,
  Building,
  CreditCard,
  MapPin,
  Hash,
  DollarSign,
} from 'lucide-react';

/**
 * Componente de card para exibir informações de conta bancária
 * @param {object} props
 * @param {object} props.account - Dados da conta bancária
 * @param {function} props.onEdit - Função para editar conta
 * @param {function} props.onDelete - Função para excluir conta
 * @param {boolean} props.canEdit - Se pode editar a conta
 * @param {boolean} props.canDelete - Se pode excluir a conta
 * @param {boolean} props.showUnit - Se deve exibir informações da unidade
 */
const BankAccountCard = ({
  account,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  showUnit = true,
}) => {
  // 🔍 DEBUG: Verificar dados da conta
  console.log('🏦 BankAccountCard - Dados da conta:', {
    name: account.name,
    initial_balance: account.initial_balance,
    current_balance: account.current_balance,
    saldo_disponivel: account.saldo_disponivel,
    allData: account,
  });

  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = dateString => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div
      className={`
      bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
      hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 
      transition-all duration-300 ease-in-out
      ${!account.is_active ? 'opacity-60' : ''}
    `}
    >
      {/* Header com ações */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                  {account.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {account.bank}
                  </span>
                </div>
              </div>
            </div>

            {!account.is_active && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                Inativa
              </span>
            )}
          </div>

          {/* Botões de ação */}
          {(canEdit || canDelete) && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {canEdit && (
                <button
                  onClick={() => onEdit(account)}
                  className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                  title="Editar conta"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(account)}
                  className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  title="Excluir conta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-5">
        <div className="space-y-4">
          {/* Informações da conta */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                  Agência
                </span>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {account.agency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Hash className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                  Número da Conta
                </span>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {account.account_number}
                </span>
              </div>
            </div>

            {showUnit && account.units && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    Unidade
                  </span>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate block">
                    {account.units.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Informações financeiras */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            {/* Saldo Inicial */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg mb-3">
              <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                  Saldo Inicial
                </span>
                <span className="font-bold text-base text-blue-600 dark:text-blue-400">
                  {formatCurrency(account.initial_balance)}
                </span>
              </div>
            </div>

            {/* Saldo Atual */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg mb-3">
              <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                  Saldo Atual
                </span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  {formatCurrency(account.current_balance || 0)}
                </span>
              </div>
            </div>

            {/* Saldo Disponível */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
              <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                  Saldo Disponível
                </span>
                <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                  {formatCurrency(account.saldo_disponivel || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com status */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`
                h-2 w-2 rounded-full animate-pulse
                ${account.is_active ? 'bg-green-500' : 'bg-red-500'}
              `}
              />
              <span
                className={`font-medium ${
                  account.is_active
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {account.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            <span className="text-gray-500 dark:text-gray-400">
              Criada em {formatDate(account.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountCard;
