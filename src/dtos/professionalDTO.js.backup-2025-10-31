const ALLOWED_ROLES = ['barbeiro', 'gerente', 'admin', 'recepcionista'];

const ROLE_ALIASES = {
  barbeiro: 'barbeiro',
  barber: 'barbeiro',
  barbeira: 'barbeiro',
  gerente: 'gerente',
  manager: 'gerente',
  admin: 'admin',
  administrador: 'admin',
  administradora: 'admin',
  recepcionista: 'recepcionista',
  receptionist: 'recepcionista',
};

const normalizeString = value =>
  typeof value === 'string' ? value.trim() : '';

const normalizeOptionalString = value => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizePercentage = value => {
  if (value === undefined || value === null || value === '') return 0;
  const numberValue = Number(String(value).replace(',', '.'));
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const normalizeBoolean = value =>
  value !== undefined ? Boolean(value) : undefined;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export const isValidUuid = value => UUID_REGEX.test(String(value));

const isValidIsoDate = value => ISO_DATE_REGEX.test(String(value));

const mapRole = role => {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();
  return ROLE_ALIASES[normalized] || null;
};

const clampPercentage = value => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Number(Math.round(value * 100) / 100);
};

export class ProfessionalFiltersDTO {
  constructor(filters = {}) {
    this.unitId = filters.unitId || filters.unit_id || null;
    this.includeUnits =
      filters.includeUnits !== undefined ? Boolean(filters.includeUnits) : true;

    if (filters.isActive !== undefined) {
      this.isActive = Boolean(filters.isActive);
      this.activeOnly = undefined;
    } else if (filters.activeOnly !== undefined) {
      this.activeOnly = Boolean(filters.activeOnly);
      this.isActive = this.activeOnly ? true : undefined;
    } else {
      this.activeOnly = true;
      this.isActive = true;
    }
  }

  isValid() {
    this.errors = [];

    if (this.unitId && !isValidUuid(this.unitId)) {
      this.errors.push('unitId inválido');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'Filtros inválidos';
  }

  toRepositoryFilters() {
    return {
      unitId: this.unitId || undefined,
      isActive: this.isActive,
      includeUnits: this.includeUnits,
    };
  }
}

export class ProfessionalSearchDTO {
  constructor(params = {}) {
    this.term = normalizeString(params.search || params.term || '');
    this.unitId = params.unitId || params.unit_id || null;
    this.includeInactive = Boolean(params.includeInactive);
    this.includeUnits =
      params.includeUnits !== undefined ? Boolean(params.includeUnits) : true;
  }

  isValid() {
    this.errors = [];

    if (this.unitId && !isValidUuid(this.unitId)) {
      this.errors.push('unitId inválido');
    }

    if (this.term.length === 0) {
      this.errors.push('Termo de busca é obrigatório');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'Parâmetros de busca inválidos';
  }

  toRepositoryParams() {
    return {
      term: this.term,
      unitId: this.unitId || undefined,
      isActive: this.includeInactive ? undefined : true,
      includeUnits: this.includeUnits,
    };
  }
}

export class ProfessionalStatsParamsDTO {
  constructor(params = {}) {
    this.professionalId = params.professionalId || params.id || null;
    this.startDate = params.startDate || params.from || null;
    this.endDate = params.endDate || params.to || null;
  }

