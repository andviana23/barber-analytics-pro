import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const useGoals = (unitId, year, month) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGoals = useCallback(async () => {
    if (!unitId) return;

    setLoading(true);
    setError(null);

    try {
      // 🎯 Usar view vw_goals_detailed para obter achieved_value calculado
      let query = supabase
        .from('vw_goals_detailed')
        .select('*')
        .eq('unit_id', unitId)
        .eq('goal_year', year || new Date().getFullYear());

      // Filtrar por mês apenas se fornecido
      if (month) {
        query = query.eq('goal_month', month);
      }

      const { data, error: fetchError } = await query.order('goal_type');

      if (fetchError) throw fetchError;

      // Debug: verificar dados retornados
      console.log('🎯 useGoals - Dados da view vw_goals_detailed:', data);

      // Se a view não existir, fallback para tabela goals
      if (!data) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('goals')
          .select('*')
          .eq('unit_id', unitId)
          .eq('goal_year', year || new Date().getFullYear())
          .order('goal_type');

        if (fallbackError) throw fallbackError;
        setGoals(fallbackData || []);
      } else {
        setGoals(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar metas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unitId, year, month]);

  const createGoal = useCallback(
    async goalData => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error: insertError } = await supabase
          .from('goals')
          .insert({
            ...goalData,
            created_by: user.id,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Recarregar a lista para garantir que a nova meta apareça
        // mesmo se for para unidade/período diferente
        await fetchGoals();

        return { data, error: null };
      } catch (err) {
        // Tratamento amigável para conflito de unicidade (duplicidade de meta)
        const rawMessage = err?.message || '';
        if (
          err?.code === '23505' ||
          rawMessage.includes('duplicate key value') ||
          rawMessage.includes('ux_goals_monthly') ||
          rawMessage.includes('ux_goals_quarterly') ||
          rawMessage.includes('ux_goals_yearly')
        ) {
          return {
            data: null,
            error:
              'Já existe uma meta para esta unidade, tipo e período selecionados.',
          };
        }
        console.error('Erro ao criar meta:', err);
        return { data: null, error: rawMessage };
      }
    },
    [fetchGoals]
  );

  const updateGoal = useCallback(async (goalId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (updateError) throw updateError;

      setGoals(prev =>
        prev.map(goal => (goal.id === goalId ? { ...goal, ...data } : goal))
      );

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao atualizar meta:', err);
      return { data: null, error: err.message };
    }
  }, []);

  const deleteGoal = useCallback(async goalId => {
    try {
      const { error: deleteError } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (deleteError) throw deleteError;

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      return { error: null };
    } catch (err) {
      console.error('Erro ao deletar meta:', err);
      return { error: err.message };
    }
  }, []);

  const updateAchievedValue = useCallback(
    async (goalType, achievedValue) => {
      try {
        const goal = goals.find(g => g.goal_type === goalType);
        if (!goal) return { error: 'Meta não encontrada' };

        const { error: updateError } = await supabase
          .from('goals')
          .update({ achieved_value: achievedValue })
          .eq('id', goal.id);

        if (updateError) throw updateError;

        setGoals(prev =>
          prev.map(g =>
            g.id === goal.id ? { ...g, achieved_value: achievedValue } : g
          )
        );

        return { error: null };
      } catch (err) {
        console.error('Erro ao atualizar valor atingido:', err);
        return { error: err.message };
      }
    },
    [goals]
  );

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateAchievedValue,
  };
};
