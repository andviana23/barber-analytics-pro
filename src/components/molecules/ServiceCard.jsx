/**
 * @file ServiceCard.jsx
 * @description Componente Molecule - Card de serviço
 * @module Components/Molecules
 * @author Andrey Viana
 * @date 2025-10-24
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Clock,
  DollarSign,
  Percent,
  Edit2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, CardContent } from '../../atoms/Card/Card';
import { Button } from '../../atoms/Button/Button';
import { formatCurrency } from '../../utils/formatters';

/**
 * Card de serviço com informações e ações
 * Segue padrões do Design System
 */
const ServiceCard = ({
  service,
  onEdit,
  onToggleActive,
  canManage = false,
  className = '',
}) => {
  const isActive = service.active !== false;

  return (
    <Card
      className={`
        p-5
        transition-all
        duration-200
        ${!isActive ? 'opacity-60' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-theme-primary truncate mb-1">
            {service.name}
          </h4>
          <div className="flex items-center gap-2">
            <span
              className={`
                inline-flex
                items-center
                gap-1
                px-2
                py-0.5
                text-xs
                font-medium
                rounded-full
                ${
                  isActive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {isActive ? (
                <>
                  <ToggleRight size={12} />
                  <span>Ativo</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={12} />
                  <span>Inativo</span>
                </>
              )}
            </span>
          </div>
        </div>

        {canManage && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(service)}
            className="flex-shrink-0 ml-2"
            aria-label="Editar serviço"
          >
            <Edit2 size={16} />
          </Button>
        )}
      </div>

      {/* Informações */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Duração */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-theme-muted">Duração</p>
            <p className="text-base font-semibold text-theme-primary">
              {service.duration_minutes || 0} min
            </p>
          </div>
        </div>

        {/* Preço */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <DollarSign
              size={20}
              className="text-green-600 dark:text-green-400"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-theme-muted">Preço</p>
            <p className="text-base font-bold text-green-600 dark:text-green-400">
              {formatCurrency(service.price || 0)}
            </p>
          </div>
        </div>

        {/* Comissão */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <Percent
              size={20}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-theme-muted">Comissão</p>
            <p className="text-base font-semibold text-theme-primary">
              {service.commission_percentage || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Cálculo de Comissão */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-theme-muted">
            Comissão por serviço:
          </span>
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(
              (service.price || 0) *
                ((service.commission_percentage || 0) / 100)
            )}
          </span>
        </div>
      </div>

      {/* Ações */}
      {canManage && onToggleActive && (
        <div className="flex gap-2">
          <Button
            onClick={() => onToggleActive(service)}
            variant={isActive ? 'secondary' : 'primary'}
            size="sm"
            className="w-full"
          >
            {isActive ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      )}

      {/* Estatísticas (se disponível) */}
      {service.usage_count !== undefined && (
        <div className="mt-4 pt-4 border-t border-theme-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-theme-muted">Usado em comandas:</span>
            <span className="font-semibold text-theme-primary">
              {service.usage_count || 0}x
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

ServiceCard.propTypes = {
  /** Dados do serviço */
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    duration_minutes: PropTypes.number,
    price: PropTypes.number,
    commission_percentage: PropTypes.number,
    active: PropTypes.bool,
    usage_count: PropTypes.number,
  }).isRequired,
  /** Callback para editar serviço */
  onEdit: PropTypes.func,
  /** Callback para ativar/desativar */
  onToggleActive: PropTypes.func,
  /** Se usuário pode gerenciar serviços */
  canManage: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

export default ServiceCard;