  isValid() {
    this.errors = [];

    if (!isValidUuid(this.professionalId)) {
      this.errors.push('professionalId inválido');
    }

    if (!isValidIsoDate(this.startDate)) {
      this.errors.push('startDate deve estar no formato YYYY-MM-DD');
    }

    if (!isValidIsoDate(this.endDate)) {
      this.errors.push('endDate deve estar no formato YYYY-MM-DD');
    }

    if (
      this.startDate &&
      this.endDate &&
      new Date(this.startDate) > new Date(this.endDate)
    ) {
      this.errors.push('Período inválido (startDate > endDate)');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return (
      this.getErrors().join(', ') ||
      'Parâmetros inválidos para cálculo de estatísticas'
    );
  }

  toParams() {
    return {
      professionalId: this.professionalId,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }
}

export class ProfessionalPeriodDTO {
  constructor(params = {}) {
    this.startDate = params.startDate || params.from || null;
    this.endDate = params.endDate || params.to || null;
  }

  isValid() {
    this.errors = [];

    if (!isValidIsoDate(this.startDate)) {
      this.errors.push('startDate deve estar no formato YYYY-MM-DD');
    }

    if (!isValidIsoDate(this.endDate)) {
      this.errors.push('endDate deve estar no formato YYYY-MM-DD');
    }

    if (
      this.startDate &&
      this.endDate &&
      new Date(this.startDate) > new Date(this.endDate)
    ) {
      this.errors.push('Período inválido (startDate > endDate)');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'Período inválido';
  }

  toParams() {
    return {
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }
}

export class CreateProfessionalDTO {
  constructor(input = {}) {
    this.user_id = normalizeOptionalString(input.user_id);
    this.unit_id = normalizeOptionalString(input.unit_id);
    this.name = normalizeString(input.name);
    this.role = mapRole(input.role);
    this.commission_rate = clampPercentage(
      normalizePercentage(input.commission_rate)
    );
    this.is_active =
      input.is_active !== undefined ? Boolean(input.is_active) : true;
  }

  isValid() {
    this.errors = [];

    if (!this.name) {
      this.errors.push('Nome é obrigatório');
    }

    if (!this.role || !ALLOWED_ROLES.includes(this.role)) {
      this.errors.push('Role inválido');
    }

    if (this.unit_id && !isValidUuid(this.unit_id)) {
      this.errors.push('unit_id inválido');
    }

    if (this.user_id && !isValidUuid(this.user_id)) {
      this.errors.push('user_id inválido');
    }

    if (this.commission_rate < 0 || this.commission_rate > 100) {
      this.errors.push('commission_rate deve estar entre 0 e 100');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'Dados inválidos para criação';
  }

  toDatabase() {
    return {
      user_id: this.user_id || null,
      unit_id: this.unit_id || null,
      name: this.name,
      role: this.role,
      commission_rate: this.commission_rate,
      is_active: this.is_active,
    };
  }
}

export class UpdateProfessionalDTO {
  constructor(input = {}) {
    this.user_id =
      input.user_id !== undefined
        ? normalizeOptionalString(input.user_id)
        : undefined;
    this.unit_id =
      input.unit_id !== undefined
        ? normalizeOptionalString(input.unit_id)
        : undefined;
    this.name =
      input.name !== undefined ? normalizeString(input.name) : undefined;
    this.role = input.role !== undefined ? mapRole(input.role) : undefined;
    this.commission_rate =
      input.commission_rate !== undefined
        ? clampPercentage(normalizePercentage(input.commission_rate))
        : undefined;
    this.is_active = normalizeBoolean(input.is_active);
  }

  isValid() {
    this.errors = [];

    if (this.unit_id !== undefined && this.unit_id !== null) {
      if (this.unit_id && !isValidUuid(this.unit_id)) {
        this.errors.push('unit_id inválido');
      }
    }

    if (this.user_id !== undefined && this.user_id !== null) {
      if (this.user_id && !isValidUuid(this.user_id)) {
        this.errors.push('user_id inválido');
      }
    }

    if (this.name !== undefined && this.name === '') {
      this.errors.push('Nome não pode ser vazio');
    }

    if (
      this.role !== undefined &&
      this.role &&
      !ALLOWED_ROLES.includes(this.role)
    ) {
      this.errors.push('Role inválido');
    }

    if (
      this.commission_rate !== undefined &&
      (this.commission_rate < 0 || this.commission_rate > 100)
    ) {
      this.errors.push('commission_rate deve estar entre 0 e 100');
    }

    return this.errors.length === 0;
  }

  getErrors() {
    return this.errors || [];
  }

  getErrorMessage() {
    return this.getErrors().join(', ') || 'Dados inválidos para atualização';
  }

  toDatabase() {
    const payload = {};

    if (this.user_id !== undefined) payload.user_id = this.user_id || null;
    if (this.unit_id !== undefined) payload.unit_id = this.unit_id || null;
    if (this.name !== undefined) payload.name = this.name;
    if (this.role !== undefined) payload.role = this.role;
    if (this.commission_rate !== undefined)
      payload.commission_rate = this.commission_rate;
    if (this.is_active !== undefined) payload.is_active = this.is_active;

    return payload;
  }
}

export class ProfessionalResponseDTO {
  constructor(row = {}) {
    this.id = row.id || null;
    this.user_id = row.user_id || null;
    this.unit_id = row.unit_id || null;
    this.name = row.name || '';
    this.role = row.role || null;
    this.commission_rate = Number(row.commission_rate || 0);
    this.is_active = Boolean(row.is_active);
    this.created_at = row.created_at || null;
    this.updated_at = row.updated_at || null;
    this.units = row.units || undefined;
  }

  toObject() {
    return { ...this };
  }
}

export default {
  ProfessionalFiltersDTO,
  ProfessionalSearchDTO,
  ProfessionalStatsParamsDTO,
  ProfessionalPeriodDTO,
  CreateProfessionalDTO,
  UpdateProfessionalDTO,
  ProfessionalResponseDTO,
};
