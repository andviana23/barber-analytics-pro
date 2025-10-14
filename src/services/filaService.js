/**
 * Serviço para gerenciamento da fila de atendimento
 * Integra com as funções SQL do PostgreSQL via Supabase
 */

/* eslint-disable no-console */
import { supabase } from './supabase';

class FilaService {
  /**
   * Busca a fila ordenada para uma unidade específica
   * @param {string} unidadeId - ID da unidade
   * @returns {Promise<Array>} Lista de barbeiros na fila ordenada
   */
  async getFilaOrdenada(unidadeId) {
    try {
      const { data, error } = await supabase.rpc('get_fila_ordenada', {
        p_unidade_id: unidadeId
      });

      if (error) {
        throw new Error(`Erro ao buscar fila: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro no getFilaOrdenada:', error);
      throw error;
    }
  }

  /**
   * Coloca um barbeiro na fila (ou reativa se já estiver)
   * @param {string} barbeiroId - ID do barbeiro
   * @param {string} unidadeId - ID da unidade
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async entrarNaFila(barbeiroId, unidadeId) {
    try {
      const { data: userId } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('entrar_na_fila', {
        p_barbeiro_id: barbeiroId,
        p_unidade_id: unidadeId,
        p_user_id: userId?.user?.id || null
      });

      if (error) {
        throw new Error(`Erro ao entrar na fila: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro no entrarNaFila:', error);
      throw error;
    }
  }

  /**
   * Pausa um barbeiro na fila
   * @param {string} barbeiroId - ID do barbeiro
   * @param {string} unidadeId - ID da unidade
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async pausarBarbeiro(barbeiroId, unidadeId) {
    try {
      const { data, error } = await supabase.rpc('pausar_barbeiro', {
        p_barbeiro_id: barbeiroId,
        p_unidade_id: unidadeId
      });

      if (error) {
        throw new Error(`Erro ao pausar barbeiro: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro no pausarBarbeiro:', error);
      throw error;
    }
  }

  /**
   * Inicia um atendimento para o barbeiro
   * @param {string} barbeiroId - ID do barbeiro
   * @param {string} unidadeId - ID da unidade
   * @param {string} tipoServico - Tipo de serviço (opcional)
   * @returns {Promise<string>} ID do histórico de atendimento criado
   */
  async iniciarAtendimento(barbeiroId, unidadeId, tipoServico = null) {
    try {
      const { data: userId } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('iniciar_atendimento', {
        p_barbeiro_id: barbeiroId,
        p_unidade_id: unidadeId,
        p_tipo_servico: tipoServico,
        p_user_id: userId?.user?.id || null
      });

      if (error) {
        throw new Error(`Erro ao iniciar atendimento: ${error.message}`);
      }

      return data; // Retorna o ID do histórico criado
    } catch (error) {
      console.error('Erro no iniciarAtendimento:', error);
      throw error;
    }
  }

  /**
   * Finaliza um atendimento
   * @param {string} historicoId - ID do registro de histórico
   * @param {number} valorServico - Valor do serviço (opcional)
   * @param {string} observacoes - Observações (opcional)
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async finalizarAtendimento(historicoId, valorServico = null, observacoes = null) {
    try {
      const { data, error } = await supabase.rpc('finalizar_atendimento', {
        p_historico_id: historicoId,
        p_valor_servico: valorServico,
        p_observacoes: observacoes
      });

      if (error) {
        throw new Error(`Erro ao finalizar atendimento: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro no finalizarAtendimento:', error);
      throw error;
    }
  }

  /**
   * Pula um barbeiro na fila (apenas gerente/admin)
   * @param {string} barbeiroId - ID do barbeiro
   * @param {string} unidadeId - ID da unidade
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async pularBarbeiro(barbeiroId, unidadeId) {
    try {
      const { data, error } = await supabase.rpc('pular_barbeiro', {
        p_barbeiro_id: barbeiroId,
        p_unidade_id: unidadeId
      });

      if (error) {
        throw new Error(`Erro ao pular barbeiro: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro no pularBarbeiro:', error);
      throw error;
    }
  }

  /**
   * Busca o histórico de atendimentos de um barbeiro em um dia específico
   * @param {string} barbeiroId - ID do barbeiro
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Promise<Array>} Lista de atendimentos
   */
  async getHistoricoDiario(barbeiroId, data) {
    try {
      const { data: historico, error } = await supabase
        .from('historico_atendimentos')
        .select(`
          *,
          barbeiro:professionals(name),
          unidade:units(name)
        `)
        .eq('barbeiro_id', barbeiroId)
        .eq('data_atendimento', data)
        .order('hora_inicio', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      return historico || [];
    } catch (error) {
      console.error('Erro no getHistoricoDiario:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas diárias da fila por unidade
   * @param {string} unidadeId - ID da unidade
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Promise<Object>} Estatísticas da unidade
   */
  async getEstatisticasDiarias(unidadeId, data) {
    try {
      // Buscar dados da fila
      const { data: fila, error: filaError } = await supabase
        .from('fila_atendimento')
        .select('*')
        .eq('unidade_id', unidadeId)
        .eq('data_atual', data);

      if (filaError) {
        throw new Error(`Erro ao buscar fila: ${filaError.message}`);
      }

      // Buscar dados do histórico
      const { data: historico, error: historicoError } = await supabase
        .from('historico_atendimentos')
        .select('*')
        .eq('unidade_id', unidadeId)
        .eq('data_atendimento', data)
        .eq('status', 'concluido');

      if (historicoError) {
        throw new Error(`Erro ao buscar histórico: ${historicoError.message}`);
      }

      // Calcular estatísticas
      const totalBarbeiros = fila?.length || 0;
      const barbeirosAtivos = fila?.filter(b => b.status === 'active').length || 0;
      const barbeirosAtendendo = fila?.filter(b => b.status === 'attending').length || 0;
      const totalAtendimentos = historico?.length || 0;
      const valorTotal = historico?.reduce((sum, h) => sum + (h.valor_servico || 0), 0) || 0;
      const tempoMedio = historico?.length > 0 
        ? historico.reduce((sum, h) => sum + (h.duracao_minutos || 0), 0) / historico.length 
        : 0;

      return {
        totalBarbeiros,
        barbeirosAtivos,
        barbeirosAtendendo,
        totalAtendimentos,
        valorTotal,
        tempoMedio: Math.round(tempoMedio),
        ticketMedio: totalAtendimentos > 0 ? valorTotal / totalAtendimentos : 0
      };
    } catch (error) {
      console.error('Erro no getEstatisticasDiarias:', error);
      throw error;
    }
  }

  /**
   * Resetar contadores diários (função administrativa)
   * @returns {Promise<void>}
   */
  async resetarContadoresDiarios() {
    try {
      const { error } = await supabase.rpc('resetar_contadores_diarios');

      if (error) {
        throw new Error(`Erro ao resetar contadores: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no resetarContadoresDiarios:', error);
      throw error;
    }
  }

  /**
   * Configura listener em tempo real para atualizações da fila
   * @param {string} unidadeId - ID da unidade para filtrar
   * @param {function} callback - Função chamada quando há mudanças
   * @returns {Object} Subscription object para cleanup
   */
  setupRealtimeListener(unidadeId, callback) {
    try {
      const channel = supabase
        .channel('fila_realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'fila_atendimento',
            filter: `unidade_id=eq.${unidadeId}`
          },
          (payload) => {
            console.log('Mudança na fila detectada:', payload);
            callback(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public', 
            table: 'historico_atendimentos',
            filter: `unidade_id=eq.${unidadeId}`
          },
          (payload) => {
            console.log('Mudança no histórico detectada:', payload);
            callback(payload);
          }
        )
        .subscribe();

      return channel;
    } catch (error) {
      console.error('Erro ao configurar listener realtime:', error);
      throw error;
    }
  }

  /**
   * Remove listener em tempo real
   * @param {Object} channel - Channel subscription a ser removido
   */
  removeRealtimeListener(channel) {
    try {
      if (channel) {
        supabase.removeChannel(channel);
      }
    } catch (error) {
      console.error('Erro ao remover listener realtime:', error);
    }
  }
}

// Exportar instância singleton
const filaService = new FilaService();
export default filaService;