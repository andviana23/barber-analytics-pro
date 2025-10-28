import React, { useState } from 'react';
import {
  User,
  Play,
  Pause,
  Square,
  SkipForward,
  Clock,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../atoms';
import filaService from '../../../services/filaService';
import { useAuth } from '../../../context';

export default function BarbeiroCard({
  barbeiro,
  posicao,
  unidadeId,
  onUpdate,
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determinar permissões do usuário atual
  const canManage = user?.role === 'admin' || user?.role === 'gerente';
  const isOwnCard = user?.professionalId === barbeiro.barbeiro_id;

  const handleAction = async (action, additionalData = {}) => {
    try {
      setLoading(true);
      setError(null);

      switch (action) {
        case 'entrar':
          await filaService.entrarNaFila(barbeiro.barbeiro_id, unidadeId);
          break;

        case 'pausar':
          await filaService.pausarBarbeiro(barbeiro.barbeiro_id, unidadeId);
          break;

        case 'iniciar':
          await filaService.iniciarAtendimento(
            barbeiro.barbeiro_id,
            unidadeId,
            additionalData.tipoServico
          );
          break;

        case 'finalizar':
          await filaService.finalizarAtendimento(
            additionalData.historicoId,
            additionalData.valorServico,
            additionalData.observacoes
          );
          break;

        case 'pular':
          if (!canManage) {
            throw new Error('Apenas gerentes/admins podem pular barbeiros');
          }
          await filaService.pularBarbeiro(barbeiro.barbeiro_id, unidadeId);
          break;

        default:
          throw new Error(`Ação não reconhecida: ${action}`);
      }

      // Atualizar a lista
      await onUpdate();
    } catch (err) {
      setError(err.message);
      // eslint-disable-next-line no-console
      console.error(`Erro ao executar ação ${action}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    switch (barbeiro.status) {
      case 'active':
        return {
          label: 'Disponível',
          color: 'text-green-600',
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: <Play className="h-4 w-4" />,
        };
      case 'attending':
        return {
          label: 'Atendendo',
          color: 'text-blue-600',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: <Clock className="h-4 w-4" />,
        };
      case 'paused':
        return {
          label: 'Pausado',
          color: 'text-gray-600',
          bg: 'bg-gray-50 dark:bg-gray-700',
          border: 'border-gray-200 dark:border-gray-600',
          icon: <Pause className="h-4 w-4" />,
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'text-gray-600',
          bg: 'bg-gray-50 dark:bg-gray-700',
          border: 'border-gray-200 dark:border-gray-600',
          icon: <AlertCircle className="h-4 w-4" />,
        };
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (barbeiro.status) {
      case 'paused':
        if (isOwnCard) {
          actions.push({
            key: 'entrar',
            label: 'Entrar na Fila',
            icon: <Play className="h-4 w-4" />,
            variant: 'default',
            color: 'bg-green-600 hover:bg-green-700',
          });
        }
        break;

      case 'active':
        if (isOwnCard) {
          actions.push({
            key: 'pausar',
            label: 'Pausar',
            icon: <Pause className="h-4 w-4" />,
            variant: 'outline',
          });

          actions.push({
            key: 'iniciar',
            label: 'Iniciar',
            icon: <Play className="h-4 w-4" />,
            variant: 'default',
            color: 'bg-blue-600 hover:bg-blue-700',
          });
        }

        if (canManage) {
          actions.push({
            key: 'pular',
            label: 'Pular',
            icon: <SkipForward className="h-4 w-4" />,
            variant: 'outline',
          });
        }
        break;

      case 'attending':
        if (isOwnCard) {
          actions.push({
            key: 'finalizar',
            label: 'Finalizar',
            icon: <Square className="h-4 w-4" />,
            variant: 'default',
            color: 'bg-green-600 hover:bg-green-700',
          });
        }
        break;
    }

    return actions;
  };

  const statusConfig = getStatusConfig();
  const actions = getAvailableActions();

  return (
    <div
      className={`
      relative p-4 rounded-lg border transition-all duration-200
      ${statusConfig.bg} ${statusConfig.border}
      ${barbeiro.status === 'attending' ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}
      ${posicao === 1 && barbeiro.status === 'active' ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' : ''}
    `}
    >
      {/* Badge de posição */}
      <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center">
        {posicao === 1 && barbeiro.status === 'active' ? (
          <Trophy className="h-4 w-4 text-yellow-600" />
        ) : (
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {posicao}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between">
        {/* Informações do barbeiro */}
        <div className="flex items-start gap-3 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>

          {/* Dados */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {barbeiro.barbeiro_nome}
              </h3>

              {/* Badge de status */}
              <span
                className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border} border
              `}
              >
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>

            {/* Estatísticas */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {barbeiro.total_atendimentos} atendimento(s)
              </div>

              <div className="flex items-center gap-1">
                <span>•</span>
                {barbeiro.tempo_desde_ultimo}
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 ml-4">
          {actions.map(action => (
            <Button
              key={action.key}
              onClick={() => handleAction(action.key)}
              disabled={loading}
              variant={action.variant}
              className={`
                flex items-center gap-1 text-xs px-3 py-1
                ${action.color || ''}
              `}
            >
              {action.icon}
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Indicador de próximo */}
      {posicao === 1 && barbeiro.status === 'active' && (
        <div className="mt-3 text-xs font-medium text-yellow-700 dark:text-yellow-300 text-center">
          🎯 Próximo da fila
        </div>
      )}

      {/* Indicador de atendendo */}
      {barbeiro.status === 'attending' && (
        <div className="mt-3 text-xs font-medium text-blue-700 dark:text-blue-300 text-center animate-pulse">
          🔵 Atendendo cliente
        </div>
      )}
    </div>
  );
}
