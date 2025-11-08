import { supabase } from '../services/supabase';

const table = 'parties';

export const partiesRepository = {
  async findByFilters({ unitId, tipo, search, isActive }) {
    let query = supabase.from(table).select('*').eq('unit_id', unitId);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    if (search) {
      query = query.or(`nome.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`);
    }

    query = query.order('nome', { ascending: true });

    const { data, error } = await query;
    return { data, error };
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async create(payload) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();
    return { data, error };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async softDelete(id) {
    const { data, error } = await supabase
      .from(table)
      .update({ is_active: false })
      .eq('id', id)
      .select('id')
      .single();
    return { data, error };
  },

  async activate(id) {
    const { data, error } = await supabase
      .from(table)
      .update({ is_active: true })
      .eq('id', id)
      .select('id')
      .single();
    return { data, error };
  },

  async existsByCpfCnpj(unitId, cpfCnpj) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('unit_id', unitId)
      .eq('cpf_cnpj', cpfCnpj)
      .eq('is_active', true)
      .limit(1);
    return { data, error };
  },
};

export default partiesRepository;
