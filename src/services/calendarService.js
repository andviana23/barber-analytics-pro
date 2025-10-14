import { supabase } from './supabase';

/**
 * Service para gerenciar operações do calendário financeiro
 */
export class CalendarService {
  
  /**
   * Busca eventos do calendário financeiro usando a VIEW vw_calendar_events
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.unitId - ID da unidade (obrigatório)
   * @param {string} filters.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} filters.endDate - Data final (YYYY-MM-DD)
   * @param {string} filters.accountId - ID da conta bancária (opcional)
   * @param {Array} filters.types - Tipos de eventos ['Receber', 'Pagar', 'Compensacao']
   * @param {Array} filters.statuses - Status dos eventos ['Previsto', 'Efetivo', 'Atrasado']
   * @returns {Object} { data: CalendarEvent[], error: string|null }
   */
  static async getCalendarEvents(filters = {}) {
    try {
      const { unitId, startDate, endDate, accountId, types, statuses } = filters;
      
      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      let query = supabase
        .from('vw_calendar_events')
        .select('*')
        .eq('unit_id', unitId)
        .order('event_date', { ascending: true });

      // Filtrar por período se especificado
      if (startDate) {
        query = query.gte('event_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('event_date', endDate);
      }

      // Filtrar por conta bancária
      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      // Filtrar por tipos de evento
      if (types && Array.isArray(types) && types.length > 0) {
        query = query.in('tipo', types);
      }

      // Filtrar por status
      if (statuses && Array.isArray(statuses) && statuses.length > 0) {
        query = query.in('status', statuses);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // Enriquecer dados com informações calculadas
      const enrichedEvents = (data || []).map(event => ({
        ...event,
        is_overdue: this.isEventOverdue(event),
        days_until_due: this.getDaysUntilDue(event),
        amount_formatted: this.formatAmount(event.amount),
        date_formatted: this.formatDate(event.event_date)
      }));

      return { data: enrichedEvents, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca um evento específico do calendário
   * @param {string} id - ID do evento (ref_id da VIEW)
   * @param {string} type - Tipo do evento (ref_type da VIEW)
   * @returns {Object} { data: CalendarEvent|null, error: string|null }
   */
  static async getEventById(id, type) {
    try {
      if (!id || !type) {
        return { data: null, error: 'ID e tipo são obrigatórios' };
      }

      const { data, error } = await supabase
        .from('vw_calendar_events')
        .select('*')
        .eq('ref_id', id)
        .eq('ref_type', type)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Enriquecer com dados detalhados baseado no tipo
      let detailedEvent = { ...data };
      
      if (type === 'Revenue') {
        const revenueDetails = await this.getRevenueDetails(id);
        if (revenueDetails.data) {
          detailedEvent = { ...detailedEvent, details: revenueDetails.data };
        }
      } else if (type === 'Expense') {
        const expenseDetails = await this.getExpenseDetails(id);
        if (expenseDetails.data) {
          detailedEvent = { ...detailedEvent, details: expenseDetails.data };
        }
      }

      return { data: detailedEvent, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca detalhes de uma receita
   * @param {string} revenueId - ID da receita
   * @returns {Object} { data: Revenue|null, error: string|null }
   * @private
   */
  static async getRevenueDetails(revenueId) {
    try {
      const { data, error } = await supabase
        .from('revenues')
        .select(`
          *,
          parties(
            id,
            nome,
            tipo,
            cpf_cnpj,
            telefone,
            email
          ),
          bank_accounts(
            id,
            bank_name,
            account_number,
            nickname
          )
        `)
        .eq('id', revenueId)
        .single();

      return { data, error: error?.message };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca detalhes de uma despesa
   * @param {string} expenseId - ID da despesa
   * @returns {Object} { data: Expense|null, error: string|null }
   * @private
   */
  static async getExpenseDetails(expenseId) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          parties(
            id,
            nome,
            tipo,
            cpf_cnpj,
            telefone,
            email
          ),
          bank_accounts(
            id,
            bank_name,
            account_number,
            nickname
          )
        `)
        .eq('id', expenseId)
        .single();

      return { data, error: error?.message };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Atualiza status de um evento (receita ou despesa)
   * @param {string} id - ID da receita/despesa
   * @param {string} type - Tipo ('Revenue' ou 'Expense')
   * @param {string} status - Novo status
   * @param {Object} additionalData - Dados adicionais (datas de pagamento/recebimento)
   * @returns {Object} { data: boolean, error: string|null }
   */
  static async updateEventStatus(id, type, status, additionalData = {}) {
    try {
      if (!id || !type || !status) {
        return { data: false, error: 'ID, tipo e status são obrigatórios' };
      }

      const tableName = type.toLowerCase() === 'revenue' ? 'revenues' : 'expenses';
      const updateData = { status };

      // Adicionar datas específicas baseado no status
      if (type.toLowerCase() === 'revenue') {
        if (status === 'Recebido' && additionalData.actual_receipt_date) {
          updateData.actual_receipt_date = additionalData.actual_receipt_date;
        }
      } else {
        if (status === 'Pago' && additionalData.actual_payment_date) {
          updateData.actual_payment_date = additionalData.actual_payment_date;
        }
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id);

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: false, error: err.message };
    }
  }

  /**
   * Marca evento como recebido/pago com data atual
   * @param {string} id - ID da receita/despesa
   * @param {string} type - Tipo ('Revenue' ou 'Expense')
   * @returns {Object} { data: boolean, error: string|null }
   */
  static async markEventAsPaid(id, type) {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const status = type.toLowerCase() === 'revenue' ? 'Recebido' : 'Pago';
      
      const additionalData = {};
      if (type.toLowerCase() === 'revenue') {
        additionalData.actual_receipt_date = currentDate;
      } else {
        additionalData.actual_payment_date = currentDate;
      }

      return await this.updateEventStatus(id, type, status, additionalData);
    } catch (err) {
      return { data: false, error: err.message };
    }
  }

  /**
   * Busca eventos agrupados por mês para dashboard
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.unitId - ID da unidade
   * @param {string} filters.year - Ano (YYYY)
   * @returns {Object} { data: MonthlyEvents[], error: string|null }
   */
  static async getEventsByMonth(filters) {
    try {
      const { unitId, year } = filters;
      
      if (!unitId || !year) {
        return { data: null, error: 'Unit ID e ano são obrigatórios' };
      }

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data: events, error } = await this.getCalendarEvents({
        unitId,
        startDate,
        endDate
      });

      if (error) {
        return { data: null, error };
      }

      // Agrupar eventos por mês
      const monthlyData = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        month_name: new Date(0, index).toLocaleString('pt-BR', { month: 'long' }),
        total_events: 0,
        total_receitas_previstas: 0,
        total_receitas_efetivas: 0,
        total_despesas_previstas: 0,
        total_despesas_efetivas: 0,
        events_overdue: 0
      }));

      (events || []).forEach(event => {
        const eventDate = new Date(event.event_date);
        const monthIndex = eventDate.getMonth();
        const monthData = monthlyData[monthIndex];

        monthData.total_events++;

        if (event.tipo === 'Receber') {
          if (event.status === 'Efetivo') {
            monthData.total_receitas_efetivas += event.amount;
          } else {
            monthData.total_receitas_previstas += event.amount;
          }
        } else if (event.tipo === 'Pagar') {
          if (event.status === 'Efetivo') {
            monthData.total_despesas_efetivas += event.amount;
          } else {
            monthData.total_despesas_previstas += event.amount;
          }
        }

        if (event.status === 'Atrasado') {
          monthData.events_overdue++;
        }
      });

      return { data: monthlyData, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca resumo financeiro para um período
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.unitId - ID da unidade
   * @param {string} filters.startDate - Data inicial
   * @param {string} filters.endDate - Data final
   * @returns {Object} { data: Summary, error: string|null }
   */
  static async getFinancialSummary(filters) {
    try {
      const { unitId, startDate, endDate } = filters;
      
      const { data: events, error } = await this.getCalendarEvents({
        unitId,
        startDate,
        endDate
      });

      if (error) {
        return { data: null, error };
      }

      const summary = {
        total_events: 0,
        receitas_previstas: 0,
        receitas_efetivas: 0,
        despesas_previstas: 0,
        despesas_efetivas: 0,
        saldo_previsto: 0,
        saldo_efetivo: 0,
        events_overdue: 0,
        conciliations_pending: 0
      };

      (events || []).forEach(event => {
        summary.total_events++;

        if (event.tipo === 'Receber') {
          if (event.status === 'Efetivo') {
            summary.receitas_efetivas += event.amount;
          } else {
            summary.receitas_previstas += event.amount;
          }
        } else if (event.tipo === 'Pagar') {
          if (event.status === 'Efetivo') {
            summary.despesas_efetivas += event.amount;
          } else {
            summary.despesas_previstas += event.amount;
          }
        }

        if (event.status === 'Atrasado') {
          summary.events_overdue++;
        }
      });

      summary.saldo_previsto = (summary.receitas_previstas + summary.receitas_efetivas) - 
                               (summary.despesas_previstas + summary.despesas_efetivas);
      summary.saldo_efetivo = summary.receitas_efetivas - summary.despesas_efetivas;

      return { data: summary, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Verifica se um evento está em atraso
   * @param {Object} event - Evento do calendário
   * @returns {boolean} true se estiver em atraso
   * @private
   */
  static isEventOverdue(event) {
    if (!event || event.status === 'Efetivo') {
      return false;
    }

    const today = new Date();
    const eventDate = new Date(event.event_date);
    
    return eventDate < today && event.status !== 'Cancelado';
  }

  /**
   * Calcula dias até o vencimento
   * @param {Object} event - Evento do calendário
   * @returns {number} Dias até vencimento (negativo se em atraso)
   * @private
   */
  static getDaysUntilDue(event) {
    if (!event || event.status === 'Efetivo') {
      return 0;
    }

    const today = new Date();
    const eventDate = new Date(event.event_date);
    const diffTime = eventDate - today;
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Formata valor monetário
   * @param {number} amount - Valor a ser formatado
   * @returns {string} Valor formatado
   * @private
   */
  static formatAmount(amount) {
    if (typeof amount !== 'number') {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  /**
   * Formata data
   * @param {string|Date} date - Data a ser formatada
   * @returns {string} Data formatada
   * @private
   */
  static formatDate(date) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('pt-BR');
  }

  /**
   * Busca eventos por categoria/tipo para charts
   * @param {Object} filters - Filtros de busca
   * @returns {Object} { data: CategoryData[], error: string|null }
   */
  static async getEventsByCategory(filters) {
    try {
      const { data: events, error } = await this.getCalendarEvents(filters);

      if (error) {
        return { data: null, error };
      }

      const categories = {};

      (events || []).forEach(event => {
        const category = event.tipo;
        const status = event.status;
        const key = `${category}_${status}`;

        if (!categories[key]) {
          categories[key] = {
            category,
            status,
            count: 0,
            total_amount: 0,
            events: []
          };
        }

        categories[key].count++;
        categories[key].total_amount += event.amount;
        categories[key].events.push(event);
      });

      const categoryData = Object.values(categories);

      return { data: categoryData, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }
}

export const calendarService = new CalendarService();
export default CalendarService;