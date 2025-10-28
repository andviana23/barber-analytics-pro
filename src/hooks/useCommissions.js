import { useState, useCallback } from 'react';
import orderService from '../services/orderService';
import toast from 'react-hot-toast';

/**
 * 💰 useCommissions Hook
 *
 * Hook customizado para gerenciar comissões de profissionais.
 *
 * Features:
 * - Busca comissões por profissional e período
 * - Cálculo automático de totais (pagas, pendentes)
 * - Filtros avançados (status, comanda, data)
 * - Agrupamento por profissional
 * - Cache de dados
 * - Loading states
 *
 * @author Andrey Viana
 * @module hooks/useCommissions
 */
const useCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Busca comissões com filtros
   */
  const fetchCommissions = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando comissões com filtros:', filters);

      const { data, error: serviceError } =
        await orderService.getCommissionReport(filters);

      if (serviceError) {
        throw new Error(serviceError);
      }

      console.log(`✅ ${data?.length || 0} comissões carregadas`);
      setCommissions(data || []);

      return { data, error: null };
    } catch (err) {
      const errorMsg = err.message || 'Erro ao buscar comissões';
      console.error('❌ Erro ao buscar comissões:', err);
      setError(errorMsg);
      toast.error(errorMsg);

      return { data: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calcula totais de comissões
   */
  const calculateTotals = useCallback(() => {
    return commissions.reduce(
      (acc, item) => {
        const value = item.commission_value || 0;

        acc.totalCommissions += value;
        acc.itemsCount++;

        if (item.status === 'paid') {
          acc.paidCommissions += value;
          acc.paidCount++;
        } else if (item.status === 'pending') {
          acc.pendingCommissions += value;
          acc.pendingCount++;
        }

        return acc;
      },
      {
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
        itemsCount: 0,
        paidCount: 0,
        pendingCount: 0,
      }
    );
  }, [commissions]);

  /**
   * Agrupa comissões por profissional
   */
  const groupByProfessional = useCallback(() => {
    const grouped = commissions.reduce((acc, item) => {
      const professionalId = item.professional_id;

      if (!acc[professionalId]) {
        acc[professionalId] = {
          professionalId,
          professionalName: item.professional_name,
          items: [],
          total: 0,
          paid: 0,
          pending: 0,
          itemCount: 0,
        };
      }

      acc[professionalId].items.push(item);
      acc[professionalId].total += item.commission_value || 0;
      acc[professionalId].itemCount++;

      if (item.status === 'paid') {
        acc[professionalId].paid += item.commission_value || 0;
      } else if (item.status === 'pending') {
        acc[professionalId].pending += item.commission_value || 0;
      }

      return acc;
    }, {});

    return Object.values(grouped);
  }, [commissions]);

  /**
   * Agrupa comissões por data
   */
  const groupByDate = useCallback(() => {
    const grouped = commissions.reduce((acc, item) => {
      const date = item.date;

      if (!acc[date]) {
        acc[date] = {
          date,
          items: [],
          total: 0,
          count: 0,
        };
      }

      acc[date].items.push(item);
      acc[date].total += item.commission_value || 0;
      acc[date].count++;

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [commissions]);

  /**
   * Filtra comissões localmente
   */
  const filterCommissions = useCallback(
    filterFn => {
      return commissions.filter(filterFn);
    },
    [commissions]
  );

  /**
   * Busca comissão específica por ID
   */
  const getCommissionById = useCallback(
    id => {
      return commissions.find(item => item.id === id);
    },
    [commissions]
  );

  /**
   * Busca comissões de um profissional específico
   */
  const getCommissionsByProfessional = useCallback(
    professionalId => {
      return commissions.filter(
        item => item.professional_id === professionalId
      );
    },
    [commissions]
  );

  /**
   * Busca comissões de uma comanda específica
   */
  const getCommissionsByOrder = useCallback(
    orderId => {
      return commissions.filter(item => item.order_id === orderId);
    },
    [commissions]
  );

  /**
   * Calcula média de comissão por profissional
   */
  const calculateAverageByProfessional = useCallback(() => {
    const grouped = groupByProfessional();

    return grouped.map(group => ({
      professionalId: group.professionalId,
      professionalName: group.professionalName,
      average: group.itemCount > 0 ? group.total / group.itemCount : 0,
      itemCount: group.itemCount,
    }));
  }, [groupByProfessional]);

  /**
   * Calcula comissões por período
   */
  const calculateByPeriod = useCallback(
    (period = 'month') => {
      const grouped = commissions.reduce((acc, item) => {
        const date = new Date(item.date);
        let key;

        switch (period) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
            key = `${date.getFullYear()}-W${week}`;
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            key = String(date.getFullYear());
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        if (!acc[key]) {
          acc[key] = {
            period: key,
            total: 0,
            count: 0,
            paid: 0,
            pending: 0,
          };
        }

        acc[key].total += item.commission_value || 0;
        acc[key].count++;

        if (item.status === 'paid') {
          acc[key].paid += item.commission_value || 0;
        } else if (item.status === 'pending') {
          acc[key].pending += item.commission_value || 0;
        }

        return acc;
      }, {});

      return Object.values(grouped).sort((a, b) =>
        b.period.localeCompare(a.period)
      );
    },
    [commissions]
  );

  /**
   * Refetch (recarrega dados)
   */
  const refetch = useCallback(
    async filters => {
      return await fetchCommissions(filters);
    },
    [fetchCommissions]
  );

  /**
   * Limpa dados
   */
  const clearCommissions = useCallback(() => {
    setCommissions([]);
    setError(null);
  }, []);

  return {
    // Estado
    commissions,
    loading,
    error,

    // Operações principais
    fetchCommissions,
    refetch,
    clearCommissions,

    // Cálculos
    calculateTotals,
    calculateAverageByProfessional,
    calculateByPeriod,

    // Agrupamentos
    groupByProfessional,
    groupByDate,

    // Filtros e buscas
    filterCommissions,
    getCommissionById,
    getCommissionsByProfessional,
    getCommissionsByOrder,
  };
};

export default useCommissions;
