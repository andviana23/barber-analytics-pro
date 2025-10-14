import { supabase } from './supabase';

/**
 * Service para gerenciar operações CRUD de parties (clientes e fornecedores)
 */
export class PartiesService {
  
  /**
   * Lista todas as parties com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.unitId - ID da unidade (obrigatório)
   * @param {string} filters.tipo - Tipo da party ('Cliente' ou 'Fornecedor')
   * @param {string} filters.search - Termo de busca (nome, CPF/CNPJ)
   * @param {boolean} filters.isActive - Filtro por status ativo
   * @returns {Object} { data: Party[], error: string|null }
   */
  static async getParties(filters = {}) {
    try {
      const { unitId, tipo, search, isActive = true } = filters;
      
      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      let query = supabase
        .from('parties')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', isActive)
        .order('nome', { ascending: true });

      // Filtrar por tipo se especificado
      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      // Busca por nome ou CPF/CNPJ
      if (search) {
        query = query.or(
          `nome.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca uma party específica por ID
   * @param {string} id - ID da party
   * @returns {Object} { data: Party|null, error: string|null }
   */
  static async getPartyById(id) {
    try {
      if (!id) {
        return { data: null, error: 'ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Cria uma nova party
   * @param {Object} partyData - Dados da party
   * @param {string} partyData.unit_id - ID da unidade
   * @param {string} partyData.nome - Nome da party
   * @param {string} partyData.tipo - Tipo ('Cliente' ou 'Fornecedor')
   * @param {string} partyData.cpf_cnpj - CPF ou CNPJ
   * @param {string} partyData.telefone - Telefone (opcional)
   * @param {string} partyData.email - Email (opcional)
   * @param {string} partyData.endereco - Endereço (opcional)
   * @param {string} partyData.observacoes - Observações (opcional)
   * @returns {Object} { data: Party|null, error: string|null }
   */
  static async createParty(partyData) {
    try {
      // Validações obrigatórias
      const { unit_id, nome, tipo, cpf_cnpj } = partyData;

      if (!unit_id) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      if (!nome) {
        return { data: null, error: 'Nome é obrigatório' };
      }

      if (!tipo || !['Cliente', 'Fornecedor'].includes(tipo)) {
        return { data: null, error: 'Tipo deve ser Cliente ou Fornecedor' };
      }

      if (!cpf_cnpj) {
        return { data: null, error: 'CPF/CNPJ é obrigatório' };
      }

      // Validar CPF/CNPJ
      const cpfCnpjValidation = this.validateCpfCnpj(cpf_cnpj);
      if (!cpfCnpjValidation.isValid) {
        return { data: null, error: cpfCnpjValidation.error };
      }

      // Validar email se fornecido
      if (partyData.email && !this.validateEmail(partyData.email)) {
        return { data: null, error: 'Email inválido' };
      }

      // Verificar se CPF/CNPJ já existe na unidade
      const existingParty = await this.checkCpfCnpjExists(unit_id, cpf_cnpj);
      if (existingParty.exists) {
        return { data: null, error: 'CPF/CNPJ já cadastrado nesta unidade' };
      }

      // Preparar dados para inserção
      const insertData = {
        unit_id,
        nome: nome.trim(),
        tipo,
        cpf_cnpj: cpf_cnpj.replace(/\D/g, ''), // Remove caracteres não numéricos
        telefone: partyData.telefone?.replace(/\D/g, '') || null,
        email: partyData.email?.toLowerCase().trim() || null,
        endereco: partyData.endereco?.trim() || null,
        observacoes: partyData.observacoes?.trim() || null,
        is_active: true
      };

      const { data, error } = await supabase
        .from('parties')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Atualiza uma party existente
   * @param {string} id - ID da party
   * @param {Object} updateData - Dados para atualização
   * @returns {Object} { data: Party|null, error: string|null }
   */
  static async updateParty(id, updateData) {
    try {
      if (!id) {
        return { data: null, error: 'ID é obrigatório' };
      }

      // Validar dados se fornecidos
      if (updateData.tipo && !['Cliente', 'Fornecedor'].includes(updateData.tipo)) {
        return { data: null, error: 'Tipo deve ser Cliente ou Fornecedor' };
      }

      if (updateData.cpf_cnpj) {
        const cpfCnpjValidation = this.validateCpfCnpj(updateData.cpf_cnpj);
        if (!cpfCnpjValidation.isValid) {
          return { data: null, error: cpfCnpjValidation.error };
        }
      }

      if (updateData.email && !this.validateEmail(updateData.email)) {
        return { data: null, error: 'Email inválido' };
      }

      // Preparar dados para atualização
      const cleanData = {};
      
      if (updateData.nome) cleanData.nome = updateData.nome.trim();
      if (updateData.tipo) cleanData.tipo = updateData.tipo;
      if (updateData.cpf_cnpj) cleanData.cpf_cnpj = updateData.cpf_cnpj.replace(/\D/g, '');
      if (updateData.telefone !== undefined) cleanData.telefone = updateData.telefone?.replace(/\D/g, '') || null;
      if (updateData.email !== undefined) cleanData.email = updateData.email?.toLowerCase().trim() || null;
      if (updateData.endereco !== undefined) cleanData.endereco = updateData.endereco?.trim() || null;
      if (updateData.observacoes !== undefined) cleanData.observacoes = updateData.observacoes?.trim() || null;
      if (updateData.is_active !== undefined) cleanData.is_active = updateData.is_active;

      const { data, error } = await supabase
        .from('parties')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Remove uma party (soft delete)
   * @param {string} id - ID da party
   * @returns {Object} { data: boolean, error: string|null }
   */
  static async deleteParty(id) {
    try {
      if (!id) {
        return { data: false, error: 'ID é obrigatório' };
      }

      const { error } = await supabase
        .from('parties')
        .update({ is_active: false })
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
   * Verifica se CPF/CNPJ já existe na unidade
   * @param {string} unitId - ID da unidade
   * @param {string} cpfCnpj - CPF/CNPJ a verificar
   * @returns {Object} { exists: boolean, error: string|null }
   */
  static async checkCpfCnpjExists(unitId, cpfCnpj) {
    try {
      const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');

      const { data, error } = await supabase
        .from('parties')
        .select('id')
        .eq('unit_id', unitId)
        .eq('cpf_cnpj', cleanCpfCnpj)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        return { exists: false, error: error.message };
      }

      return { exists: data && data.length > 0, error: null };
    } catch (err) {
      return { exists: false, error: err.message };
    }
  }

  /**
   * Valida CPF ou CNPJ
   * @param {string} cpfCnpj - CPF/CNPJ para validar
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validateCpfCnpj(cpfCnpj) {
    const numbers = cpfCnpj.replace(/\D/g, '');

    if (numbers.length === 11) {
      return this.validateCpf(numbers);
    } else if (numbers.length === 14) {
      return this.validateCnpj(numbers);
    } else {
      return { isValid: false, error: 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos' };
    }
  }

  /**
   * Valida CPF
   * @param {string} cpf - CPF com apenas números
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validateCpf(cpf) {
    // Verifica sequências iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return { isValid: false, error: 'CPF inválido' };
    }

    // Calcula os dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cpf[9]) !== digit1 || parseInt(cpf[10]) !== digit2) {
      return { isValid: false, error: 'CPF inválido' };
    }

    return { isValid: true, error: null };
  }

  /**
   * Valida CNPJ
   * @param {string} cnpj - CNPJ com apenas números
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validateCnpj(cnpj) {
    // Verifica sequências iguais
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return { isValid: false, error: 'CNPJ inválido' };
    }

    // Calcula primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    // Calcula segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cnpj[12]) !== digit1 || parseInt(cnpj[13]) !== digit2) {
      return { isValid: false, error: 'CNPJ inválido' };
    }

    return { isValid: true, error: null };
  }

  /**
   * Valida email
   * @param {string} email - Email para validar
   * @returns {boolean} true se válido, false caso contrário
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Formata CPF/CNPJ para exibição
   * @param {string} cpfCnpj - CPF/CNPJ com apenas números
   * @returns {string} CPF/CNPJ formatado
   */
  static formatCpfCnpj(cpfCnpj) {
    const numbers = cpfCnpj.replace(/\D/g, '');

    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    return cpfCnpj;
  }

  /**
   * Formata telefone para exibição
   * @param {string} telefone - Telefone com apenas números
   * @returns {string} Telefone formatado
   */
  static formatTelefone(telefone) {
    const numbers = telefone?.replace(/\D/g, '') || '';

    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    return telefone || '';
  }
}

// Alias compatível com hooks/componentes que esperam um export nomeado
export const partiesService = PartiesService;

export default PartiesService;
