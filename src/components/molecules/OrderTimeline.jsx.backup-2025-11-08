/**
 * @file OrderTimeline.jsx
 * @description Componente molecule para exibir linha do tempo de mudanças de status
 * @module Components/Molecules
 * @author Andrey Viana
 * @date 2025-10-28
 * @category Atomic Design
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ORDER_STATUS, getStatusLabel } from '../../constants/orderStatus';
import OrderStatusBadge from '../atoms/OrderStatusBadge';

/**
 * OrderTimeline - Timeline visual de mudanças de status da comanda
 *
 * Exibe histórico cronológico das transições de status
 * Útil para auditoria e visualização do ciclo de vida da comanda
 *
 * @component
 * @example
 * ```jsx
 * const history = [
 *   { status: 'OPEN', timestamp: '2025-10-28T10:00:00Z', user: 'João' },
 *   { status: 'IN_PROGRESS', timestamp: '2025-10-28T10:15:00Z', user: 'João' },
 *   { status: 'CLOSED', timestamp: '2025-10-28T10:45:00Z', user: 'Maria' }
 * ];
 *
 * <OrderTimeline history={history} />
 * ```
 *
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.history - Array de eventos de mudança de status
 * @param {boolean} [props.compact=false] - Modo compacto (menos detalhes)
 * @param {string} [props.className] - Classes CSS adicionais
 * @returns {JSX.Element}
 */
const OrderTimeline = ({ history = [], compact = false, className = '' }) => {
  if (!history || history.length === 0) {
    return (
      <div className={`text-sm italic text-gray-500 ${className}`}>
        Nenhum histórico disponível
      </div>
    );
  }

  /**
   * Formata timestamp para exibição
   */
  const formatTimestamp = timestamp => {
    if (!timestamp) return 'Data não disponível';
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      console.error('[OrderTimeline] Erro ao formatar data:', error);
      return timestamp;
    }
  };
  return (
    <div className={`relative ${className}`}>
      {/* Linha vertical conectora */}
      <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Eventos da timeline */}
      <div className="space-y-4">
        {history.map((event, index) => (
          <div key={index} className="relative flex items-start gap-4">
            {/* Marcador circular */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-4 border-white ${event.status === ORDER_STATUS.CLOSED ? 'bg-green-500' : event.status === ORDER_STATUS.CANCELED ? 'bg-red-500' : event.status === ORDER_STATUS.IN_PROGRESS ? 'bg-blue-500' : event.status === ORDER_STATUS.AWAITING_PAYMENT ? 'bg-yellow-500' : 'bg-gray-400'} `}
              >
                <div className="card-theme h-2 w-2 rounded-full" />
              </div>
            </div>

            {/* Conteúdo do evento */}
            <div className="flex-1 pb-4">
              <div className="card-theme rounded-lg border border-light-border p-4 shadow-sm dark:border-dark-border">
                {/* Status */}
                <div className="mb-2 flex items-center justify-between">
                  <OrderStatusBadge
                    status={event.status}
                    size={compact ? 'sm' : 'md'}
                  />
                  <span className="text-theme-secondary text-xs">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>

                {/* Detalhes (apenas modo não-compacto) */}
                {!compact && (
                  <>
                    {event.user && (
                      <p className="text-theme-secondary mt-2 text-sm">
                        👤 <span className="font-medium">{event.user}</span>
                      </p>
                    )}

                    {event.notes && (
                      <p className="text-theme-secondary mt-1 text-sm italic">
                        📝 {event.notes}
                      </p>
                    )}

                    {event.amount && (
                      <p className="text-theme-secondary mt-1 text-sm">
                        💵 R$ {parseFloat(event.amount).toFixed(2)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
OrderTimeline.propTypes = {
  /** Histórico de mudanças de status */
  history: PropTypes.arrayOf(
    PropTypes.shape({
      /** Status neste evento */
      status: PropTypes.oneOf(Object.values(ORDER_STATUS)).isRequired,
      /** Timestamp do evento */
      timestamp: PropTypes.string.isRequired,
      /** Usuário que executou a ação */
      user: PropTypes.string,
      /** Notas/observações sobre a mudança */
      notes: PropTypes.string,
      /** Valor relacionado (para fechamento) */
      amount: PropTypes.number,
    })
  ).isRequired,
  /** Modo compacto */
  compact: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
OrderTimeline.defaultProps = {
  compact: false,
  className: '',
};
export default OrderTimeline;
