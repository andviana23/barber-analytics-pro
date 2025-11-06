/**
 * StatusBadge.jsx
 *
 * Badge de status para transações financeiras
 * Variantes: Pendente (gray), Recebido (green), Atrasado (amber), Cancelado (red)
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React from 'react';
import PropTypes from 'prop-types';

const StatusBadge = ({
  status,
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  // Mapeamento de status para configurações visuais
  const statusConfig = {
    pending: {
      label: 'Pendente',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200',
      dotColor: 'bg-gray-400',
    },
    overdue: {
      label: 'Atrasado',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      dotColor: 'bg-amber-500',
    },
    paid: {
      label: 'Pago',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      dotColor: 'bg-green-500',
    },
    received: {
      label: 'Recebido',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      dotColor: 'bg-green-500',
    },
    cancelled: {
      label: 'Cancelado',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      dotColor: 'bg-red-500',
    },
    partially_paid: {
      label: 'Parcial',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      dotColor: 'bg-blue-500',
    },
    scheduled: {
      label: 'Agendado',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200',
      dotColor: 'bg-purple-500',
    },
    reconciled: {
      label: 'Conciliado',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-200',
      dotColor: 'bg-emerald-500',
    },
  };

  // Configurações de tamanho
  const sizeConfig = {
    sm: {
      container: 'px-2 py-1 text-xs',
      dot: 'w-1.5 h-1.5 mr-1.5',
    },
    md: {
      container: 'px-2.5 py-1.5 text-sm',
      dot: 'w-2 h-2 mr-2',
    },
    lg: {
      container: 'px-3 py-2 text-base',
      dot: 'w-2.5 h-2.5 mr-2.5',
    },
  };

  // Obter configuração do status (fallback para pending se não encontrado)
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClasses = sizeConfig[size] || sizeConfig.md;

  // Classes base do componente
  const baseClasses =
    'inline-flex items-center rounded-full font-medium border';

  // Classes condicionais baseadas na variante
  const variantClasses =
    variant === 'outline'
      ? `border ${config.borderColor} ${config.textColor} bg-white`
      : `${config.bgColor} ${config.textColor} ${config.borderColor}`;

  const containerClasses = `${baseClasses} ${variantClasses} ${sizeClasses.container} ${className}`;

  return (
    <span className={containerClasses}>
      {/* Dot indicador */}
      <span
        className={`${sizeClasses.dot} ${config.dotColor} flex-shrink-0 rounded-full`}
        aria-hidden="true"
      />

      {/* Label do status */}
      <span className="font-medium">{config.label}</span>
    </span>
  );
};

StatusBadge.propTypes = {
  /**
   * Status da transação
   */
  status: PropTypes.oneOf([
    'pending',
    'overdue',
    'paid',
    'received',
    'cancelled',
    'partially_paid',
    'scheduled',
    'reconciled',
  ]).isRequired,

  /**
   * Tamanho do badge
   */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),

  /**
   * Variante visual
   */
  variant: PropTypes.oneOf(['default', 'outline']),

  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string,
};

StatusBadge.defaultProps = {
  size: 'md',
  variant: 'default',
  className: '',
};

// Componente utilitário para preview dos status
export const StatusBadgePreview = () => {
  const allStatuses = [
    'pending',
    'overdue',
    'paid',
    'received',
    'cancelled',
    'partially_paid',
    'scheduled',
    'reconciled',
  ];

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Status Badge Preview</h3>

      {/* Variante padrão */}
      <div>
        <h4 className="text-md mb-2 font-medium">Variante Padrão</h4>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map(status => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </div>

      {/* Variante outline */}
      <div>
        <h4 className="text-md mb-2 font-medium">Variante Outline</h4>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map(status => (
            <StatusBadge
              key={`${status}-outline`}
              status={status}
              variant="outline"
            />
          ))}
        </div>
      </div>

      {/* Tamanhos */}
      <div>
        <h4 className="text-md mb-2 font-medium">Tamanhos</h4>
        <div className="flex items-center gap-4">
          <StatusBadge status="paid" size="sm" />
          <StatusBadge status="paid" size="md" />
          <StatusBadge status="paid" size="lg" />
        </div>
      </div>
    </div>
  );
};

export default StatusBadge;
