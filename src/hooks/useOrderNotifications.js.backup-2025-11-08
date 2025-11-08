import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import { ORDER_STATUS_LABELS } from '../constants/orderConstants';

/**
 * useOrderNotifications - Hook para notificações em tempo real de comandas
 *
 * @hook
 * @param {Object} options - Opções de configuração
 * @param {string} options.unitId - ID da unidade para filtrar eventos
 * @param {Function} options.onOrderCreated - Callback quando comanda é criada
 * @param {Function} options.onOrderUpdated - Callback quando comanda é atualizada
 * @param {Function} options.onOrderClosed - Callback quando comanda é fechada
 * @param {Function} options.onOrderCanceled - Callback quando comanda é cancelada
 * @param {boolean} options.showToasts - Exibir notificações toast (padrão: true)
 *
 * @example
 * useOrderNotifications({
 *   unitId: currentUnit.id,
 *   onOrderCreated: (order) => console.log('Nova comanda:', order),
 *   showToasts: true
 * });
 */
const useOrderNotifications = ({
  unitId,
  onOrderCreated,
  onOrderUpdated,
  onOrderClosed,
  onOrderCanceled,
  showToasts = true,
}) => {
  const channelRef = useRef(null);
  const previousStatusRef = useRef(new Map());

  // Determinar tipo de mudança de status
  const getStatusChangeType = useCallback((oldStatus, newStatus) => {
    // Se não temos o status anterior, assumir que é criação
    if (!oldStatus) {
      return 'created';
    }

    // Verificar fechamento
    if (newStatus === 'CLOSED' && oldStatus !== 'CLOSED') {
      return 'closed';
    }

    // Verificar cancelamento
    if (newStatus === 'CANCELED' && oldStatus !== 'CANCELED') {
      return 'canceled';
    }

    // Qualquer outra mudança é uma atualização
    return 'updated';
  }, []);

  // Handler para eventos de INSERT
  const handleInsert = useCallback(
    payload => {
      const order = payload.new;

      if (showToasts) {
        toast.success(
          `Nova comanda criada${order.client_name ? ` - ${order.client_name}` : ''}`,
          {
            icon: '🆕',
            duration: 4000,
          }
        );
      }

      if (onOrderCreated) {
        onOrderCreated(order);
      }

      // Armazenar status inicial
      previousStatusRef.current.set(order.id, order.status);
    },
    [onOrderCreated, showToasts]
  );

  // Handler para eventos de UPDATE
  const handleUpdate = useCallback(
    payload => {
      const order = payload.new;
      const oldStatus = previousStatusRef.current.get(order.id);
      const changeType = getStatusChangeType(oldStatus, order.status);

      // Atualizar status armazenado
      previousStatusRef.current.set(order.id, order.status);

      // Processar baseado no tipo de mudança
      switch (changeType) {
        case 'closed':
          if (showToasts) {
            toast.success(
              `Comanda fechada${order.client_name ? ` - ${order.client_name}` : ''}`,
              {
                icon: '✅',
                duration: 4000,
              }
            );
          }
          if (onOrderClosed) {
            onOrderClosed(order);
          }
          break;

        case 'canceled':
          if (showToasts) {
            toast.error(
              `Comanda cancelada${order.client_name ? ` - ${order.client_name}` : ''}`,
              {
                icon: '❌',
                duration: 4000,
              }
            );
          }
          if (onOrderCanceled) {
            onOrderCanceled(order);
          }
          break;

        case 'updated':
        default:
          if (showToasts && oldStatus !== order.status) {
            const statusLabel =
              ORDER_STATUS_LABELS[order.status] || order.status;
            toast(
              `Comanda atualizada: ${statusLabel}${order.client_name ? ` - ${order.client_name}` : ''}`,
              {
                icon: '🔄',
                duration: 3000,
              }
            );
          }
          if (onOrderUpdated) {
            onOrderUpdated(order);
          }
          break;
      }
    },
    [
      onOrderUpdated,
      onOrderClosed,
      onOrderCanceled,
      showToasts,
      getStatusChangeType,
    ]
  );

  // Handler para eventos de DELETE (soft delete)
  const handleDelete = useCallback(
    payload => {
      const order = payload.old;

      if (showToasts) {
        toast(
          `Comanda removida${order.client_name ? ` - ${order.client_name}` : ''}`,
          {
            icon: '🗑️',
            duration: 3000,
          }
        );
      }

      // Remover do cache de status
      previousStatusRef.current.delete(order.id);
    },
    [showToasts]
  );

  // Configurar subscrição do Realtime
  useEffect(() => {
    if (!unitId) {
      return;
    }

    // Criar canal
    const channel = supabase.channel(`orders_unit_${unitId}`);

    // Subscrever aos eventos da tabela orders
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `unit_id=eq.${unitId}`,
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `unit_id=eq.${unitId}`,
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
          filter: `unit_id=eq.${unitId}`,
        },
        handleDelete
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          // eslint-disable-next-line no-console
          console.log('✅ Notificações de comandas ativadas');
        } else if (status === 'CHANNEL_ERROR') {
          // eslint-disable-next-line no-console
          console.error('❌ Erro ao subscrever notificações de comandas');
          if (showToasts) {
            toast.error('Erro ao ativar notificações em tempo real');
          }
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        // eslint-disable-next-line no-console
        console.log('🔌 Notificações de comandas desativadas');
      }
      previousStatusRef.current.clear();
    };
  }, [unitId, handleInsert, handleUpdate, handleDelete, showToasts]);

  return null;
};

export default useOrderNotifications;
