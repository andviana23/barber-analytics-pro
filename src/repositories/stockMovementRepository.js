import { supabase } from '../services/supabase';
import {
  ALLOWED_STOCK_MOVEMENT_COLUMNS,
  StockMovementResponseDTO,
} from '../dtos/stockMovementDTO';

/**
 * StockMovementRepository - Repository Pattern
 *
 * Encapsula toda a lógica de acesso ao banco de dados para movimentações de estoque.
 * Abstraindo os detalhes de implementação do Supabase, facilitando:
 * - Testes unitários (mock do repository)
 * - Troca de banco de dados no futuro
 * - Manutenibilidade e organização do código
 *
 * Princípios:
 * - Single Responsibility: Apenas acesso a dados
 * - Dependency Inversion: Service depende de abstração, não de implementação
 * - Clean Architecture: Camada de infraestrutura isolada
 *
 * 🛡️ SEGURANÇA: Aplica whitelist antes de inserir no banco
 *
 * @module repositories/stockMovementRepository
 * @see docs/Guia_estoque.md - Sprint 1.2
 */
class StockMovementRepository {
  /**
   * Nome da tabela no banco de dados
   * @private
   */
  tableName = 'stock_movements';

  /**
   * Timeout padrão para operações de rede (10 segundos)
   * @private
   */
  defaultTimeout = 10000;

  /**
   * Normaliza erros do Supabase para mensagens amigáveis
   * @param {Object} error - Erro do Supabase
   * @returns {string} - Mensagem de erro normalizada
   * @private
   */
  normalizeError(error) {
    if (!error) return 'Erro desconhecido';

    // Erros de conectividade
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }

    // Erros de validação/constraint
    if (error.code === '23505') {
      return 'Já existe uma movimentação com essas informações.';
    }

    if (error.code === '23503') {
      return 'Referência inválida. Verifique produto, unidade ou profissional.';
    }

    if (error.code === '23514') {
      return 'Dados inválidos. Verifique quantidade e custo unitário.';
    }

    // Erro específico: estoque insuficiente (gerado pelo trigger)
    if (error.message?.includes('Estoque insuficiente')) {
      return error.message; // Mensagem clara do trigger
    }

    // Erros de autenticação
    if (error.message?.includes('JWT') || error.message?.includes('auth')) {
      return 'Sessão expirada. Faça login novamente.';
    }

