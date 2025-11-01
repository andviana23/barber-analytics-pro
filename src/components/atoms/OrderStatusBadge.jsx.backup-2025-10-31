/**
 * @file OrderStatusBadge.jsx
 * @description Componente atômico para exibir badge de status da comanda
 * @module Components/Atoms
 * @author Andrey Viana
 * @date 2025-10-28
 * @category Atomic Design
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  ORDER_STATUS,
  getStatusLabel,
  getStatusBadgeVariant,
} from '../../constants/orderStatus';
import Badge from './Badge';

/**
 * Ícones para cada status
 */
const STATUS_ICONS = {
  [ORDER_STATUS.OPEN]: '🆕',
  [ORDER_STATUS.IN_PROGRESS]: '⚙️',
  [ORDER_STATUS.AWAITING_PAYMENT]: '💰',
  [ORDER_STATUS.CLOSED]: '✅',
  [ORDER_STATUS.CANCELED]: '❌',
};

/**
 * OrderStatusBadge - Badge visual para status de comanda
 *
 * Aplica cores e estilos apropriados baseado no status atual
 * Usado em listas de comandas, detalhes e visualizações
 *
 * @component
 * @example
 * ```jsx
 * <OrderStatusBadge status="OPEN" />
 * <OrderStatusBadge status="CLOSED" showIcon={false} />
 * ```
 *
 * @param {Object} props - Propriedades do componente
 * @param {string} props.status - Status da comanda (ORDER_STATUS)
 * @param {boolean} [props.showIcon=true] - Mostrar ícone do status
 * @param {string} [props.size='md'] - Tamanho do badge ('sm', 'md', 'lg')
 * @param {string} [props.className] - Classes CSS adicionais
 * @returns {JSX.Element}
 */
const OrderStatusBadge = ({
  status,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  // Validação de status
  if (!status || !Object.values(ORDER_STATUS).includes(status)) {
    console.warn(`[OrderStatusBadge] Status inválido: ${status}`);
    return (
      <Badge variant="secondary" size={size} className={className}>
        Desconhecido
      </Badge>
    );
  }

  const label = getStatusLabel(status);
  const variant = getStatusBadgeVariant(status);
  const icon = STATUS_ICONS[status];

  return (
    <Badge variant={variant} size={size} className={className}>
      {showIcon && icon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  );
};

OrderStatusBadge.propTypes = {
  /** Status da comanda (usar constantes ORDER_STATUS) */
  status: PropTypes.oneOf(Object.values(ORDER_STATUS)).isRequired,
  /** Exibir ícone junto ao texto */
  showIcon: PropTypes.bool,
  /** Tamanho do badge */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

OrderStatusBadge.defaultProps = {
  showIcon: true,
  size: 'md',
  className: '',
};

export default OrderStatusBadge;
