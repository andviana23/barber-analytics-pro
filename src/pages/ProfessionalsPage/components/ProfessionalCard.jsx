import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  Percent, 
  Crown,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Clock,
  Calendar,
  DollarSign
} from 'lucide-react';

import { Card } from '../../../atoms/Card/Card';
import { Button } from '../../../atoms/Button/Button';
import { ProfissionaisService } from '../../../services/profissionaisService';

/**
 * Card individual de profissional com suas informações e estatísticas
 */
export function ProfessionalCard({ 
  professional, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  canEdit = false,
  canDelete = false 
}) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  /**
   * Carrega estatísticas do profissional
   */
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true);
        const statsData = await ProfissionaisService.getProfissionalStats(professional.id);
        setStats(statsData);
      } catch {
        // Erro ao carregar estatísticas
      } finally {
        setLoadingStats(false);
      }
    };

    if (professional.is_active) {
      loadStats();
    }
  }, [professional.id, professional.is_active]);

  /**
   * Formata o papel do usuário para exibição
   */
  const getRoleDisplay = (role) => {
    const roles = {
      admin: 'Administrador',
      gerente: 'Gerente',
      barbeiro: 'Barbeiro'
    };
    return roles[role] || role;
  };

  /**
   * Retorna a cor do badge baseado no papel
   */
  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      gerente: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      barbeiro: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  /**
   * Retorna o status da fila formatado
   */
  const getQueueStatusDisplay = (status) => {
    const statuses = {
      active: { label: 'Disponível', color: 'text-success' },
      paused: { label: 'Pausado', color: 'text-warning' },
      attending: { label: 'Em Atendimento', color: 'text-info' },
      inactive: { label: 'Inativo', color: 'text-text-light-secondary dark:text-text-dark-secondary' }
    };
    return statuses[status] || statuses.inactive;
  };

  const queueStatus = getQueueStatusDisplay(stats?.statusFila);

  return (
    <Card className={`p-6 transition-all duration-300 hover:shadow-lg ${
      !professional.is_active ? 'opacity-60' : ''
    }`}>
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          
          {/* Nome e Status */}
          <div>
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              {professional.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(professional.role)}`}>
                {professional.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                {getRoleDisplay(professional.role)}
              </span>
              {!professional.is_active && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Inativo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        {(canEdit || canDelete) && (
          <div className="flex gap-1">
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={professional.is_active ? PowerOff : Power}
                  onClick={() => onToggleStatus(professional)}
                  className={professional.is_active ? 'text-warning hover:text-warning' : 'text-success hover:text-success'}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit}
                  onClick={() => onEdit(professional)}
                />
              </>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => onDelete(professional)}
                className="text-feedback-light-error hover:text-feedback-light-error"
              />
            )}
          </div>
        )}
      </div>

      {/* Informações Básicas */}
      <div className="space-y-3 mb-4">
        {professional.user?.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {professional.user.email}
            </span>
          </div>
        )}

        {professional.unit?.name && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {professional.unit.name}
            </span>
          </div>
        )}

        {professional.commission_rate > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Percent className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              Comissão: {professional.commission_rate}%
            </span>
          </div>
        )}
      </div>

      {/* Estatísticas de Performance */}
      {professional.is_active && (
        <div className="border-t border-light-border dark:border-dark-border pt-4">
          <h4 className="font-medium text-text-light-primary dark:text-text-dark-primary mb-3 text-sm">
            Performance do Mês
          </h4>
          
          {loadingStats ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-2">
                Carregando...
              </p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    Atendimentos
                  </span>
                </div>
                <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {stats.totalAtendimentos}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-success" />
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    Faturamento
                  </span>
                </div>
                <p className="font-semibold text-success">
                  R$ {stats.faturamentoGerado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-info" />
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    Ticket Médio
                  </span>
                </div>
                <p className="font-semibold text-info">
                  R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-warning" />
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    Tempo Médio
                  </span>
                </div>
                <p className="font-semibold text-warning">
                  {stats.tempoMedioAtendimento}min
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Sem dados de performance
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status da Fila (apenas para profissionais ativos) */}
      {professional.is_active && stats && (
        <div className="border-t border-light-border dark:border-dark-border pt-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Status na Fila:
            </span>
            <span className={`text-xs font-medium ${queueStatus.color}`}>
              {queueStatus.label}
            </span>
          </div>
          {stats.atendimentosHoje > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Hoje:
              </span>
              <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                {stats.atendimentosHoje} atendimentos
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}