    // Fallback para erro genérico
    return error.message || 'Erro interno do sistema. Tente novamente.';
  }

  /**
   * Criar uma nova movimentação de estoque
   *
   * ⚠️ IMPORTANTE: O trigger trg_update_product_stock será disparado automaticamente
   * após INSERT/DELETE para atualizar products.current_stock
   *
   * @param {Object} data - Dados sanitizados (já validados pelo DTO)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async create(data) {
    try {
      console.log('📦 Repository: Criando movimentação de estoque...');
      console.log('📦 Repository: Dados recebidos:', Object.keys(data));

      // 🛡️ SANITIZAÇÃO: Aplicar whitelist
      const sanitizedData = {};
      const blocked = [];

      Object.keys(data).forEach(key => {
        if (ALLOWED_STOCK_MOVEMENT_COLUMNS.includes(key)) {
          sanitizedData[key] = data[key];
        } else {
          blocked.push(key);
        }
      });

      if (blocked.length > 0) {
        console.warn('⚠️ Campos bloqueados:', blocked);
      }

      console.log('✅ Dados sanitizados:', Object.keys(sanitizedData));

      // Inserir no banco
      const { data: movement, error } = await supabase
        .from(this.tableName)
        .insert(sanitizedData)
        .select(
          `
          *,
          product:products(id, name, current_stock, unit_measurement),
          professional:professionals(id, name),
          unit:units(id, name)
        `
        )
        .single();

      if (error) {
        console.error('❌ Erro ao criar movimentação:', error);
        return { data: null, error: this.normalizeError(error) };
      }

      console.log('✅ Movimentação criada:', movement.id);

      // Retornar via ResponseDTO
      return {
        data: new StockMovementResponseDTO(movement).toObject(),
        error: null,
      };
    } catch (err) {
      console.error('❌ Exceção no repository:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }

  /**
   * Buscar movimentações por produto e período
   *
   * @param {string} productId - ID do produto
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<{data: Array|null, error: string|null}>}
   */
  async findByProductAndDate(productId, startDate, endDate) {
    try {
      console.log(
        `📦 Repository: Buscando movimentações do produto ${productId}...`
      );

      let query = supabase
        .from(this.tableName)
        .select(
          `
          *,
          product:products(id, name, unit_measurement),
          professional:professionals(id, name),
          unit:units(id, name)
        `
        )
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Aplicar filtros de data
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: movements, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar movimentações:', error);
        return { data: null, error: this.normalizeError(error) };
      }

      console.log(`✅ ${movements.length} movimentações encontradas`);

      // Retornar via ResponseDTO
      const dtos = movements.map(m =>
        new StockMovementResponseDTO(m).toObject()
      );

      return { data: dtos, error: null };
    } catch (err) {
      console.error('❌ Exceção no repository:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }

  /**
   * Buscar movimentações por unidade (com paginação)
   *
   * @param {string} unitId - ID da unidade
   * @param {Object} filters - Filtros (do FiltersDTO)
   * @param {number} offset - Offset para paginação
   * @param {number} limit - Limite de resultados
   * @returns {Promise<{data: Array|null, error: string|null, totalCount: number}>}
   */
  async findByUnit(unitId, filters = {}, offset = 0, limit = 20) {
    try {
      console.log(
        `📦 Repository: Buscando movimentações da unidade ${unitId}...`
      );

      let query = supabase
        .from(this.tableName)
        .select(
          `
          *,
          product:products(id, name, unit_measurement),
          professional:professionals(id, name),
          unit:units(id, name)
        `,
          { count: 'exact' }
        )
        .eq('unit_id', unitId);

      // Aplicar filtros adicionais
      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters.movement_type) {
        query = query.eq('movement_type', filters.movement_type);
      }

      if (filters.reason) {
        query = query.eq('reason', filters.reason);
      }

      if (filters.performed_by) {
        query = query.eq('performed_by', filters.performed_by);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date.toISOString());
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date.toISOString());
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      // Paginação
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: movements, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar movimentações:', error);
        return { data: null, error: this.normalizeError(error), totalCount: 0 };
      }

      console.log(
        `✅ ${movements.length} de ${count} movimentações encontradas`
      );

      // Retornar via ResponseDTO
      const dtos = movements.map(m =>
        new StockMovementResponseDTO(m).toObject()
      );

      return { data: dtos, error: null, totalCount: count };
    } catch (err) {
      console.error('❌ Exceção no repository:', err);
      return { data: null, error: this.normalizeError(err), totalCount: 0 };
    }
  }

  /**
   * Buscar movimentação por ID
   *
   * @param {string} id - ID da movimentação
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findById(id) {
    try {
      console.log(`📦 Repository: Buscando movimentação ${id}...`);

      const { data: movement, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          product:products(id, name, current_stock, unit_measurement),
          professional:professionals(id, name),
          unit:units(id, name)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar movimentação:', error);
        return { data: null, error: this.normalizeError(error) };
      }

      console.log('✅ Movimentação encontrada');

      return {
        data: new StockMovementResponseDTO(movement).toObject(),
        error: null,
      };
    } catch (err) {
      console.error('❌ Exceção no repository:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }

  /**
   * Atualizar movimentação (apenas notes)
   *
   * @param {string} id - ID da movimentação
   * @param {Object} data - Dados atualizados (do UpdateDTO)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async update(id, data) {
    try {
      console.log(`📦 Repository: Atualizando movimentação ${id}...`);

      const { data: movement, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select(
          `
          *,
          product:products(id, name, unit_measurement),
          professional:professionals(id, name),
          unit:units(id, name)
        `
        )
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar movimentação:', error);
        return { data: null, error: this.normalizeError(error) };
      }

      console.log('✅ Movimentação atualizada');

      return {
        data: new StockMovementResponseDTO(movement).toObject(),
        error: null,
      };
    } catch (err) {
      console.error('❌ Exceção no repository:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }

  /**
   * Deletar movimentação (soft delete)
   *
   * ⚠️ IMPORTANTE: O trigger trg_update_product_stock será disparado
   * e reverterá a movimentação no estoque
   *
   * @param {string} id - ID da movimentação
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async delete(id) {
    try {
      console.log(`📦 Repository: Deletando movimentação ${id}...`);

      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar movimentação:', error);
        return { data: false, error: this.normalizeError(error) };
      }

      console.log('✅ Movimentação deletada (soft delete)');
      return { data: true, error: null };
    } catch (err) {
      console.error('❌ Exceção no repository:', err);
      return { data: false, error: this.normalizeError(err) };
    }
  }

  /**
   * Reverter movimentação (hard delete do banco)
   *
   * ⚠️ USO CUIDADOSO: Deleta fisicamente a movimentação
   * O trigger automaticamente reverterá o estoque
   *
   * @param {string} id - ID da movimentação
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async revert(id) {
    try {
      console.log(`📦 Repository: Revertendo movimentação ${id}...`);

      // Buscar movimentação antes de deletar (para log)
      const { data: movement } = await this.findById(id);

      if (!movement) {
        return { data: false, error: 'Movimentação não encontrada' };
      }

      // Hard delete (dispara trigger que reverte estoque)
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao reverter movimentação:', error);
        return { data: false, error: this.normalizeError(error) };
      }

      console.log(
        `✅ Movimentação revertida: ${movement.movement_type} de ${movement.quantity} unidades`
      );
      return { data: true, error: null };
    } catch (err) {
      console.error('❌ Exceção no repository:', err);
      return { data: false, error: this.normalizeError(err) };
    }
  }

  /**
   * Buscar resumo de movimentações por período (agregado)
   *
   * @param {string} unitId - ID da unidade
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async getSummaryByPeriod(unitId, startDate, endDate) {
    try {
      console.log(`📦 Repository: Buscando resumo de movimentações...`);

      const { data, error } = await supabase.rpc('fn_get_stock_summary', {
        p_unit_id: unitId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) {
        // Se função não existe, fazer agregação manual
        console.warn(
          '⚠️ Função fn_get_stock_summary não existe, usando agregação manual'
        );

        const { data: movements, error: err } = await supabase
          .from(this.tableName)
          .select('movement_type, quantity, total_cost')
          .eq('unit_id', unitId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('is_active', true);

        if (err) {
          return { data: null, error: this.normalizeError(err) };
        }

        // Agregar manualmente
        const summary = {
          total_entries: 0,
          total_exits: 0,
          entries_quantity: 0,
          exits_quantity: 0,
          entries_value: 0,
          exits_value: 0,
        };

        movements.forEach(m => {
          if (m.movement_type === 'ENTRADA') {
            summary.total_entries += 1;
            summary.entries_quantity += m.quantity;
            summary.entries_value += parseFloat(m.total_cost);
          } else {
            summary.total_exits += 1;
            summary.exits_quantity += m.quantity;
            summary.exits_value += parseFloat(m.total_cost);
          }
        });

        return { data: summary, error: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('❌ Exceção no repository:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }
}

// Exportar instância singleton
export const stockMovementRepository = new StockMovementRepository();
export default stockMovementRepository;
