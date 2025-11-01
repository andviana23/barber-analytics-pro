/**
 * ReconciliationMatchCard.jsx
 *
 * Card para matches da conciliação bancária
 * Exibe transação interna vs extrato bancário com score de compatibilidade
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, Check, X, AlertTriangle, Calendar, DollarSign, User, Building, TrendingUp, TrendingDown, Edit3, Eye, ChevronRight, Target, ArrowUpDown } from 'lucide-react';
import { StatusBadge } from '../../atoms/StatusBadge';
const ReconciliationMatchCard = ({
  match,
  onConfirm,
  onReject,
  onAdjust,
  onViewDetails,
  showActions = true,
  compact = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!match) return null;

  // Extrair dados do match
  const {
    id,
    confidence_score = 0,
    bank_statement,
    internal_transaction,
    differences = {},
    status = 'Pendente',
    created_at
  } = match;

  // Formatação de valores
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Formatação de datas
  const formatDate = dateString => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy', {
      locale: ptBR
    });
  };
  const formatDateTime = dateString => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', {
      locale: ptBR
    });
  };

  // Classificar confiança do match
  const getConfidenceLevel = score => {
    if (score >= 90) return {
      level: 'high',
      label: 'Alto',
      color: 'green'
    };
    if (score >= 70) return {
      level: 'medium',
      label: 'Médio',
      color: 'yellow'
    };
    if (score >= 50) return {
      level: 'low',
      label: 'Baixo',
      color: 'orange'
    };
    return {
      level: 'very-low',
      label: 'Muito Baixo',
      color: 'red'
    };
  };

  // Status do match
  const getMatchStatus = () => {
    switch (status) {
      case 'Confirmado':
        return {
          color: 'green',
          label: 'Confirmado'
        };
      case 'Rejeitado':
        return {
          color: 'red',
          label: 'Rejeitado'
        };
      case 'Ajustado':
        return {
          color: 'blue',
          label: 'Ajustado'
        };
      default:
        return {
          color: 'gray',
          label: 'Pendente'
        };
    }
  };
  const confidence = getConfidenceLevel(confidence_score);
  const matchStatus = getMatchStatus();

  // Calcular diferenças
  const valueDifference = bank_statement?.amount - internal_transaction?.amount;
  const dateDifference = differences.date_diff_days || 0;

  // Verificar se há diferenças significativas
  const hasSignificantDifferences = Math.abs(valueDifference) > 0.01 || Math.abs(dateDifference) > 0;

  // Classes CSS dinâmicas
  const cardClasses = `
    bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200
    ${compact ? 'p-3' : 'p-4'}
    ${confidence.level === 'high' ? 'border-green-200' : confidence.level === 'medium' ? 'border-yellow-200' : confidence.level === 'low' ? 'border-orange-200' : 'border-red-200'}
    ${className}
  `;
  const confidenceBarClasses = `
    h-2 rounded-full transition-all duration-300
    ${confidence.color === 'green' ? 'bg-green-500' : confidence.color === 'yellow' ? 'bg-yellow-500' : confidence.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'}
  `;
  return <div className={cardClasses}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center min-w-0 flex-1">
          <Link className={`w-5 h-5 mr-2 flex-shrink-0 text-${confidence.color}-500`} />
          <div className="min-w-0 flex-1">
            <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              Match #{id?.slice(0, 8)}
            </h3>
            <p className="text-xs text-theme-secondary">
              Criado em {formatDateTime(created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center ml-2 flex-shrink-0 space-x-2">
          <StatusBadge status={matchStatus.color === 'green' ? 'received' : matchStatus.color === 'red' ? 'cancelled' : 'pending'} size={compact ? 'sm' : 'md'} />

          {showActions && <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:card-theme rounded">
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>}
        </div>
      </div>

      {/* Confidence Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Confiança</span>
          <span className={`text-sm font-semibold text-${confidence.color}-600`}>
            {confidence_score}% - {confidence.label}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className={confidenceBarClasses} style={{
          width: `${confidence_score}%`
        }} />
        </div>
      </div>

      {/* Resumo do Match */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Transação Interna */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center mb-2">
            {internal_transaction?.type === 'receita' ? <TrendingUp className="w-4 h-4 text-blue-500 mr-1" /> : <TrendingDown className="w-4 h-4 text-blue-500 mr-1" />}
            <span className="text-sm font-medium text-blue-700">
              Transação Interna
            </span>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-blue-900">
              {formatCurrency(internal_transaction?.amount)}
            </div>
            <div className="text-xs text-blue-600">
              {formatDate(internal_transaction?.date)}
            </div>
            {internal_transaction?.description && <div className="text-xs text-blue-600 truncate" title={internal_transaction.description}>
                {internal_transaction.description}
              </div>}
            {internal_transaction?.party_name && <div className="flex items-center text-xs text-blue-600">
                {internal_transaction.party_type === 'cliente' ? <User className="w-3 h-3 mr-1" /> : <Building className="w-3 h-3 mr-1" />}
                <span className="truncate">
                  {internal_transaction.party_name}
                </span>
              </div>}
          </div>
        </div>

        {/* Extrato Bancário */}
        <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3">
          <div className="flex items-center mb-2">
            <DollarSign className="w-4 h-4 text-theme-secondary mr-1" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Extrato Bancário
            </span>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-theme-primary">
              {formatCurrency(bank_statement?.amount)}
            </div>
            <div className="text-xs text-theme-secondary">
              {formatDate(bank_statement?.transaction_date)}
            </div>
            {bank_statement?.description && <div className="text-xs text-theme-secondary truncate" title={bank_statement.description}>
                {bank_statement.description}
              </div>}
            {bank_statement?.balance_after && <div className="text-xs text-theme-secondary">
                Saldo: {formatCurrency(bank_statement.balance_after)}
              </div>}
          </div>
        </div>
      </div>

      {/* Diferenças (se houver) */}
      {hasSignificantDifferences && <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500 mr-1" />
            <span className="text-sm font-medium text-amber-700">
              Diferenças Identificadas
            </span>
          </div>

          <div className="space-y-1">
            {Math.abs(valueDifference) > 0.01 && <div className="flex items-center text-xs text-amber-600">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                Valor: {valueDifference > 0 ? '+' : ''}
                {formatCurrency(valueDifference)}
              </div>}
            {Math.abs(dateDifference) > 0 && <div className="flex items-center text-xs text-amber-600">
                <Calendar className="w-3 h-3 mr-1" />
                Data: {dateDifference > 0 ? '+' : ''}
                {dateDifference} dias
              </div>}
          </div>
        </div>}

      {/* Detalhes Expandidos */}
      {isExpanded && <div className="border-t border-light-border dark:border-dark-border pt-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Detalhes da Transação Interna */}
            <div>
              <h4 className="font-medium text-theme-primary mb-2">
                Transação Interna
              </h4>
              <div className="space-y-1 text-theme-secondary">
                <div>ID: {internal_transaction?.id?.slice(0, 16)}...</div>
                <div>Tipo: {internal_transaction?.type || 'N/A'}</div>
                <div>Status: {internal_transaction?.status || 'N/A'}</div>
                {internal_transaction?.account_name && <div>Conta: {internal_transaction.account_name}</div>}
                {internal_transaction?.category && <div>Categoria: {internal_transaction.category}</div>}
              </div>
            </div>

            {/* Detalhes do Extrato */}
            <div>
              <h4 className="font-medium text-theme-primary mb-2">
                Extrato Bancário
              </h4>
              <div className="space-y-1 text-theme-secondary">
                <div>ID: {bank_statement?.id?.slice(0, 16)}...</div>
                <div>Tipo: {bank_statement?.type || 'N/A'}</div>
                <div>Hash: {bank_statement?.source_hash?.slice(0, 16)}...</div>
                {bank_statement?.bank_account && <div>Conta: {bank_statement.bank_account}</div>}
              </div>
            </div>
          </div>

          {/* Algoritmo de Match */}
          {differences && Object.keys(differences).length > 0 && <div className="mt-4 p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
              <h4 className="font-medium text-theme-primary mb-2 flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Análise do Match
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {differences.amount_match && <div>
                    <span className="text-theme-secondary">Valor:</span>
                    <span className={`ml-1 font-medium ${differences.amount_match > 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {differences.amount_match}%
                    </span>
                  </div>}
                {differences.date_match && <div>
                    <span className="text-theme-secondary">Data:</span>
                    <span className={`ml-1 font-medium ${differences.date_match > 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {differences.date_match}%
                    </span>
                  </div>}
                {differences.description_match && <div>
                    <span className="text-theme-secondary">Descrição:</span>
                    <span className={`ml-1 font-medium ${differences.description_match > 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {differences.description_match}%
                    </span>
                  </div>}
                {differences.party_match && <div>
                    <span className="text-theme-secondary">Parte:</span>
                    <span className={`ml-1 font-medium ${differences.party_match > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {differences.party_match}%
                    </span>
                  </div>}
              </div>
            </div>}
        </div>}

      {/* Ações */}
      {showActions && status === 'Pendente' && <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-light-border dark:border-dark-border">
          {onViewDetails && <button type="button" onClick={() => onViewDetails(match)} className="px-3 py-1.5 text-sm text-theme-secondary hover:text-theme-primary hover:card-theme rounded-md flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              Detalhes
            </button>}

          {hasSignificantDifferences && onAdjust && <button type="button" onClick={() => onAdjust(match)} className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md flex items-center">
              <Edit3 className="w-4 h-4 mr-1" />
              Ajustar
            </button>}

          {onReject && <button type="button" onClick={() => onReject(match)} className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md flex items-center">
              <X className="w-4 h-4 mr-1" />
              Rejeitar
            </button>}

          {onConfirm && <button type="button" onClick={() => onConfirm(match)} className="px-3 py-1.5 text-sm bg-green-600 text-dark-text-primary hover:bg-green-700 rounded-md flex items-center">
              <Check className="w-4 h-4 mr-1" />
              Confirmar
            </button>}
        </div>}
    </div>;
};
ReconciliationMatchCard.propTypes = {
  /**
   * Objeto do match de reconciliação
   */
  match: PropTypes.shape({
    id: PropTypes.string.isRequired,
    confidence_score: PropTypes.number,
    status: PropTypes.string,
    created_at: PropTypes.string,
    bank_statement: PropTypes.shape({
      id: PropTypes.string,
      amount: PropTypes.number,
      transaction_date: PropTypes.string,
      description: PropTypes.string,
      type: PropTypes.string,
      balance_after: PropTypes.number,
      source_hash: PropTypes.string,
      bank_account: PropTypes.string
    }),
    internal_transaction: PropTypes.shape({
      id: PropTypes.string,
      amount: PropTypes.number,
      date: PropTypes.string,
      description: PropTypes.string,
      type: PropTypes.string,
      status: PropTypes.string,
      party_name: PropTypes.string,
      party_type: PropTypes.string,
      account_name: PropTypes.string,
      category: PropTypes.string
    }),
    differences: PropTypes.object
  }).isRequired,
  /**
   * Callback para confirmar match
   */
  onConfirm: PropTypes.func,
  /**
   * Callback para rejeitar match
   */
  onReject: PropTypes.func,
  /**
   * Callback para ajustar match
   */
  onAdjust: PropTypes.func,
  /**
   * Callback para visualizar detalhes
   */
  onViewDetails: PropTypes.func,
  /**
   * Exibir ações
   */
  showActions: PropTypes.bool,
  /**
   * Modo compacto
   */
  compact: PropTypes.bool,
  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string
};

// Componente de preview para demonstração
export const ReconciliationMatchCardPreview = () => {
  const mockMatches = [{
    id: 'match-1',
    confidence_score: 95,
    status: 'Pendente',
    created_at: '2025-10-13T14:30:00',
    bank_statement: {
      id: 'stmt-1',
      amount: 150.0,
      transaction_date: '2025-10-13',
      description: 'PIX RECEBIDO João Silva',
      type: 'credit',
      balance_after: 2450.0,
      source_hash: 'abc123def456',
      bank_account: 'Itaú CC 12345-6'
    },
    internal_transaction: {
      id: 'rev-1',
      amount: 150.0,
      date: '2025-10-13',
      description: 'Serviço Premium - Corte + Barba',
      type: 'receita',
      status: 'Recebido',
      party_name: 'João Silva',
      party_type: 'cliente',
      account_name: 'Conta Principal',
      category: 'Serviços'
    },
    differences: {
      amount_match: 100,
      date_match: 100,
      description_match: 85,
      party_match: 95,
      date_diff_days: 0
    }
  }, {
    id: 'match-2',
    confidence_score: 72,
    status: 'Pendente',
    created_at: '2025-10-12T09:15:00',
    bank_statement: {
      id: 'stmt-2',
      amount: 500.0,
      transaction_date: '2025-10-12',
      description: 'TED DISTRIBUIDORA ALPHA LTDA',
      type: 'debit',
      balance_after: 1950.0,
      source_hash: 'def456ghi789',
      bank_account: 'Itaú CC 12345-6'
    },
    internal_transaction: {
      id: 'exp-1',
      amount: 485.5,
      date: '2025-10-10',
      description: 'Compra de produtos para revenda',
      type: 'despesa',
      status: 'Pago',
      party_name: 'Distribuidora Alpha',
      party_type: 'fornecedor',
      account_name: 'Conta Principal',
      category: 'Produtos'
    },
    differences: {
      amount_match: 75,
      date_match: 85,
      description_match: 80,
      party_match: 90,
      date_diff_days: -2
    }
  }, {
    id: 'match-3',
    confidence_score: 45,
    status: 'Pendente',
    created_at: '2025-10-11T16:20:00',
    bank_statement: {
      id: 'stmt-3',
      amount: 89.9,
      transaction_date: '2025-10-11',
      description: 'DEBITO AUTOMATICO ENERGIA',
      type: 'debit',
      balance_after: 1860.1,
      source_hash: 'ghi789jkl012',
      bank_account: 'Itaú CC 12345-6'
    },
    internal_transaction: {
      id: 'exp-2',
      amount: 89.9,
      date: '2025-10-08',
      description: 'Conta de energia elétrica',
      type: 'despesa',
      status: 'Pago',
      party_name: 'Cemig',
      party_type: 'fornecedor',
      account_name: 'Conta Principal',
      category: 'Utilidades'
    },
    differences: {
      amount_match: 100,
      date_match: 60,
      description_match: 45,
      party_match: 30,
      date_diff_days: -3
    }
  }];
  const handleAction = (action, match) => {
    alert(`Ação: ${action} para match ${match.id} (${match.confidence_score}% confiança)`);
  };
  return <div className="space-y-4 p-4 max-w-4xl">
      <h3 className="text-lg font-semibold">ReconciliationMatchCard Preview</h3>

      {mockMatches.map(match => <ReconciliationMatchCard key={match.id} match={match} onConfirm={m => handleAction('Confirmar', m)} onReject={m => handleAction('Rejeitar', m)} onAdjust={m => handleAction('Ajustar', m)} onViewDetails={m => handleAction('Ver Detalhes', m)} />)}

      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Modo Compacto:</h4>
        <ReconciliationMatchCard match={mockMatches[0]} onConfirm={m => handleAction('Confirmar', m)} onReject={m => handleAction('Rejeitar', m)} compact={true} />
      </div>
    </div>;
};
export default ReconciliationMatchCard;