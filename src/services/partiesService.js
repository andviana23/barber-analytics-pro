import { partiesRepository } from '../repositories/partiesRepository';
import {
  PartyFiltersDTO,
  CreatePartyDTO,
  UpdatePartyDTO,
} from '../dtos/partiesDTO';

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
      const filtersDTO = new PartyFiltersDTO(filters);

      if (!filtersDTO.isValid()) {
        return {
          data: null,
          error: filtersDTO.getErrors().join(', ') || 'Filtros inválidos',
        };
      }

      const { data, error } = await partiesRepository.findByFilters(
        filtersDTO.toFilters()
      );

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

      const { data, error } = await partiesRepository.findById(id);

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
      const dto = new CreatePartyDTO(partyData);

      if (!dto.isValid()) {
        return {
          data: null,
          error: dto.getErrors().join(', ') || 'Dados inválidos',
        };
      }

      const insertData = dto.toDatabase();

      const cpfCnpjValidation = this.validateCpfCnpj(insertData.cpf_cnpj);
      if (!cpfCnpjValidation.isValid) {
        return { data: null, error: cpfCnpjValidation.error };
      }

      if (insertData.email && !this.validateEmail(insertData.email)) {
        return { data: null, error: 'Email inválido' };
      }

      // Verificar se CPF/CNPJ já existe na unidade
      const { data: existingCpf, error: existsError } =
        await partiesRepository.existsByCpfCnpj(
          insertData.unit_id,
          insertData.cpf_cnpj
        );

      if (existsError) {
        return { data: null, error: existsError.message };
      }

      if (existingCpf && existingCpf.length > 0) {
        return { data: null, error: 'CPF/CNPJ já cadastrado nesta unidade' };
      }

      const { data, error } = await partiesRepository.create(insertData);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Cria um fornecedor rapidamente apenas com o nome
   * Para uso em fluxos ágeis (ex: modal de despesa)
   * CPF/CNPJ é gerado automaticamente (temporário)
   *
   * @param {string} unitId - ID da unidade
   * @param {string} nome - Nome do fornecedor
   * @returns {Object} { data: Party|null, error: string|null }
   */
  static async createQuickSupplier(unitId, nome) {
    try {
      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      if (!nome || nome.trim().length < 2) {
        return { data: null, error: 'Nome deve ter pelo menos 2 caracteres' };
      }

      // Gerar CPF/CNPJ temporário único baseado em timestamp
      // Formato: 99999999999999 (14 dígitos numéricos - limite do campo)
      // Prefixo 99 indica temporário, seguido de 12 dígitos do timestamp
      const timestamp = Date.now().toString().slice(-12); // Últimos 12 dígitos
      const tempCpfCnpj = `99${timestamp}`; // Total: 14 caracteres

      const insertData = {
        unit_id: unitId,
        nome: nome.trim(),
        tipo: 'Fornecedor',
        cpf_cnpj: tempCpfCnpj, // CPF/CNPJ temporário (14 dígitos)
        email: null,
        telefone: null,
        endereco: null,
        is_active: true,
      };

      const { data, error } = await partiesRepository.create(insertData);

      if (error) {
        // Retornar erro detalhado para debugging
        const errorMsg = error.message || 'Erro desconhecido';
        const errorCode = error.code || 'N/A';
        const errorDetails = error.details || error.hint || 'Sem detalhes';

        return {
          data: null,
          error: `Falha ao criar fornecedor: ${errorMsg} (código: ${errorCode}, detalhes: ${errorDetails})`,
        };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: `Erro inesperado: ${err.message}` };
    }
  } /**
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

      const dto = new UpdatePartyDTO(updateData);

      if (!dto.isValid()) {
        return {
          data: null,
          error: dto.getErrors().join(', ') || 'Dados inválidos',
        };
      }

      const cleanData = dto.toDatabase();

      if (cleanData.cpf_cnpj) {
        const cpfCnpjValidation = this.validateCpfCnpj(cleanData.cpf_cnpj);
        if (!cpfCnpjValidation.isValid) {
          return { data: null, error: cpfCnpjValidation.error };
        }
      }

      if (cleanData.email && !this.validateEmail(cleanData.email)) {
        return { data: null, error: 'Email inválido' };
      }

      if (Object.keys(cleanData).length === 0) {
        return { data: null, error: 'Nenhum dado para atualizar' };
      }

      const { data, error } = await partiesRepository.update(id, cleanData);

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

      const { error } = await partiesRepository.softDelete(id);

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

      const { data, error } = await partiesRepository.existsByCpfCnpj(
        unitId,
        cleanCpfCnpj
      );

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
      return {
        isValid: false,
        error: 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos',
      };
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
   * Ativa uma party (reverter soft delete)
   * @param {string} id - ID da party
   * @returns {Object} { data: boolean, error: string|null }
   */
  static async activateParty(id) {
    try {
      if (!id) {
        return { data: false, error: 'ID é obrigatório' };
      }

      const { error } = await partiesRepository.activate(id);

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: false, error: err.message };
    }
  }

  /**
   * Formata CPF ou CNPJ para exibição
   * @param {string} cpfCnpj - CPF/CNPJ com apenas números
   * @returns {string} CPF/CNPJ formatado
   */
  static formatCpfCnpj(cpfCnpj) {
    const numbers = cpfCnpj.replace(/\D/g, '');

    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      return numbers.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5'
      );
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
