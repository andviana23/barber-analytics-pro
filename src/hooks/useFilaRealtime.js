/* eslint-disable no-console */
import { useState, useEffect, useCallback } from 'react';
import filaService from '../services/filaService';

/**
 * Hook personalizado para gerenciar a fila em tempo real
 * @param {string} unidadeId - ID da unidade para monitorar
 * @returns {Object} Estado e métodos da fila
 */
export default function useFilaRealtime(unidadeId) {
  const [fila, setFila] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Função para carregar dados da fila
  const loadFila = useCallback(async () => {
    if (!unidadeId) return;

    try {
      setError(null);
      const data = await filaService.getFilaOrdenada(unidadeId);
      setFila(data || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar fila:', err);
    } finally {
      setLoading(false);
    }
  }, [unidadeId]);

  // Função de callback para mudanças em tempo real
  const handleRealtimeChange = useCallback(
    payload => {
      console.log('Mudança detectada via Realtime:', payload);

      // Recarregar dados quando houver mudanças
      loadFila();
    },
    [loadFila]
  );

  // Configurar conexão realtime
  useEffect(() => {
    let channel = null;

    if (unidadeId) {
      // Carregar dados iniciais
      loadFila();

      // Configurar listener realtime
      try {
        channel = filaService.setupRealtimeListener(
          unidadeId,
          handleRealtimeChange
        );
        setConnected(true);
      } catch (err) {
        console.error('Erro ao configurar Realtime:', err);
        setConnected(false);
      }
    }

    // Cleanup
    return () => {
      if (channel) {
        filaService.removeRealtimeListener(channel);
        setConnected(false);
      }
    };
  }, [unidadeId, loadFila, handleRealtimeChange]);

  // Auto-refresh como fallback (a cada 30 segundos)
  useEffect(() => {
    if (!connected) {
      const interval = setInterval(loadFila, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, loadFila]);

  // Função para refresh manual
  const refresh = useCallback(() => {
    setLoading(true);
    loadFila();
  }, [loadFila]);

  // Métodos de ação da fila
  const entrarNaFila = useCallback(
    async barbeiroId => {
      try {
        await filaService.entrarNaFila(barbeiroId, unidadeId);
        // Os dados serão atualizados via realtime ou refresh manual
        if (!connected) {
          await loadFila();
        }
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [unidadeId, connected, loadFila]
  );

  const pausarBarbeiro = useCallback(
    async barbeiroId => {
      try {
        await filaService.pausarBarbeiro(barbeiroId, unidadeId);
        if (!connected) {
          await loadFila();
        }
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [unidadeId, connected, loadFila]
  );

  const iniciarAtendimento = useCallback(
    async (barbeiroId, tipoServico) => {
      try {
        const historicoId = await filaService.iniciarAtendimento(
          barbeiroId,
          unidadeId,
          tipoServico
        );
        if (!connected) {
          await loadFila();
        }
        return historicoId;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [unidadeId, connected, loadFila]
  );

  const finalizarAtendimento = useCallback(
    async (historicoId, valorServico, observacoes) => {
      try {
        await filaService.finalizarAtendimento(
          historicoId,
          valorServico,
          observacoes
        );
        if (!connected) {
          await loadFila();
        }
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [connected, loadFila]
  );

  const pularBarbeiro = useCallback(
    async barbeiroId => {
      try {
        await filaService.pularBarbeiro(barbeiroId, unidadeId);
        if (!connected) {
          await loadFila();
        }
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [unidadeId, connected, loadFila]
  );

  return {
    // Estado
    fila,
    loading,
    error,
    connected,
    lastUpdate,

    // Ações
    refresh,
    entrarNaFila,
    pausarBarbeiro,
    iniciarAtendimento,
    finalizarAtendimento,
    pularBarbeiro,

    // Utilitários
    clearError: () => setError(null),
  };
}
