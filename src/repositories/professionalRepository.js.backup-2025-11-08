import { supabase } from '../services/supabase';

const table = 'professionals';

const baseSelect = `
  id,
  user_id,
  unit_id,
  name,
  role,
  commission_rate,
  is_active,
  created_at,
  units:unit_id (
    id,
    name
  )
`;

const sanitizeSearchTerm = term =>
  term ? term.toString().replace(/[%]/g, '').replace(/["']/g, '').trim() : '';

const selectColumns = includeUnits => (includeUnits ? baseSelect : '*');

export const professionalRepository = {
  async findByFilters({ unitId, isActive, includeUnits = true } = {}) {
    let query = supabase
      .from(table)
      .select(selectColumns(includeUnits))
      .order('name', { ascending: true });

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async findById(id, { includeUnits = true } = {}) {
    const { data, error } = await supabase
      .from(table)
      .select(selectColumns(includeUnits))
      .eq('id', id)
      .single();

    return { data, error };
  },

  async search({ term, unitId, isActive = true, includeUnits = true } = {}) {
    const sanitizedTerm = sanitizeSearchTerm(term);

    let query = supabase
      .from(table)
      .select(selectColumns(includeUnits))
      .order('name', { ascending: true });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    if (sanitizedTerm) {
      query = query.or(
        `name.ilike.%${sanitizedTerm}%,role.ilike.%${sanitizedTerm}%`
      );
    }

    const { data, error } = await query;
    return { data, error };
  },

  async countActiveByUnit() {
    const { data, error } = await supabase
      .from(table)
      .select('unit_id, units:unit_id (name)')
      .eq('is_active', true);

    return { data, error };
  },

  async getRevenuesForProfessional({ professionalId, startDate, endDate }) {
    const { data, error } = await supabase
      .from('revenues')
      .select('value, type, status, date')
      .eq('professional_id', professionalId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_active', true);

    return { data, error };
  },
};

export default professionalRepository;
