/**
 * @fileoverview Dashboard de Alertas
 * @module app/ia-financeira/alertas/page
 * @description Página de dashboard com tabela de alertas e filtros
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 8.3
 * @see docs/DESIGN_SYSTEM.md
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

type AlertStatus = 'OPEN' | 'RESOLVED' | 'IGNORED';
type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Página: Dashboard de Alertas
 */
export default function AlertasPage() {
  const [unitId, setUnitId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | ''>('OPEN');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | ''>('');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryClient = useQueryClient();

  // Buscar alertas
  const { data: alertsResponse, isLoading } = useQuery({
    queryKey: [
      'alerts-query',
      unitId,
      statusFilter,
      severityFilter,
      startDate,
      endDate,
      page,
    ],
    queryFn: async () => {
      if (!unitId) return null;

      const params = new URLSearchParams({
        unitId,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/alerts/query?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch alerts');

      return response.json();
    },
    enabled: !!unitId,
    staleTime: 2 * 60 * 1000,
  });

  // Mutation para resolver alerta
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to resolve alert');

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-query'] });
    },
  });

  useEffect(() => {
    const savedUnitId = localStorage.getItem('selected_unit_id');
    if (savedUnitId) {
      setUnitId(savedUnitId);
    }
  }, []);

  if (!unitId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="card-theme rounded-xl border p-8 text-center">
          <p className="text-theme-primary text-lg font-medium">
            Selecione uma unidade para visualizar os alertas
          </p>
        </div>
      </div>
    );
  }

  const alerts = alertsResponse?.alerts || [];
  const pagination = alertsResponse?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-feedback-light-error/10 text-feedback-light-error dark:bg-feedback-dark-error/10 dark:text-feedback-dark-error';
      case 'HIGH':
        return 'bg-feedback-light-warning/10 text-feedback-light-warning dark:bg-feedback-dark-warning/10 dark:text-feedback-dark-warning';
      case 'MEDIUM':
        return 'bg-feedback-light-warning/5 text-feedback-light-warning dark:bg-feedback-dark-warning/5 dark:text-feedback-dark-warning';
      default:
        return 'bg-light-bg text-theme-secondary dark:bg-dark-hover';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-4 w-4" />;
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4 opacity-50" />;
    }
  };

  return (
    <div className="min-h-screen bg-light-bg p-6 dark:bg-dark-bg">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-theme-primary mb-2 text-3xl font-bold">
            Alertas Financeiros
          </h1>
          <p className="text-theme-secondary text-sm">
            Gerencie e monitore alertas da sua unidade
          </p>
        </div>

        {/* Filtros */}
        <div className="card-theme mb-6 rounded-xl border p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value as AlertStatus | '');
                  setPage(1);
                }}
                className="input-theme"
              >
                <option value="">Todos</option>
                <option value="OPEN">Abertos</option>
                <option value="RESOLVED">Resolvidos</option>
                <option value="IGNORED">Ignorados</option>
              </select>
            </div>

            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Severidade
              </label>
              <select
                value={severityFilter}
                onChange={e => {
                  setSeverityFilter(e.target.value as AlertSeverity | '');
                  setPage(1);
                }}
                className="input-theme"
              >
                <option value="">Todas</option>
                <option value="CRITICAL">Crítica</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="LOW">Baixa</option>
              </select>
            </div>

            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="input-theme"
              />
            </div>

            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="input-theme"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Alertas */}
        <div className="card-theme rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-theme-primary text-xl font-semibold">
              Alertas ({pagination.total})
            </h2>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-theme-secondary">Carregando alertas...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="mx-auto mb-2 h-12 w-12 text-feedback-light-success opacity-50 dark:text-feedback-dark-success" />
              <p className="text-theme-secondary">Nenhum alerta encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-light-bg dark:bg-dark-hover">
                    <tr>
                      <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                        Tipo
                      </th>
                      <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                        Severidade
                      </th>
                      <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                        Mensagem
                      </th>
                      <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                        Data
                      </th>
                      <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-border dark:divide-dark-border">
                    {alerts.map((alert: any) => (
                      <tr
                        key={alert.id}
                        className="transition-colors hover:bg-light-bg dark:hover:bg-dark-hover"
                      >
                        <td className="text-theme-primary px-4 py-3">
                          {alert.alert_type}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(alert.severity)}`}
                          >
                            {getSeverityIcon(alert.severity)}
                            {alert.severity}
                          </span>
                        </td>
                        <td className="text-theme-secondary px-4 py-3">
                          {alert.message}
                        </td>
                        <td className="text-theme-secondary px-4 py-3">
                          {new Date(alert.created_at).toLocaleDateString(
                            'pt-BR'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {alert.status === 'OPEN' && (
                            <button
                              onClick={() =>
                                resolveAlertMutation.mutate(alert.id)
                              }
                              disabled={resolveAlertMutation.isPending}
                              className="btn-theme-secondary rounded px-3 py-1 text-sm"
                            >
                              {resolveAlertMutation.isPending
                                ? 'Resolvendo...'
                                : 'Resolver'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-theme-secondary text-sm">
                    Página {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                      className="btn-theme-secondary rounded px-4 py-2 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() =>
                        setPage(p => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="btn-theme-secondary rounded px-4 py-2 disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
