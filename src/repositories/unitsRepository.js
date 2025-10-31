import { supabase } from '../services/supabase';

const table = 'units';

const defaultSelect = `
  id,
  name,
  user_id,
  is_active,
  created_at,
  updated_at
`;

const formatOrder = query => query.order('name', { ascending: true });

export const unitsRepository = {
  async findAll({ includeInactive = false } = {}) {
    let query = supabase.from(table).select(defaultSelect);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await formatOrder(query);
    return { data, error };
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(table)
      .select(defaultSelect)
      .eq('id', id)
      .single();

    return { data, error };
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select(defaultSelect)
      .single();

    return { data, error };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select(defaultSelect)
      .single();

    return { data, error };
  },

  async hasRevenues(unitId) {
    const { error, count } = await supabase
      .from('revenues')
      .select('id', { count: 'exact', head: true })
      .eq('unit_id', unitId)
      .limit(1);

    return { data: (count ?? 0) > 0, error };
  },

  async hasActiveExpenses(unitId) {
    const { error, count } = await supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .limit(1);

    return { data: (count ?? 0) > 0, error };
  },

  async listRevenuesByPeriod({ unitId, startDate, endDate }) {
    const { data, error } = await supabase
      .from('revenues')
      .select('value, status, type')
      .eq('unit_id', unitId)
      .gte('date', startDate)
      .lt('date', endDate)
      .eq('is_active', true);

    return { data, error };
  },

  async listExpensesByPeriod({ unitId, startDate, endDate }) {
    const { data, error } = await supabase
      .from('expenses')
      .select('value')
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .gte('date', startDate)
      .lt('date', endDate);

    return { data, error };
  },

  async listAttendancesByPeriod({ unitId, startDate, endDate }) {
    const { data, error } = await supabase
      .from('historico_atendimentos')
      .select('valor_servico, duracao_minutos')
      .eq('unidade_id', unitId)
      .eq('status', 'concluido')
      .gte('data_atendimento', startDate)
      .lt('data_atendimento', endDate);

    return { data, error };
  },
};

export default unitsRepository;
