/**
 * @file StatusBadge.jsx
 * @description Componente Atom para exibir badges de status
 * @module Components/Atoms
 * @author Andrey Viana
 * @date 2025-10-24
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

/**
 * Badge de status com cores semânticas e ícones
 * Segue padrões do Design System para acessibilidade e dark mode
 */
const StatusBadge = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  // Configurações por tipo de status
  const statusConfig = {
    open: {
      label: 'Aberto',
      icon: Clock,
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-700 dark:text-blue-300',
      borderClass: 'border-blue-200 dark:border-blue-700',
      ariaLabel: 'Status: Aberto',
    },
    closed: {
      label: 'Fechado',
      icon: CheckCircle,
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-700 dark:text-green-300',
      borderClass: 'border-green-200 dark:border-green-700',
      ariaLabel: 'Status: Fechado',
    },
    canceled: {
      label: 'Cancelado',
      icon: XCircle,
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-700 dark:text-red-300',
      borderClass: 'border-red-200 dark:border-red-700',
      ariaLabel: 'Status: Cancelado',
    },
    cancelled: {
      // Variante alternativa (EN/PT)
      label: 'Cancelado',
      icon: XCircle,
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-700 dark:text-red-300',
      borderClass: 'border-red-200 dark:border-red-700',
      ariaLabel: 'Status: Cancelado',
    },
    pending: {
      label: 'Pendente',
      icon: Clock,
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
      textClass: 'text-yellow-700 dark:text-yellow-300',
      borderClass: 'border-yellow-200 dark:border-yellow-700',
      ariaLabel: 'Status: Pendente',
    },
  };

  // Tamanhos disponíveis
  const sizeConfig = {
    sm: {
      padding: 'px-2 py-0.5',
      text: 'text-xs',
      iconSize: 12,
      gap: 'gap-1',
    },
    md: {
      padding: 'px-3 py-1',
      text: 'text-sm',
      iconSize: 14,
      gap: 'gap-1.5',
    },
    lg: {
      padding: 'px-4 py-1.5',
      text: 'text-base',
      iconSize: 16,
      gap: 'gap-2',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const sizeStyles = sizeConfig[size] || sizeConfig.md;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center ${sizeStyles.gap} ${sizeStyles.padding} ${sizeStyles.text} rounded-full border font-medium ${config.bgClass} ${config.textClass} ${config.borderClass} transition-colors ${className} `}
      role="status"
      aria-label={config.ariaLabel}
    >
      {showIcon && <Icon size={sizeStyles.iconSize} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
};

StatusBadge.propTypes = {
  /** Status a ser exibido: open, closed, canceled, pending */
  status: PropTypes.oneOf([
    'open',
    'closed',
    'canceled',
    'cancelled',
    'pending',
  ]).isRequired,
  /** Tamanho do badge: sm, md, lg */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Mostrar ícone ao lado do texto */
  showIcon: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

export default StatusBadge;
