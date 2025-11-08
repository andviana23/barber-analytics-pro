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
    available_balance: account.available_balance,
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
      className={`rounded-xl border border-light-border bg-light-surface shadow-sm transition-all duration-300 ease-in-out hover:border-primary hover:shadow-lg dark:border-dark-border dark:bg-dark-surface ${!account.is_active ? 'opacity-60' : ''} `}
    >
      {/* Header com ações */}
      <div className="border-b border-light-border p-5 dark:border-dark-border">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-theme-primary truncate text-lg font-semibold">
                  {account.name}
                </h3>
                <div className="mt-0.5 flex items-center gap-2">
                  <Building className="h-4 w-4 flex-shrink-0 text-text-light-secondary dark:text-text-dark-secondary" />
                  <span className="text-theme-secondary truncate text-sm">
                    {account.bank}
                  </span>
                </div>
              </div>
            </div>

            {!account.is_active && (
              <span className="inline-flex items-center rounded-full bg-feedback-light-error/10 px-2.5 py-1 text-xs font-medium text-feedback-light-error dark:bg-feedback-dark-error/30 dark:text-feedback-dark-error">
                Inativa
              </span>
            )}
          </div>

          {/* Botões de ação */}
          {(canEdit || canDelete) && (
            <div className="flex flex-shrink-0 items-center gap-1.5">
              {canEdit && (
                <button
                  onClick={() => onEdit(account)}
                  className="rounded-lg p-2 text-text-light-secondary transition-colors hover:bg-light-bg hover:text-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover"
                  title="Editar conta"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(account)}
                  className="rounded-lg p-2 text-text-light-secondary transition-colors hover:bg-light-bg hover:text-feedback-light-error dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-feedback-dark-error"
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
            <div className="flex items-center gap-3 rounded-lg bg-light-bg p-3 dark:bg-dark-bg">
              <MapPin className="h-4 w-4 flex-shrink-0 text-text-light-secondary dark:text-text-dark-secondary" />
              <div className="min-w-0 flex-1">
                <span className="text-theme-secondary mb-0.5 block text-xs">
                  Agência
                </span>
                <span className="text-theme-primary text-sm font-semibold">
                  {account.agency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-light-bg p-3 dark:bg-dark-bg">
              <Hash className="h-4 w-4 flex-shrink-0 text-text-light-secondary dark:text-text-dark-secondary" />
              <div className="min-w-0 flex-1">
                <span className="text-theme-secondary mb-0.5 block text-xs">
                  Número da Conta
                </span>
                <span className="text-theme-primary text-sm font-semibold">
                  {account.account_number}
                </span>
              </div>
            </div>

            {showUnit && account.units && (
              <div className="flex items-center gap-3 rounded-lg bg-light-bg p-3 dark:bg-dark-bg">
                <Building className="h-4 w-4 flex-shrink-0 text-text-light-secondary dark:text-text-dark-secondary" />
                <div className="min-w-0 flex-1">
                  <span className="text-theme-secondary mb-0.5 block text-xs">
                    Unidade
                  </span>
                  <span className="text-theme-primary block truncate text-sm font-semibold">
                    {account.units.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Informações financeiras */}
          <div className="border-t border-light-border pt-4 dark:border-dark-border">
            {/* Saldo Inicial */}
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-primary/5 p-3 dark:bg-primary/10">
              <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-theme-secondary mb-1 block text-xs">
                  Saldo Inicial
                </span>
                <span className="text-base font-bold text-primary">
                  {formatCurrency(account.initial_balance)}
                </span>
              </div>
            </div>

            {/* Saldo Atual */}
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-feedback-light-success/5 p-3 dark:bg-feedback-dark-success/10">
              <div className="flex-shrink-0 rounded-lg bg-feedback-light-success/10 p-2 dark:bg-feedback-dark-success/20">
                <DollarSign className="h-4 w-4 text-feedback-light-success dark:text-feedback-dark-success" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-theme-secondary mb-1 block text-xs">
                  Saldo Atual
                </span>
                <span className="text-lg font-bold text-feedback-light-success dark:text-feedback-dark-success">
                  {formatCurrency(account.current_balance || 0)}
                </span>
              </div>
            </div>

            {/* Saldo Disponível */}
            <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-3 dark:bg-primary/10">
              <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-theme-secondary mb-1 block text-xs">
                  Saldo Disponível
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(account.available_balance || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com status */}
        <div className="mt-5 border-t border-light-border pt-4 dark:border-dark-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 animate-pulse rounded-full ${account.is_active ? 'bg-feedback-light-success' : 'bg-feedback-light-error'} `}
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
