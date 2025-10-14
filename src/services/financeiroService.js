import { supabase } from './supabase';

class FinanceiroService {
  async getReceitas(filters = {}, page = 1, limit = 20) {
    const { data, error } = await supabase
      .from('revenues')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      return { data: [], error: error.message };
    }
    
    return { data: data || [], error: null };
  }
  
  async createReceita(receita) {
    const { data, error } = await supabase
      .from('revenues')
      .insert(receita)
      .select()
      .single();
    
    return error ? { data: null, error: error.message } : { data, error: null };
  }
}

export default new FinanceiroService();
