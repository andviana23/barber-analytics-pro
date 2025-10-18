import { useState, useEffect, useCallback } from 'react';
import { ProfissionaisService } from '../services/profissionaisService';

/**
 * Hook customizado para gerenciar estado de profissionais
 * @param {Object} initialFilters - Filtros iniciais
 * @returns {Object} Estado e funções para gerenciar profissionais
 */
export function useProfissionais(initialFilters = {}) {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  /**
   * Carrega a lista de profissionais
   */
  const loadProfissionais = useCallback(async () => {
    console.log('🔄 Iniciando carregamento de profissionais...', { filters });

    try {
      setLoading(true);
      setError(null);

      // Remover timeout temporariamente para debug
      console.log('📡 Chamando ProfissionaisService.getProfissionais...');
      const data = await ProfissionaisService.getProfissionais(filters);

      console.log('✅ Profissionais carregados:', data?.length || 0, data);
      setProfissionais(data);
    } catch (err) {
      console.error('❌ Erro ao carregar profissionais:', err);
      console.error('❌ Stack trace:', err.stack);
      console.error('❌ Mensagem:', err.message);
      setError(err.message);
      setProfissionais([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Cria um novo profissional
   */
  const createProfissional = useCallback(
    async profissionalData => {
      try {
        setLoading(true);
        setError(null);

        const newProfissional =
          await ProfissionaisService.createProfissional(profissionalData);

        // Recarregar lista completa após criar para garantir dados corretos
        await loadProfissionais();

        return newProfissional;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadProfissionais]
  );

  /**
   * Atualiza um profissional existente
   */
  const updateProfissional = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      setError(null);

      const updatedProfissional = await ProfissionaisService.updateProfissional(
        id,
        updates
      );

      // Atualizar lista local
      setProfissionais(prev =>
        prev.map(p => (p.id === id ? updatedProfissional : p))
      );

      return updatedProfissional;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Alterna status ativo/inativo de um profissional
   */
  const toggleStatus = useCallback(async id => {
    try {
      setLoading(true);
      setError(null);

      const updatedProfissional =
        await ProfissionaisService.toggleProfissionalStatus(id);

      // Atualizar lista local
      setProfissionais(prev =>
        prev.map(p => (p.id === id ? updatedProfissional : p))
      );

      return updatedProfissional;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove um profissional (soft delete)
   */
  const deleteProfissional = useCallback(async id => {
    try {
      setLoading(true);
      setError(null);

      await ProfissionaisService.deleteProfissional(id);

      // Remover da lista local
      setProfissionais(prev => prev.filter(p => p.id !== id));

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza os filtros e recarrega os dados
   */
  const updateFilters = useCallback(newFilters => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Recarrega os dados
   */
  const refresh = useCallback(() => {
    loadProfissionais();
  }, [loadProfissionais]);

  // Carregar dados iniciais
  useEffect(() => {
    loadProfissionais();
  }, [loadProfissionais]);

  return {
    // Estado
    profissionais,
    loading,
    error,
    filters,

    // Ações
    createProfissional,
    updateProfissional,
    toggleStatus,
    deleteProfissional,
    updateFilters,
    refresh,

    // Utilitários
    totalProfissionais: profissionais.length,
    profissionaisAtivos: profissionais.filter(p => p.is_active).length,
    profissionaisInativos: profissionais.filter(p => !p.is_active).length,
  };
}

export default useProfissionais;
