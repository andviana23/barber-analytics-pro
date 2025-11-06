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
      className={`p-5 transition-all duration-200 ${!isActive ? 'opacity-60' : ''} ${className} `}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="text-theme-primary mb-1 truncate text-lg font-semibold">
            {service.name}
          </h4>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'} `}
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
            className="ml-2 flex-shrink-0"
            aria-label="Editar serviço"
          >
            <Edit2 size={16} />
          </Button>
        )}
      </div>

      {/* Informações */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Duração */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Clock size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-theme-muted text-xs">Duração</p>
            <p className="text-theme-primary text-base font-semibold">
              {service.duration_minutes || 0} min
            </p>
          </div>
        </div>

        {/* Preço */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <DollarSign
              size={20}
              className="text-green-600 dark:text-green-400"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-theme-muted text-xs">Preço</p>
            <p className="text-base font-bold text-green-600 dark:text-green-400">
              {formatCurrency(service.price || 0)}
            </p>
          </div>
        </div>

        {/* Comissão */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Percent
              size={20}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-theme-muted text-xs">Comissão</p>
            <p className="text-theme-primary text-base font-semibold">
              {service.commission_percentage || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Cálculo de Comissão */}
      <div className="mb-4 rounded-lg border border-light-border bg-light-bg p-3 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
        <div className="flex items-center justify-between">
          <span className="text-theme-muted text-xs font-medium">
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
        <div className="border-theme-border mt-4 border-t pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-theme-muted">Usado em comandas:</span>
            <span className="text-theme-primary font-semibold">
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
