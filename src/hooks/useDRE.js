/**
 * @file useDRE.js
 * @description Hook customizado para gestão do DRE (Demonstração do Resultado do Exercício)
 * @module hooks/useDRE
 * @author AI Agent
 * @date 2024-10-18
 *
 * @description
 * Hook React que gerencia o estado e lógica de negócio do DRE, seguindo os princípios
 * de Clean Code e separação de responsabilidades.
 */

import { useState, useCallback, useEffect } from 'react';
import { dreService } from '../services/dreService';
import { useUnit } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';

/**
 * Hook useDRE
 *
 * Gerencia estado e operações relacionadas ao DRE
 *
 * @param {Object} options - Opções do hook
 * @param {boolean} options.autoLoad - Carregar DRE automaticamente ao montar
 * @param {string} options.initialPeriod - Período inicial ('month', 'year', 'custom')
 * @returns {Object} Estado e métodos do DRE
 *
 * @example
 * const {
 *   dre,
 *   loading,
 *   error,
 *   loadDRE,
 *   exportDRE
 * } = useDRE({ autoLoad: true });
 */
export const useDRE = (options = {}) => {
  const { autoLoad = false, initialPeriod = 'month' } = options;

  const { selectedUnit } = useUnit();
  const { showToast } = useToast();

  // Estados
  const [dre, setDre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(initialPeriod);
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: '',
  });
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  /**
   * Carrega o DRE com base no período selecionado
   */
  const loadDRE = useCallback(
    async (overrideOptions = {}) => {
      if (!selectedUnit) {
        setError(new Error('Nenhuma unidade selecionada'));
        showToast('Selecione uma unidade para visualizar o DRE', 'warning');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let result;
        const unitId = selectedUnit.id;

        // Determinar qual método chamar baseado no período
        const currentPeriod = overrideOptions.period || period;

        switch (currentPeriod) {
          case 'month':
            result = await dreService.calculateCurrentMonthDRE(unitId);
            break;

          case 'year':
            const currentYear = new Date().getFullYear();
            result = await dreService.calculateYearDRE(unitId, currentYear);
            break;

          case 'custom':
            const dates = overrideOptions.customDates || customDates;
            if (!dates.startDate || !dates.endDate) {
              throw new Error('Informe as datas inicial e final');
            }
            result = await dreService.calculateDRE({
              unitId,
              startDate: dates.startDate,
              endDate: dates.endDate,
            });
            break;

          default:
            throw new Error(`Período inválido: ${currentPeriod}`);
        }

        if (result.error) {
          throw result.error;
        }

        setDre(result.data);
        showToast('DRE calculado com sucesso', 'success');
      } catch (err) {
        console.error('Erro ao carregar DRE:', err);
        setError(err);
        showToast(err.message || 'Erro ao calcular DRE', 'error');
      } finally {
        setLoading(false);
      }
    },
    [selectedUnit, period, customDates, showToast]
  );

  /**
   * Carrega DRE de um mês específico
   */
  const loadMonthDRE = useCallback(
    async (year, month) => {
      if (!selectedUnit) {
        showToast('Selecione uma unidade', 'warning');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await dreService.calculateMonthDRE(
          selectedUnit.id,
          year,
          month
        );

        if (result.error) {
          throw result.error;
        }

        setDre(result.data);
        showToast(`DRE de ${month}/${year} calculado com sucesso`, 'success');
      } catch (err) {
        console.error('Erro ao carregar DRE do mês:', err);
        setError(err);
        showToast(err.message || 'Erro ao calcular DRE', 'error');
      } finally {
        setLoading(false);
      }
    },
    [selectedUnit, showToast]
  );

  /**
   * Compara dois períodos
   */
  const comparePeriods = useCallback(
    async (period1, period2) => {
      if (!selectedUnit) {
        showToast('Selecione uma unidade', 'warning');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await dreService.compareDRE({
          unitId: selectedUnit.id,
          period1Start: period1.startDate,
          period1End: period1.endDate,
          period2Start: period2.startDate,
          period2End: period2.endDate,
        });

        if (result.error) {
          throw result.error;
        }

        setComparisonData(result.data);
        setComparisonMode(true);
        showToast('Comparação realizada com sucesso', 'success');
      } catch (err) {
        console.error('Erro ao comparar períodos:', err);
        setError(err);
        showToast(err.message || 'Erro ao comparar períodos', 'error');
      } finally {
        setLoading(false);
      }
    },
    [selectedUnit, showToast]
  );

  /**
   * Exporta o DRE como texto
   */
  const exportDRE = useCallback(() => {
    if (!dre) {
      showToast('Nenhum DRE para exportar', 'warning');
      return null;
    }

    try {
      const text = dreService.exportAsText(dre);

      // Criar arquivo e fazer download
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DRE_${selectedUnit?.name || 'export'}_${dre.periodo.inicio}_${dre.periodo.fim}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('DRE exportado com sucesso', 'success');
      return text;
    } catch (err) {
      console.error('Erro ao exportar DRE:', err);
      showToast('Erro ao exportar DRE', 'error');
      return null;
    }
  }, [dre, selectedUnit, showToast]);

  /**
   * Limpa o DRE atual
   */
  const clearDRE = useCallback(() => {
    setDre(null);
    setError(null);
    setComparisonMode(false);
    setComparisonData(null);
  }, []);

  /**
   * Atualiza o período
   */
  const updatePeriod = useCallback(newPeriod => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setCustomDates({ startDate: '', endDate: '' });
    }
  }, []);

  /**
   * Atualiza as datas customizadas
   */
  const updateCustomDates = useCallback(dates => {
    setCustomDates(dates);
  }, []);

  /**
   * Recarrega o DRE (útil após alterações nos dados)
   */
  const refreshDRE = useCallback(() => {
    if (selectedUnit) {
      loadDRE();
    }
  }, [selectedUnit, loadDRE]);

  // Auto-load DRE quando a unidade mudar (se autoLoad estiver ativo)
  useEffect(() => {
    if (autoLoad && selectedUnit) {
      loadDRE();
    }
  }, [selectedUnit, autoLoad]); // Removido loadDRE para evitar loop

  // Retornar estado e métodos
  return {
    // Estados
    dre,
    loading,
    error,
    period,
    customDates,
    comparisonMode,
    comparisonData,

    // Métodos de carregamento
    loadDRE,
    loadMonthDRE,
    refreshDRE,

    // Comparação
    comparePeriods,

    // Configuração
    updatePeriod,
    updateCustomDates,

    // Utilidades
    exportDRE,
    clearDRE,

    // Informações derivadas
    hasData: !!dre,
    isEmpty:
      dre &&
      dre.receita_bruta.total === 0 &&
      dre.custos_operacionais.total === 0 &&
      dre.despesas_administrativas.total === 0,
  };
};

export default useDRE;
