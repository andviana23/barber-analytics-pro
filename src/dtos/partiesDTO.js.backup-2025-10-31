const allowedTypes = ['Cliente', 'Fornecedor'];

const normalizeString = value =>
  typeof value === 'string' ? value.trim() : '';

const normalizeOptionalString = value => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeCpfCnpj = value =>
  typeof value === 'string' ? value.replace(/\D/g, '') : '';

const sanitizePhone = value => {
  if (value === undefined || value === null) return null;
  const digits = String(value).replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
};

const isValidEmail = value => {
  if (value === undefined || value === null || value === '') return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(value));
};

export class PartyFiltersDTO {
  constructor(filters = {}) {
    this.unitId = filters.unitId || filters.unit_id || null;
    this.tipo = filters.tipo ? String(filters.tipo).trim() : undefined;
    this.search = filters.search ? String(filters.search).trim() : undefined;

    if (filters.isActive !== undefined) {
      this.isActive = Boolean(filters.isActive);
    } else {
      this.isActive = undefined;
    }
  }

  isValid() {
    this.errors = [];

    if (!this.unitId) {
      this.errors.push('unitId é obrigatório');
    }

    if (this.tipo && !allowedTypes.includes(this.tipo)) {
      this.errors.push('tipo deve ser Cliente ou Fornecedor');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  toFilters() {
    return {
      unitId: this.unitId,
      tipo: this.tipo,
      search: this.search,
      isActive: this.isActive,
    };
  }
}

export class CreatePartyDTO {
  constructor(input = {}) {
    this.unit_id = input.unit_id ? String(input.unit_id).trim() : null;
    this.nome = normalizeString(input.nome);
    this.tipo = input.tipo ? String(input.tipo).trim() : null;
    this.cpf_cnpj = sanitizeCpfCnpj(input.cpf_cnpj ?? '');
    this.razao_social = normalizeOptionalString(input.razao_social);
    this.telefone = sanitizePhone(input.telefone);
    this.email = normalizeOptionalString(input.email)?.toLowerCase() || null;
    this.endereco = normalizeOptionalString(input.endereco);
    this.observacoes = normalizeOptionalString(input.observacoes);
    this.date_of_birth = input.date_of_birth || null;
    this.is_active = true;
  }

  isValid() {
    this.errors = [];

    if (!this.unit_id) this.errors.push('unit_id é obrigatório');
    if (!this.nome) this.errors.push('nome é obrigatório');
    if (!this.tipo || !allowedTypes.includes(this.tipo))
      this.errors.push('tipo deve ser Cliente ou Fornecedor');
    if (!this.cpf_cnpj) this.errors.push('cpf_cnpj é obrigatório');

    if (this.cpf_cnpj && ![11, 14].includes(this.cpf_cnpj.length)) {
      this.errors.push('cpf_cnpj deve ter 11 ou 14 dígitos');
    }

    if (!isValidEmail(this.email)) {
      this.errors.push('email inválido');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  toDatabase() {
    return {
      unit_id: this.unit_id,
      nome: this.nome,
      tipo: this.tipo,
      cpf_cnpj: this.cpf_cnpj,
      razao_social: this.razao_social,
      telefone: this.telefone,
      email: this.email,
      endereco: this.endereco,
      observacoes: this.observacoes,
      date_of_birth: this.date_of_birth,
      is_active: this.is_active,
    };
  }
}

export class UpdatePartyDTO {
  constructor(input = {}) {
    this.nome =
      input.nome !== undefined ? normalizeString(input.nome) : undefined;
    this.tipo =
      input.tipo !== undefined ? String(input.tipo).trim() : undefined;
    this.cpf_cnpj =
      input.cpf_cnpj !== undefined
        ? sanitizeCpfCnpj(input.cpf_cnpj)
        : undefined;
    this.razao_social =
      input.razao_social !== undefined
        ? normalizeOptionalString(input.razao_social)
        : undefined;
    this.telefone =
      input.telefone !== undefined ? sanitizePhone(input.telefone) : undefined;
    this.email =
      input.email !== undefined
        ? normalizeOptionalString(input.email)?.toLowerCase() || null
        : undefined;
    this.endereco =
      input.endereco !== undefined
        ? normalizeOptionalString(input.endereco)
        : undefined;
    this.observacoes =
      input.observacoes !== undefined
        ? normalizeOptionalString(input.observacoes)
        : undefined;
    this.date_of_birth =
      input.date_of_birth !== undefined
        ? input.date_of_birth || null
        : undefined;
    this.is_active =
      input.is_active !== undefined ? Boolean(input.is_active) : undefined;
  }

  isValid() {
    this.errors = [];

    if (
      this.tipo !== undefined &&
      this.tipo !== null &&
      !allowedTypes.includes(this.tipo)
    ) {
      this.errors.push('tipo deve ser Cliente ou Fornecedor');
    }

    if (this.nome !== undefined && this.nome === '') {
      this.errors.push('nome não pode ser vazio');
    }

    if (
      this.cpf_cnpj !== undefined &&
      this.cpf_cnpj !== null &&
      this.cpf_cnpj !== '' &&
      ![11, 14].includes(this.cpf_cnpj.length)
    ) {
      this.errors.push('cpf_cnpj deve ter 11 ou 14 dígitos');
    }

    if (this.email !== undefined && !isValidEmail(this.email)) {
      this.errors.push('email inválido');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  toDatabase() {
    const payload = {};

    if (this.nome !== undefined) payload.nome = this.nome;
    if (this.tipo !== undefined) payload.tipo = this.tipo;
    if (this.cpf_cnpj !== undefined) payload.cpf_cnpj = this.cpf_cnpj;
    if (this.razao_social !== undefined)
      payload.razao_social = this.razao_social;
    if (this.telefone !== undefined) payload.telefone = this.telefone;
    if (this.email !== undefined) payload.email = this.email;
    if (this.endereco !== undefined) payload.endereco = this.endereco;
    if (this.observacoes !== undefined) payload.observacoes = this.observacoes;
    if (this.date_of_birth !== undefined)
      payload.date_of_birth = this.date_of_birth;
    if (this.is_active !== undefined) payload.is_active = this.is_active;

    return payload;
  }
}

export default {
  PartyFiltersDTO,
  CreatePartyDTO,
  UpdatePartyDTO,
};
