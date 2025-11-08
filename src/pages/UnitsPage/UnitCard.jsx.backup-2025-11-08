/**
 * UNIT CARD COMPONENT
 *
 * Card individual para exibir informações de uma unidade
 */

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../atoms';
import { useUnits } from '../../hooks';

// Icons
import {
  Building2,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
  DollarSign,
} from 'lucide-react';
const UnitCard = ({ unit, onEdit, onDelete, canViewStats = false }) => {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const { getUnitStats, toggleUnitStatus, updating } = useUnits(false);

  // Carregar estatísticas da unidade
  useEffect(() => {
    if (canViewStats && unit.status) {
      loadStats();
    }
  }, [unit.id, canViewStats, unit.status]);
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const unitStats = await getUnitStats(unit.id);
      setStats(unitStats);
    } catch (error) {
      // Error já tratado no hook
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };
  const handleToggleStatus = async () => {
    try {
      await toggleUnitStatus(unit.id);
    } catch (error) {
      // Error já tratado no hook
    }
  };
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };
  return (
    <Card
      className={`p-6 transition-all duration-200 hover:shadow-lg ${!unit.status ? 'bg-gray-50 opacity-60 dark:bg-gray-800' : ''}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center">
          <div
            className={`rounded-lg p-3 ${unit.status ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            <Building2
              className={`h-6 w-6 ${unit.status ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
            />
          </div>
          <div className="ml-3">
            <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
              {unit.name}
            </h3>
            <div className="mt-1 flex items-center">
              {unit.status ? (
                <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm ${unit.status ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {unit.status ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Toggle */}
        <button
          onClick={handleToggleStatus}
          disabled={updating}
          className={`rounded-lg p-2 transition-colors ${unit.status ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'} ${updating ? 'cursor-not-allowed opacity-50' : ''}`}
          title={unit.status ? 'Desativar unidade' : 'Ativar unidade'}
        >
          {unit.status ? (
            <XCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Estatísticas */}
      {canViewStats && unit.status && (
        <div className="mb-4">
          {loadingStats ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="text-theme-secondary ml-2 text-sm">
                Carregando...
              </span>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-light-bg p-3 dark:bg-dark-bg dark:bg-gray-700">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-blue-600" />
                  <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                    Profissionais
                  </span>
                </div>
                <div className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                  {stats.professionals.total}
                </div>
              </div>

              <div className="rounded-lg bg-light-bg p-3 dark:bg-dark-bg dark:bg-gray-700">
                <div className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4 text-green-600" />
                  <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                    Atendimentos
                  </span>
                </div>
                <div className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                  {stats.attendances.count}
                </div>
              </div>

              <div className="col-span-2 rounded-lg bg-light-bg p-3 dark:bg-dark-bg dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                    <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                      Faturamento do Mês
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(stats.financial.monthlyRevenue)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted py-4 text-center text-sm">
              Estatísticas não disponíveis
            </div>
          )}
        </div>
      )}

      {/* Informações básicas */}
      <div className="mb-4 space-y-2">
        <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
          <span className="font-medium">Criada em:</span>{' '}
          {new Date(unit.created_at).toLocaleDateString('pt-BR')}
        </div>
        {unit.updated_at && unit.updated_at !== unit.created_at && (
          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
            <span className="font-medium">Atualizada em:</span>{' '}
            {new Date(unit.updated_at).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between border-t border-light-border pt-4 dark:border-dark-border">
        <div className="flex items-center space-x-2">
          {canViewStats && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                /* Implementar visualização detalhada */
              }}
              className="text-xs"
            >
              <Eye className="mr-1 h-4 w-4" />
              Ver Detalhes
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(unit)}
              className="text-xs"
            >
              <Edit className="mr-1 h-4 w-4" />
              Editar
            </Button>
          )}

          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(unit)}
              className="text-xs"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Excluir
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
export default UnitCard;
