import { supabase } from './supabase';

export class GoalsService {
  async getGoals(filters = {}) {
    try {
      const {
        unitId,
        year,
        month,
        goalType,
        categoryId,
        isActive = true,
      } = filters;

      // Usar a view otimizada com cálculos automáticos
      let query = supabase.from('vw_goals_detailed').select('*');

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      if (year) {
        query = query.eq('goal_year', year);
      }

      if (month) {
        query = query.eq('goal_month', month);
      }

      if (goalType) {
        query = query.eq('goal_type', goalType);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query
        .order('goal_year', { ascending: false })
        .order('goal_month', { ascending: false, nullsFirst: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      return { data: null, error: error.message };
    }
  }

  async createGoal(goalData) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert(goalData)
        .select(
          `
          *,
          unit:units(id, name)
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      return { data: null, error: error.message };
    }
  }

  async updateGoal(goalId, updates) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select(
          `
          *,
          unit:units(id, name)
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      return { data: null, error: error.message };
    }
  }

  async deleteGoal(goalId) {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
      return { data: null, error: error.message };
    }
  }

  async updateAchievedValue(goalId, achievedValue) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update({ achieved_value: achievedValue })
        .eq('id', goalId)
        .select(
          `
          *,
          unit:units(id, name)
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar valor atingido:', error);
      return { data: null, error: error.message };
    }
  }

  async getGoalsSummary(unitId, year, month) {
    try {
      const { data, error } = await supabase
        .from('vw_goals_detailed')
        .select('*')
        .eq('unit_id', unitId)
        .eq('goal_year', year)
        .eq('goal_month', month)
        .eq('is_active', true);

      if (error) throw error;

      // Organizar metas por tipo (incluindo metas específicas por categoria)
      const summary = {
        revenue_general: data?.filter(
          g => g.goal_type === 'revenue_general' && !g.category_id
        ),
        subscription: data?.filter(g => g.goal_type === 'subscription'),
        product_sales: data?.filter(g => g.goal_type === 'product_sales'),
        expenses: data?.filter(g => g.goal_type === 'expenses'),
        profit: data?.filter(g => g.goal_type === 'profit'),
        // Metas específicas por categoria
        by_category: data?.filter(g => g.category_id !== null),
      };

      return { data: summary, error: null };
    } catch (error) {
      console.error('Erro ao buscar resumo de metas:', error);
      return { data: null, error: error.message };
    }
  }

  async refreshGoalAchievedValue(goalId) {
    try {
      // Chamar a função do banco para recalcular o achieved_value
      const { data, error } = await supabase.rpc(
        'calculate_goal_achieved_value',
        { p_goal_id: goalId }
      );

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao recalcular valor atingido:', error);
      return { data: null, error: error.message };
    }
  }

  async calculateGoalProgress(
    unitId,
    goalType,
    year,
    month,
    categoryId = null
  ) {
    try {
      // Buscar meta usando a view otimizada
      let query = supabase
        .from('vw_goals_detailed')
        .select('*')
        .eq('unit_id', unitId)
        .eq('goal_type', goalType)
        .eq('goal_year', year)
        .eq('is_active', true);

      if (month) {
        query = query.eq('goal_month', month);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      } else {
        query = query.is('category_id', null);
      }

      const { data: goal, error } = await query.single();

      if (error || !goal) {
        return { data: { progress: 0, percentage: 0 }, error: null };
      }

      // A view já calcula automaticamente o achieved_value
      const percentage = goal.progress_percentage || 0;

      return {
        data: {
          progress: goal.achieved_value,
          percentage,
          target: goal.target_value,
          remaining: goal.remaining_value,
          status: goal.status,
          category_name: goal.category_name,
          goal,
        },
        error: null,
      };
    } catch (error) {
      console.error('Erro ao calcular progresso da meta:', error);
      return { data: null, error: error.message };
    }
  }
}

export const goalsService = new GoalsService();
