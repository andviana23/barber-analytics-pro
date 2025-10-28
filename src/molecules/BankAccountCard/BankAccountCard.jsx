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
      bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm border border-light-border dark:border-dark-border
      hover:shadow-lg hover:border-primary 
      transition-all duration-300 ease-in-out
      ${!account.is_active ? 'opacity-60' : ''}
    `}
    >
      {/* Header com ações */}
      <div className="p-5 border-b border-light-border dark:border-dark-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-theme-primary truncate">
                  {account.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Building className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0" />
                  <span className="text-sm text-theme-secondary truncate">
                    {account.bank}
                  </span>
                </div>
              </div>
            </div>

            {!account.is_active && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-feedback-light-error/10 text-feedback-light-error dark:bg-feedback-dark-error/30 dark:text-feedback-dark-error">
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
                  className="p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:text-primary hover:bg-light-bg dark:hover:bg-dark-hover transition-colors"
                  title="Editar conta"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(account)}
                  className="p-2 rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:text-feedback-light-error dark:hover:text-feedback-dark-error hover:bg-light-bg dark:hover:bg-dark-hover transition-colors"
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
            <div className="flex items-center gap-3 p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
              <MapPin className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-theme-secondary block mb-0.5">
                  Agência
                </span>
                <span className="font-semibold text-sm text-theme-primary">
                  {account.agency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
              <Hash className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-theme-secondary block mb-0.5">
                  Número da Conta
                </span>
                <span className="font-semibold text-sm text-theme-primary">
                  {account.account_number}
                </span>
              </div>
            </div>

            {showUnit && account.units && (
              <div className="flex items-center gap-3 p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                <Building className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-theme-secondary block mb-0.5">
                    Unidade
                  </span>
                  <span className="font-semibold text-sm text-theme-primary truncate block">
                    {account.units.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Informações financeiras */}
          <div className="pt-4 border-t border-light-border dark:border-dark-border">
            {/* Saldo Inicial */}
            <div className="flex items-center gap-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg mb-3">
              <div className="flex-shrink-0 p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-theme-secondary block mb-1">
                  Saldo Inicial
                </span>
                <span className="font-bold text-base text-primary">
                  {formatCurrency(account.initial_balance)}
                </span>
              </div>
            </div>

            {/* Saldo Atual */}
            <div className="flex items-center gap-3 p-3 bg-feedback-light-success/5 dark:bg-feedback-dark-success/10 rounded-lg mb-3">
              <div className="flex-shrink-0 p-2 bg-feedback-light-success/10 dark:bg-feedback-dark-success/20 rounded-lg">
                <DollarSign className="h-4 w-4 text-feedback-light-success dark:text-feedback-dark-success" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-theme-secondary block mb-1">
                  Saldo Atual
                </span>
                <span className="font-bold text-lg text-feedback-light-success dark:text-feedback-dark-success">
                  {formatCurrency(account.current_balance || 0)}
                </span>
              </div>
            </div>

            {/* Saldo Disponível */}
            <div className="flex items-center gap-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg">
              <div className="flex-shrink-0 p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-theme-secondary block mb-1">
                  Saldo Disponível
                </span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(account.saldo_disponivel || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com status */}
        <div className="mt-5 pt-4 border-t border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`
                h-2 w-2 rounded-full animate-pulse
                ${account.is_active ? 'bg-feedback-light-success' : 'bg-feedback-light-error'}
              `}
              />
              <span
                className={`font-medium ${
                  account.is_active
                    ? 'text-feedback-light-success dark:text-feedback-dark-success'
                    : 'text-feedback-light-error dark:text-feedback-dark-error'
                }`}
              >
                {account.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            <span className="text-theme-secondary">
              Criada em {formatDate(account.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountCard;
