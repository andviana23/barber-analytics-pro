import React from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Tag,
  Users,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Banknote,
  Receipt,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * 🎨 Modal de Detalhes da Despesa - 100% Refatorado
 *
 * Design System Compliant:
 * - Tokens de cor do Design System
 * - Classes temáticas (.card-theme, .text-theme-*)
 * - Grid system responsivo
 * - Tipografia consistente
 * - Acessibilidade (ARIA, foco visível)
 * - UX melhorada com visual hierárquico
 */
const ExpenseDetailsModal = ({ expense, isOpen, onClose }) => {
  if (!isOpen || !expense) return null;

  // 🎯 Status helpers com Design System
  const getStatusBadge = status => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Pago
        </span>
      );
    }
    if (normalizedStatus === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          Atrasado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
        <Clock className="h-3.5 w-3.5" />
        Pendente
      </span>
    );
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-details-title"
    >
      <div
        className="card-theme flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 🎯 Header com visual destacado */}
        <div className="border-b border-light-border bg-primary/10 px-6 py-5 dark:border-dark-border dark:bg-primary/20">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2
                id="expense-details-title"
                className="text-theme-primary mb-2 truncate text-xl font-semibold"
              >
                Detalhes da Despesa
              </h2>
              <p className="text-theme-secondary line-clamp-2 text-sm">
                {expense.description || 'Sem descrição'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-light-surface focus:outline-none focus:ring-2 focus:ring-primary/50 dark:hover:bg-dark-surface"
              aria-label="Fechar modal"
            >
              <X className="text-theme-secondary h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 📊 Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* 💰 Valor e Status em destaque */}
          <div className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10">
            <div>
              <p className="text-theme-secondary mb-1 text-sm font-medium">
                Valor Total
              </p>
              <p className="text-theme-primary text-3xl font-bold">
                {expense.value?.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }) || 'R$ 0,00'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(expense.status)}
              {expense.type && (
                <span className="text-theme-secondary text-xs capitalize">
                  {expense.type}
                </span>
              )}
            </div>
          </div>

          {/* 📅 Seção: Informações Principais */}
          <div className="mb-8">
            <h3 className="text-theme-primary mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <FileText className="h-4 w-4" />
              Informações Principais
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem
                icon={Calendar}
                label="Data de Emissão"
                value={
                  expense.date
                    ? format(parseISO(expense.date), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })
                    : '-'
                }
              />
              <InfoItem
                icon={Calendar}
                label="Data de Vencimento"
                value={
                  expense.expected_payment_date
                    ? format(
                        parseISO(expense.expected_payment_date),
                        "dd 'de' MMMM 'de' yyyy",
                        {
                          locale: ptBR,
                        }
                      )
                    : '-'
                }
                highlight={expense.status?.toLowerCase() === 'overdue'}
              />
              <InfoItem
                icon={Tag}
                label="Categoria"
                value={expense.category?.name || 'Sem categoria'}
              />
              <InfoItem
                icon={Users}
                label="Pessoa/Fornecedor"
                value={expense.party?.nome || 'Não informado'}
              />
              <InfoItem
                icon={Banknote}
                label="Conta Bancária"
                value={
                  expense.account?.name
                    ? `${expense.account.name}${expense.account.bank_name ? ` (${expense.account.bank_name})` : ''}`
                    : 'Não informada'
                }
              />
            </div>
          </div>

          {/* 💳 Seção: Informações de Pagamento */}
          {expense.status?.toLowerCase() === 'paid' &&
            expense.actual_payment_date && (
              <div className="mb-8">
                <h3 className="text-theme-primary mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                  <Receipt className="h-4 w-4" />
                  Informações de Pagamento
                </h3>
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10 md:grid-cols-2">
                  <InfoItem
                    icon={Calendar}
                    label="Data de Pagamento"
                    value={format(
                      parseISO(expense.actual_payment_date),
                      "dd 'de' MMMM 'de' yyyy",
                      {
                        locale: ptBR,
                      }
                    )}
                    variant="success"
                  />
                  <InfoItem
                    icon={DollarSign}
                    label="Valor Pago"
                    value={
                      expense.value?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }) || 'R$ 0,00'
                    }
                    variant="success"
                  />
                </div>
              </div>
            )}

          {/* 📝 Seção: Observações */}
          {expense.observations && (
            <div className="mb-8">
              <h3 className="text-theme-primary mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <FileText className="h-4 w-4" />
                Observações
              </h3>
              <div className="card-theme rounded-lg border border-light-border p-4 dark:border-dark-border">
                <p className="text-theme-secondary whitespace-pre-wrap text-sm leading-relaxed">
                  {expense.observations}
                </p>
              </div>
            </div>
          )}

          {/* ℹ️ Seção: Informações Adicionais */}
          {(expense.forma_pagamento || expense.data_competencia) && (
            <div>
              <h3 className="text-theme-primary mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <CreditCard className="h-4 w-4" />
                Informações Adicionais
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {expense.forma_pagamento && (
                  <InfoItem
                    icon={CreditCard}
                    label="Forma de Pagamento"
                    value={expense.forma_pagamento}
                  />
                )}
                {expense.data_competencia && (
                  <InfoItem
                    icon={Calendar}
                    label="Data de Competência"
                    value={format(
                      parseISO(expense.data_competencia),
                      'dd/MM/yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🎯 Footer com ação */}
        <div className="border-t border-light-border bg-light-bg px-6 py-4 dark:border-dark-border dark:bg-dark-bg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="card-theme text-theme-primary rounded-lg px-6 py-2.5 font-medium transition-all duration-200 hover:bg-light-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:hover:bg-dark-border dark:focus:ring-offset-dark-bg"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 🎨 Componente auxiliar: InfoItem
 * Item de informação reutilizável com ícone
 */
const InfoItem = ({ icon: Icon, label, value, highlight, variant }) => {
  const getVariantClasses = () => {
    if (variant === 'success') {
      return 'text-green-700 dark:text-green-400';
    }
    if (highlight) {
      return 'text-red-700 dark:text-red-400 font-semibold';
    }
    return 'text-theme-primary';
  };
  return (
    <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-light-surface dark:hover:bg-dark-surface">
      <Icon className="text-theme-secondary mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-theme-secondary mb-1 text-xs font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-sm font-medium ${getVariantClasses()} break-words`}>
          {value}
        </p>
      </div>
    </div>
  );
};
export default ExpenseDetailsModal;
