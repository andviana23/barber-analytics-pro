/**
 * paymentMethodsRepository.js
 * Acesso direto ao Supabase para a tabela payment_methods.
 * Mantém operações CRUD e consultas específicas, sem lógica de negócio.
 */

import { supabase } from '../services/supabase';

const table = 'payment_methods';

export const paymentMethodsRepository = {
  async findAll({ unitId, includeInactive = false } = {}) {
    let query = supabase
      .from(table)
      .select(
        `*,
         units:unit_id (id, name)`
      )
      .order('name', { ascending: true });

    if (unitId) query = query.eq('unit_id', unitId);
    if (!includeInactive) query = query.eq('is_active', true);

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
    // created_by é opcional no schema; se quiser registrar, adicione aqui
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
      .select()
      .single();
    return { data, error };
  },

  async activate(id) {
    const { data, error } = await supabase
      .from(table)
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async hardDelete(id) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

export default paymentMethodsRepository;
