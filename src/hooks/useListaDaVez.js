/**
 * @file useListaDaVez.js
 * @description Hook customizado para gerenciamento de estado do módulo Lista da Vez
 * @module hooks/useListaDaVez
 * @author AI Agent
 * @date 2024-10-18
 *
 * @description
 * Hook responsável pelo gerenciamento de estado e lógica de UI
 * do módulo Lista da Vez, integrando com o Service layer
 * e fornecendo uma interface reativa para os componentes React.
 */

import { useState, useEffect, useCallback } from 'react';
import { listaDaVezService } from '../services/listaDaVezService';
import { useUnits } from './useUnits';
import { useUnit } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';
import {
  InitializeTurnListDTO,
  AddPointDTO,
  MonthlyHistoryDTO,
  TurnListDTO,
  TurnHistoryDTO,
  TurnListStatsDTO,
} from '../dtos/listaDaVezDTO';

/**
 * Hook customizado para gerenciar estado da Lista da Vez
 * @param {Object} initialFilters - Filtros iniciais
 * @returns {Object} Estado e funções para gerenciar a lista da vez
 */
export function useListaDaVez(initialFilters = {}) {
  const { showToast } = useToast();
  const { units, loading: unitsLoading } = useUnits();
  const { selectedUnit } = useUnit(); // ✅ Usar unidade do contexto global

  // Estados principais
  const [turnList, setTurnList] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    initialFilters.month || null
  );
  const [selectedYear, setSelectedYear] = useState(initialFilters.year || null);

  /**
   * Carrega a lista da vez para a unidade selecionada
   */
  const loadTurnList = useCallback(
    async unitIdParam => {
      // ✅ Garantir que sempre usa string UUID, não objeto
      const unitId =
        typeof unitIdParam === 'object' && unitIdParam?.id
          ? unitIdParam.id
          : unitIdParam || selectedUnit?.id;

      if (!unitId) return;

      console.log('🔄 Carregando lista da vez...', { unitId });

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await listaDaVezService.getTurnList(unitId);

        if (error) {
          throw error;
        }

        // Transformar dados usando DTO
        const formattedData = data.map(item =>
          new TurnListDTO(item).toDisplayFormat()
        );
        setTurnList(formattedData);

        console.log(
          '✅ Lista da vez carregada:',
          formattedData.length,
          'barbeiros'
        );
      } catch (err) {
        console.error('❌ Erro ao carregar lista da vez:', err);
        setError(err.message);
        showToast(`Erro ao carregar lista da vez: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    },
    [selectedUnit, showToast]
  );

  /**
   * Carrega estatísticas da lista da vez
   */
  const loadStats = useCallback(
    async unitIdParam => {
      // ✅ Garantir que sempre usa string UUID, não objeto
      const unitId =
        typeof unitIdParam === 'object' && unitIdParam?.id
          ? unitIdParam.id
          : unitIdParam || selectedUnit?.id;

      if (!unitId) return;

      try {
        const { data, error } =
          await listaDaVezService.getTurnListStats(unitId);

        if (error) {
          throw error;
        }

        const formattedStats = new TurnListStatsDTO(data).toDisplayFormat();
        setStats(formattedStats);
      } catch (err) {
        console.error('❌ Erro ao carregar estatísticas:', err);
      }
    },
    [selectedUnit]
  );

  /**
   * Adiciona um ponto a um barbeiro
   */
  const addPoint = useCallback(
    async professionalId => {
      if (!selectedUnit?.id || !professionalId) {
        showToast('Erro: dados insuficientes para adicionar ponto', 'error');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Validar dados usando DTO
        const dto = new AddPointDTO({
          unitId: selectedUnit.id, // ✅ Usar apenas o ID
          professionalId: professionalId,
        });

        if (!dto.validate()) {
          throw new Error(dto.getErrors().join(', '));
        }

        const { data, error } = await listaDaVezService.addPoint(
          selectedUnit.id, // ✅ Usar apenas o ID
          professionalId
        );

        if (error) {
          throw error;
        }

        // Atualizar lista local
        const updatedList = data.updatedList.map(item =>
          new TurnListDTO(item).toDisplayFormat()
        );
        setTurnList(updatedList);

        // Recarregar estatísticas
        await loadStats(selectedUnit.id); // ✅ Passar o ID explicitamente

        showToast({
          type: 'success',
          message: 'Ponto adicionado com sucesso!',
        });
        console.log('✅ Ponto adicionado:', data);
      } catch (err) {
        console.error('❌ Erro ao adicionar ponto:', err);
        setError(err.message);
        showToast(`Erro ao adicionar ponto: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    },
    [selectedUnit, showToast, loadStats]
  );

  /**
   * Inicializa a lista da vez para uma unidade
   */
  const initializeTurnList = useCallback(
    async unitId => {
      try {
        setLoading(true);
        setError(null);

        // Validar dados usando DTO
        const dto = new InitializeTurnListDTO({ unitId });

        if (!dto.validate()) {
          throw new Error(dto.getErrors().join(', '));
        }

        const { data, error } =
          await listaDaVezService.initializeTurnList(unitId);

        if (error) {
          throw error;
        }

        // Atualizar lista local
        const formattedList = data.turnList.map(item =>
          new TurnListDTO(item).toDisplayFormat()
        );
        setTurnList(formattedList);

        // Recarregar estatísticas
        await loadStats(unitId);

        showToast({
          type: 'success',
          message: 'Lista da vez inicializada com sucesso!',
        });
        console.log('✅ Lista inicializada:', data);
      } catch (err) {
        console.error('❌ Erro ao inicializar lista:', err);
        setError(err.message);
        showToast(`Erro ao inicializar lista: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast, loadStats]
  );

  /**
   * Carrega histórico mensal
   */
  const loadMonthlyHistory = useCallback(
    async (unitId, month, year) => {
      try {
        setLoading(true);
        setError(null);

        // Validar dados usando DTO
        const dto = new MonthlyHistoryDTO({ unitId, month, year });

        if (!dto.validate()) {
          throw new Error(dto.getErrors().join(', '));
        }

        const { data, error } = await listaDaVezService.getMonthlyHistory(
          unitId,
          month,
          year
        );

        if (error) {
          throw error;
        }

        // Transformar dados usando DTO
        const formattedData = data.map(item =>
          new TurnHistoryDTO(item).toDisplayFormat()
        );
        setHistory(formattedData);

        console.log(
          '✅ Histórico mensal carregado:',
          formattedData.length,
          'registros'
        );
      } catch (err) {
        console.error('❌ Erro ao carregar histórico:', err);
        setError(err.message);
        showToast(`Erro ao carregar histórico: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Carrega histórico completo da unidade
   */
  const loadUnitHistory = useCallback(
    async unitId => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await listaDaVezService.getUnitHistory(unitId);

        if (error) {
          throw error;
        }

        // Transformar dados usando DTO
        const formattedData = data.map(monthData => ({
          ...monthData,
          barbers: monthData.barbers.map(item =>
            new TurnHistoryDTO(item).toDisplayFormat()
          ),
        }));
        setHistory(formattedData);

        console.log(
          '✅ Histórico da unidade carregado:',
          formattedData.length,
          'meses'
        );
      } catch (err) {
        console.error('❌ Erro ao carregar histórico da unidade:', err);
        setError(err.message);
        showToast(`Erro ao carregar histórico: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Executa reset mensal manual
   */
  const executeMonthlyReset = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await listaDaVezService.executeMonthlyReset();

      if (error) {
        throw error;
      }

      // Recarregar dados após reset
      if (selectedUnit?.id) {
        await loadTurnList(selectedUnit.id); // ✅ Usar apenas o ID
        await loadStats(selectedUnit.id); // ✅ Usar apenas o ID
      }

      showToast({
        type: 'success',
        message: 'Reset mensal executado com sucesso!',
      });
      console.log('✅ Reset mensal executado:', data);
    } catch (err) {
      console.error('❌ Erro ao executar reset mensal:', err);
      setError(err.message);
      showToast(`Erro ao executar reset mensal: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedUnit, showToast, loadTurnList, loadStats]);

  /**
   * Exporta dados para CSV
   */
  const exportToCSV = useCallback(
    async (data, filename) => {
      try {
        const { data: result, error } = await listaDaVezService.exportToCSV(
          data,
          filename
        );

        if (error) {
          throw error;
        }

        showToast('Dados exportados com sucesso!', 'success');
      } catch (err) {
        console.error('❌ Erro ao exportar CSV:', err);
        showToast(`Erro ao exportar CSV: ${err.message}`, 'error');
      }
    },
    [showToast]
  );

  // ✅ Não precisamos mais de updateSelectedUnit - a unidade vem do contexto global

  /**
   * Atualiza o mês selecionado
   */
  const updateSelectedMonth = useCallback(month => {
    setSelectedMonth(month);
  }, []);

  /**
   * Atualiza o ano selecionado
   */
  const updateSelectedYear = useCallback(year => {
    setSelectedYear(year);
  }, []);

  /**
   * Recarrega todos os dados
   */
  const refresh = useCallback(() => {
    if (selectedUnit?.id) {
      loadTurnList(selectedUnit.id); // ✅ Usar apenas o ID
      loadStats(selectedUnit.id); // ✅ Usar apenas o ID
    }
  }, [selectedUnit, loadTurnList, loadStats]);

  /**
   * Limpa todos os dados
   */
  const clear = useCallback(() => {
    setTurnList([]);
    setHistory([]);
    setStats(null);
    setError(null);
  }, []);

  // Carregar dados iniciais quando a unidade for selecionada
  useEffect(() => {
    if (selectedUnit?.id && !unitsLoading) {
      loadTurnList(selectedUnit.id); // ✅ Passar apenas o ID (UUID string)
      loadStats(selectedUnit.id); // ✅ Passar apenas o ID (UUID string)
    }
  }, [selectedUnit?.id, unitsLoading, loadTurnList, loadStats]); // ✅ Observar apenas o ID

  // Carregar histórico quando mês/ano forem selecionados
  useEffect(() => {
    if (selectedUnit?.id && selectedMonth && selectedYear) {
      loadMonthlyHistory(selectedUnit.id, selectedMonth, selectedYear); // ✅ Passar apenas o ID
    }
  }, [selectedUnit?.id, selectedMonth, selectedYear, loadMonthlyHistory]); // ✅ Observar apenas o ID

  return {
    // Estados
    turnList,
    history,
    stats,
    loading,
    error,
    selectedUnit, // ✅ Vem do UnitContext
    selectedMonth,
    selectedYear,
    units,

    // Ações principais
    addPoint,
    initializeTurnList,
    loadTurnList,
    loadStats,
    loadMonthlyHistory,
    loadUnitHistory,
    executeMonthlyReset,
    exportToCSV,

    // Controles de filtro
    updateSelectedMonth,
    updateSelectedYear,

    // Utilitários
    refresh,
    clear,

    // Estados calculados
    hasTurnList: turnList.length > 0,
    hasHistory: history.length > 0,
    hasStats: stats !== null,
    canAddPoints: selectedUnit && !loading,
    canInitialize: selectedUnit && !loading,
  };
}

export default useListaDaVez;
