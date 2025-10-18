import { supabase } from './supabase';

export class GoalsService {
  async getGoals(filters = {}) {
    try {
      const { unitId, year, month, goalType, isActive = true } = filters;
      
      let query = supabase
        .from('goals')
        .select(`
          *,
          unit:units(id, name)
        `);

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

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query.order('goal_type');

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
        .select(`
          *,
          unit:units(id, name)
        `)
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
        .select(`
          *,
          unit:units(id, name)
        `)
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
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

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
        .select(`
          *,
          unit:units(id, name)
        `)
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
        .from('goals')
        .select('*')
        .eq('unit_id', unitId)
        .eq('goal_year', year)
        .eq('goal_month', month)
        .eq('is_active', true);

      if (error) throw error;

      // Organizar metas por tipo
      const summary = {
        revenue_general: data?.find(g => g.goal_type === 'revenue_general'),
        subscription: data?.find(g => g.goal_type === 'subscription'),
        product_sales: data?.find(g => g.goal_type === 'product_sales'),
        expenses: data?.find(g => g.goal_type === 'expenses'),
        profit: data?.find(g => g.goal_type === 'profit')
      };

      return { data: summary, error: null };
    } catch (error) {
      console.error('Erro ao buscar resumo de metas:', error);
      return { data: null, error: error.message };
    }
  }

  async calculateGoalProgress(unitId, goalType, year, month) {
    try {
      // Buscar meta
      const { data: goal } = await supabase
        .from('goals')
        .select('*')
        .eq('unit_id', unitId)
        .eq('goal_type', goalType)
        .eq('goal_year', year)
        .eq('goal_month', month)
        .eq('is_active', true)
        .single();

      if (!goal) {
        return { data: { progress: 0, percentage: 0 }, error: null };
      }

      // Calcular valor atingido baseado no tipo de meta
      let achievedValue = 0;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      switch (goalType) {
        case 'revenue_general':
          const { data: revenues } = await supabase
            .from('revenues')
            .select('value')
            .eq('unit_id', unitId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);
          
          achievedValue = revenues?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;
          break;

        case 'subscription':
          const { data: subscriptions } = await supabase
            .from('revenues')
            .select('value')
            .eq('unit_id', unitId)
            .eq('type', 'subscription')
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);
          
          achievedValue = subscriptions?.reduce((sum, s) => sum + (s.value || 0), 0) || 0;
          break;

        case 'product_sales':
          const { data: products } = await supabase
            .from('revenues')
            .select('value')
            .eq('unit_id', unitId)
            .eq('type', 'product')
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);
          
          achievedValue = products?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
          break;

        case 'expenses':
          const { data: expenses } = await supabase
            .from('expenses')
            .select('value')
            .eq('unit_id', unitId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);
          
          achievedValue = expenses?.reduce((sum, e) => sum + (e.value || 0), 0) || 0;
          break;

        case 'profit':
          // Calcular lucro (receitas - despesas)
          const { data: allRevenues } = await supabase
            .from('revenues')
            .select('value')
            .eq('unit_id', unitId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);

          const { data: allExpenses } = await supabase
            .from('expenses')
            .select('value')
            .eq('unit_id', unitId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);

          const totalRevenues = allRevenues?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;
          const totalExpenses = allExpenses?.reduce((sum, e) => sum + (e.value || 0), 0) || 0;
          achievedValue = totalRevenues - totalExpenses;
          break;
      }

      const percentage = goal.target_value > 0 
        ? Math.round((achievedValue / goal.target_value) * 100) 
        : 0;

      return { 
        data: { 
          progress: achievedValue, 
          percentage,
          target: goal.target_value,
          goal
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao calcular progresso da meta:', error);
      return { data: null, error: error.message };
    }
  }
}

export const goalsService = new GoalsService();
